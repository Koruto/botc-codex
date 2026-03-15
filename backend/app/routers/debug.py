"""
Debug pipeline endpoint - no auth required.

POST /api/debug/pipeline
  Accepts a multipart image upload (field "file"), runs every pipeline stage,
  and returns a detailed JSON trace of each step.

  When the filesystem is writable (local dev), debug images are also saved to
  detected_tokens/debug_<timestamp>/ so you can inspect what the pipeline sees.
  On Render (read-only FS) the image-saving steps are skipped gracefully.
"""
import logging
import time
import traceback
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse

from app.config import DETECTED_TOKENS_DIR
from app.dependencies import (
    circle_detector,
    orb_matcher,
    player_name_extractor,
    token_processor,
)
from app.services.match_tokens import match_tokens as run_match_tokens
from app.services.token_processor import TokenProcessor
from app.utils.circle_order import sort_circles_reading_order

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/debug", tags=["debug"])


def _ms(t0: float) -> float:
    return round((time.time() - t0) * 1000, 2)


def _step(steps: List[Dict], name: str, ok: bool, detail: Any = None, error: str = None):
    entry: Dict[str, Any] = {"step": name, "ok": ok}
    if detail is not None:
        entry["detail"] = detail
    if error:
        entry["error"] = error
    steps.append(entry)


def _try_mkdir(path: Path) -> bool:
    """Create directory; return False (and stay silent) if filesystem is read-only."""
    try:
        path.mkdir(parents=True, exist_ok=True)
        return True
    except OSError:
        return False


def _try_imwrite(path: Path, img: np.ndarray) -> bool:
    """Write image; return False silently if filesystem is read-only."""
    try:
        cv2.imwrite(str(path), img)
        return True
    except OSError:
        return False


@router.post("/pipeline")
async def debug_pipeline(file: UploadFile = File(...)):
    """
    Run the full grimoire pipeline step-by-step and return a verbose JSON trace.
    No authentication required.
    Debug images are saved locally when the filesystem allows it.
    """
    steps: List[Dict] = []
    t0 = time.time()

    # ------------------------------------------------------------------
    # 1. Read upload
    # ------------------------------------------------------------------
    try:
        content = await file.read()
        _step(steps, "1_read_upload", True, {
            "filename": file.filename,
            "content_type": file.content_type,
            "size_bytes": len(content),
        })
    except Exception as e:
        _step(steps, "1_read_upload", False, error=str(e))
        return JSONResponse(status_code=500, content={"steps": steps, "elapsed_ms": _ms(t0)})

    # ------------------------------------------------------------------
    # 2. Decode image
    # ------------------------------------------------------------------
    try:
        arr = np.frombuffer(content, dtype=np.uint8)
        image = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("cv2.imdecode returned None – not a valid image file")
        h, w = image.shape[:2]
        _step(steps, "2_decode_image", True, {"width": w, "height": h, "channels": image.shape[2]})
    except Exception as e:
        _step(steps, "2_decode_image", False, error=str(e))
        return JSONResponse(status_code=422, content={"steps": steps, "elapsed_ms": _ms(t0)})

    # ------------------------------------------------------------------
    # 3. Debug output directory (optional – skipped on read-only FS)
    # ------------------------------------------------------------------
    debug_tag = f"debug_{int(t0)}"
    debug_dir: Optional[Path] = None
    dir_available = _try_mkdir(DETECTED_TOKENS_DIR / debug_tag)
    if dir_available:
        debug_dir = DETECTED_TOKENS_DIR / debug_tag
        _step(steps, "3_debug_dir", True, {"path": str(debug_dir)})
    else:
        _step(steps, "3_debug_dir", False, error="Filesystem is read-only – debug images will not be saved")

    # ------------------------------------------------------------------
    # 4. Circle detection
    # ------------------------------------------------------------------
    detected_circles: List = []
    try:
        detected_circles = circle_detector.detect_circles(image)
        _step(steps, "4_circle_detector", True, {
            "circles_found": len(detected_circles),
            "params": circle_detector.get_detection_params(),
            "circles": [{"x": int(x), "y": int(y), "r": int(r)} for x, y, r in detected_circles],
        })
    except Exception:
        _step(steps, "4_circle_detector", False, error=traceback.format_exc())
        return JSONResponse(status_code=500, content={"steps": steps, "elapsed_ms": _ms(t0)})

    if not detected_circles:
        _step(steps, "4_circle_detector_check", False,
              error="No circles detected – pipeline cannot continue. Try a clearer photo.")
        return JSONResponse(status_code=200, content={"steps": steps, "elapsed_ms": _ms(t0)})

    # ------------------------------------------------------------------
    # 5. Sort circles in reading order
    # ------------------------------------------------------------------
    sorted_circles = detected_circles
    try:
        sorted_circles = sort_circles_reading_order(detected_circles)
        _step(steps, "5_sort_circles", True, {
            "order": [{"x": int(x), "y": int(y), "r": int(r)} for x, y, r in sorted_circles],
        })
    except Exception as e:
        _step(steps, "5_sort_circles", False, error=str(e))

    # ------------------------------------------------------------------
    # 6. Detection visualisation (saved locally when FS is writable)
    # ------------------------------------------------------------------
    try:
        name_regions = token_processor.get_player_name_regions(sorted_circles, (h, w))
        vis = token_processor.create_visualization(image, sorted_circles, name_regions)
        if debug_dir:
            _try_imwrite(debug_dir / "detection.png", vis)
            _try_imwrite(DETECTED_TOKENS_DIR / "detection.png", vis)
        _step(steps, "6_detection_vis", True, {
            "saved": bool(debug_dir),
            "path": str(debug_dir / "detection.png") if debug_dir else None,
        })
    except Exception as e:
        _step(steps, "6_detection_vis", False, error=str(e))

    # ------------------------------------------------------------------
    # 7. Extract + save token images
    # ------------------------------------------------------------------
    extracted_tokens = []
    try:
        if debug_dir:
            debug_tp = TokenProcessor(token_processor.token_detector, debug_dir)
            extracted_tokens = debug_tp.extract_tokens(image, sorted_circles)
            debug_tp.save_tokens(extracted_tokens, "debug")

            canonical_tp = TokenProcessor(token_processor.token_detector, DETECTED_TOKENS_DIR)
            canonical_tp.save_tokens(extracted_tokens, "grimoire")
        else:
            extracted_tokens = token_processor.extract_tokens(image, sorted_circles)

        _step(steps, "7_extract_tokens", True, {
            "tokens_extracted": len(extracted_tokens),
            "saved": bool(debug_dir),
        })
    except Exception:
        _step(steps, "7_extract_tokens", False, error=traceback.format_exc())

    # ------------------------------------------------------------------
    # 8. Player name OCR (per circle)
    # ------------------------------------------------------------------
    player_names: Dict[int, str] = {}
    for idx, (x, y, r) in enumerate(sorted_circles):
        try:
            region = player_name_extractor.extract_player_name_region(image, (int(x), int(y)))

            if debug_dir:
                _try_imwrite(debug_dir / f"name_region_{idx + 1}.png", region)
                try:
                    processed = player_name_extractor._preprocess_for_ocr(region)
                    _try_imwrite(debug_dir / f"name_region_{idx + 1}_preprocessed.png", processed)
                except Exception:
                    pass

            name = player_name_extractor.extract_name_from_region(region)
            player_names[idx] = name or ""
            _step(steps, f"8_ocr_token_{idx + 1}", True, {
                "circle": {"x": int(x), "y": int(y), "r": int(r)},
                "extracted_name": name,
            })
        except Exception as e:
            player_names[idx] = ""
            _step(steps, f"8_ocr_token_{idx + 1}", False, error=str(e))

    # ------------------------------------------------------------------
    # 9. ORB character matching
    # ------------------------------------------------------------------
    matches = []
    try:
        matches = run_match_tokens(DETECTED_TOKENS_DIR, orb_matcher)
        _step(steps, "9_orb_matching", True, {
            "matches_found": len(matches),
            "matches": [
                {
                    "token": m.token,
                    "character": m.character,
                    "character_type": m.character_type,
                    "confidence": round(m.confidence, 4),
                    "is_dead": m.is_dead,
                }
                for m in matches
            ],
        })
    except Exception:
        _step(steps, "9_orb_matching", False, error=traceback.format_exc())

    # ------------------------------------------------------------------
    # 10. Summary
    # ------------------------------------------------------------------
    summary = {
        "total_circles": len(sorted_circles),
        "names_extracted": sum(1 for n in player_names.values() if n),
        "characters_matched": len(matches),
        "debug_images_saved": bool(debug_dir),
        "debug_images_dir": str(debug_dir) if debug_dir else None,
        "players": [
            {
                "position": idx + 1,
                "circle": {"x": int(x), "y": int(y), "r": int(r)},
                "player_name": player_names.get(idx, "") or "",
                "character": next((m.character for m in matches if m.token == idx + 1), None),
                "confidence": next(
                    (round(m.confidence, 4) for m in matches if m.token == idx + 1), None
                ),
                "is_dead": next((m.is_dead for m in matches if m.token == idx + 1), None),
            }
            for idx, (x, y, r) in enumerate(sorted_circles)
        ],
    }
    _step(steps, "10_summary", True, summary)

    return JSONResponse(content={
        "steps": steps,
        "summary": summary,
        "elapsed_ms": _ms(t0),
    })
