"""Grimoire processing routes: extract, match, parse, Town Square, upload."""
import logging
import shutil
import tempfile
import time
import traceback
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.config import (
    ALLOWED_IMAGE_TYPES,
    DETECTED_TOKENS_DIR,
    GRIMOIRE_IMAGES_DIR,
    INCLUDE_TRACEBACK_IN_ERROR,
    MAX_UPLOAD_MB,
)
from app.dependencies import (
    circle_detector,
    image_processor,
    orb_matcher,
    player_name_extractor,
    token_processor,
)
from app.models.schemas import (
    DebugInfo,
    ExtractedData,
    GrimoireResponse,
    ImageInfo,
    MatchTokensResponse,
    ParseGrimoireResponse,
    PlayerData,
    TownSquareGameState,
)
from app.adapters.json_formats import normalize_from_json
from app.services.grimoire_pipeline import (
    extract_and_match,
    parsed_tokens_to_town_square,
)
from app.services.match_tokens import match_tokens as run_match_tokens
from app.services.token_processor import TokenProcessor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["grimoire"])


@router.get("/match-tokens", response_model=MatchTokensResponse)
async def match_tokens_route():
    """
    Match tokens in detected_tokens (1.png, 2.png, …) to reference characters via ORB.
    Returns token index, matched character, type, confidence, and is_dead (from -dead refs).
    Run extract-tokens first to populate detected_tokens.
    """
    matches = run_match_tokens(DETECTED_TOKENS_DIR, orb_matcher)
    if not matches:
        raise HTTPException(
            status_code=404,
            detail="No token images (1.png, 2.png, ...) in detected_tokens. Run extract-tokens first.",
        )
    return MatchTokensResponse(matches=matches)


@router.get("/grimoire/parse", response_model=ParseGrimoireResponse)
async def parse_grimoire():
    """
    Extract tokens and player names from grimoire images, match to characters with ORB.
    Returns token index, player_name, character, confidence, and is_dead (from -dead ref images).
    """
    result = extract_and_match(
        GRIMOIRE_IMAGES_DIR,
        DETECTED_TOKENS_DIR,
        image_processor,
        circle_detector,
        token_processor,
        player_name_extractor,
        orb_matcher,
    )
    if result.extract_result.total_tokens == 0:
        return ParseGrimoireResponse(tokens=[])
    return ParseGrimoireResponse(tokens=result.parsed_tokens)


@router.get("/grimoire/townsquare", response_model=TownSquareGameState)
async def parse_townsquare():
    """
    Extract and match grimoire, then return Town Square Load State JSON.
    Use the response in Town Square: Menu > Game State > Load State.
    """
    result = extract_and_match(
        GRIMOIRE_IMAGES_DIR,
        DETECTED_TOKENS_DIR,
        image_processor,
        circle_detector,
        token_processor,
        player_name_extractor,
        orb_matcher,
    )
    if result.extract_result.total_tokens == 0:
        state = TownSquareGameState(edition={"id": "bmr"}, roles="", fabled=[])
        return JSONResponse(
            content=state.model_dump(mode="json"), media_type="application/json"
        )
    state = parsed_tokens_to_town_square(result.parsed_tokens)
    return JSONResponse(
        content=state.model_dump(mode="json"), media_type="application/json"
    )


async def _validate_upload(file: UploadFile) -> bytes:
    """Validate file type and size; return content."""
    if file.content_type and file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type. Allowed: {', '.join(ALLOWED_IMAGE_TYPES)}",
        )
    content = await file.read()
    size_mb = len(content) / (1024 * 1024)
    if size_mb > MAX_UPLOAD_MB:
        raise HTTPException(
            status_code=422,
            detail=f"File too large (max {MAX_UPLOAD_MB} MB).",
        )
    return content


@router.post("/grimoire/process")
async def process_grimoire_image(file: UploadFile = File(..., alias="file")):
    """
    Upload a grimoire image; run extract + match pipeline and return Town Square JSON.
    Accepts multipart/form-data with a single image file (e.g. key "file").
    """
    content = await _validate_upload(file)
    suffix = Path(file.filename or "image").suffix or ".png"
    if suffix.lower() not in (".jpg", ".jpeg", ".png"):
        suffix = ".png"
    temp_source = tempfile.mkdtemp(prefix="grimoire_")
    temp_detected = tempfile.mkdtemp(prefix="detected_")
    try:
        source_path = Path(temp_source) / f"grimoire{suffix}"
        source_path.write_bytes(content)

        process_token_processor = TokenProcessor(
            token_processor.token_detector,
            Path(temp_detected),
        )
        result = extract_and_match(
            Path(temp_source),
            Path(temp_detected),
            image_processor,
            circle_detector,
            process_token_processor,
            player_name_extractor,
            orb_matcher,
        )
        if result.extract_result.total_tokens == 0:
            raise HTTPException(
                status_code=422,
                detail="Couldn't read grimoire; no tokens detected. Try another photo or paste Town Square JSON.",
            )
        state = parsed_tokens_to_town_square(result.parsed_tokens)
        return {"townSquare": state.model_dump(mode="json")}
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("process_grimoire_image failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Couldn't read grimoire; try another photo or paste Town Square JSON.",
        )
    finally:
        shutil.rmtree(temp_source, ignore_errors=True)
        shutil.rmtree(temp_detected, ignore_errors=True)


@router.post("/grimoire/from-json")
async def grimoire_from_json(body: Dict[str, Any]):
    """
    Paste JSON with bluffs, edition, players. We take what you send and return Town Square + meta.
    """
    try:
        town_square, meta = normalize_from_json(body)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return {
        "townSquare": town_square.model_dump(mode="json"),
        "meta": meta.model_dump(mode="json"),
    }


def _collect_image_files(images_dir: Path) -> List[Path]:
    """Collect image paths from directory (jpg, jpeg, png)."""
    if not images_dir.exists():
        return []
    return sorted(
        set(
            list(images_dir.glob("*.jpg"))
            + list(images_dir.glob("*.jpeg"))
            + list(images_dir.glob("*.png"))
            + list(images_dir.glob("*.JPG"))
            + list(images_dir.glob("*.JPEG"))
            + list(images_dir.glob("*.PNG"))
        )
    )


@router.get("/grimoire/extract-tokens", response_model=GrimoireResponse)
async def extract_tokens_and_names():
    """
    Extract token circles and player names from grimoire images, match to reference characters.
    Returns processing metadata, player list with character matches, and pipeline steps.
    """
    start_time = time.time()
    try:
        result = extract_and_match(
            GRIMOIRE_IMAGES_DIR,
            DETECTED_TOKENS_DIR,
            image_processor,
            circle_detector,
            token_processor,
            player_name_extractor,
            orb_matcher,
        )
        if result.extract_result.image_count == 0:
            raise HTTPException(
                status_code=404,
                detail="No grimoire images found in source directory.",
            )
        all_players = [
            PlayerData(
                position=t.token,
                player_name=t.player_name,
                character=t.character,
                character_type=t.character_type,
                is_alive=None,
                reminders=[],
                match_confidence=round(t.confidence, 3) if t.confidence else None,
            )
            for t in result.parsed_tokens
        ]
        processing_time_ms = (time.time() - start_time) * 1000
        image_files = _collect_image_files(GRIMOIRE_IMAGES_DIR)
        first_image_path = image_files[0] if image_files else None
        first_image_info = None
        if first_image_path:
            image_info_dict = image_processor.get_image_info(str(first_image_path))
            first_image_info = ImageInfo(
                filename=first_image_path.name, **image_info_dict
            )
        detection_params = circle_detector.get_detection_params()
        if first_image_info:
            min_dim = min(
                first_image_info.dimensions[0], first_image_info.dimensions[1]
            )
            detection_params["max_radius"] = int(min_dim * 0.2)
        else:
            detection_params["max_radius"] = 0
        extracted_data = ExtractedData(
            players=all_players,
            metadata={
                "pipeline_stage": "part1_extract_tokens_and_names",
                "images_processed": result.extract_result.image_count,
                "characters_matched": sum(1 for p in all_players if p.character),
                "total_circles_detected": result.extract_result.total_tokens,
                "total_players": len(all_players),
                "tokens_saved_to": str(DETECTED_TOKENS_DIR),
                "detection_params": detection_params,
            },
        )
        debug_info = DebugInfo(
            preprocessing_applied=[],
            processing_steps=result.extract_result.processing_steps,
        )
        image_info = (
            first_image_info
            if first_image_info
            else ImageInfo(
                filename=f"{result.extract_result.image_count} images processed",
                dimensions=[0, 0],
                file_size_kb=0.0,
            )
        )
        return GrimoireResponse(
            status="success",
            processing_method="part1_extract_tokens_and_names",
            processing_time_ms=round(processing_time_ms, 2),
            image_info=image_info,
            extracted_data=extracted_data,
            debug_info=debug_info,
        )
    except HTTPException:
        raise
    except Exception as e:
        error_traceback = traceback.format_exc()
        logger.exception("extract-tokens failed: %s", e)
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": error_traceback.split("\n")
                if INCLUDE_TRACEBACK_IN_ERROR
                else None,
            },
        )
