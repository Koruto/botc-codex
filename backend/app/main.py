import logging
import os
import time
import traceback
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse

from app.services.image_processor import ImageProcessor
from app.services.token_detector import TokenDetector
from app.services.orb_matcher import ORBMatcher
from app.services.circle_detector import CircleDetector
from app.services.player_name_extractor import PlayerNameExtractor
from app.services.token_processor import TokenProcessor
from app.services.extract_tokens import extract_tokens as run_extract_tokens
from app.services.match_tokens import match_tokens as run_match_tokens
from app.models.schemas import (
    GrimoireResponse,
    ImageInfo,
    ExtractedData,
    PlayerData,
    DebugInfo,
    MatchTokensResponse,
    ParseGrimoireResponse,
    ParsedToken,
    TownSquareGameState,
    TownSquarePlayer,
)

app = FastAPI(
    title="BotC Codex Parser API",
    description="API for extracting Blood on the Clocktower game state from grimoire photographs",
    version="1.0.0"
)

logger = logging.getLogger(__name__)

BASE_DIR = Path(__file__).parent.parent
GRIMOIRE_IMAGES_DIR = BASE_DIR / "test_images"
REF_IMAGES_DIR = BASE_DIR / "ref-images"
DETECTED_TOKENS_DIR = BASE_DIR / "detected_tokens"

INCLUDE_TRACEBACK_IN_ERROR = os.getenv("DEBUG", "false").lower() == "true"

image_processor = ImageProcessor()
token_detector = TokenDetector(min_radius_cm=1, max_radius_cm=3.5)
orb_matcher = ORBMatcher(REF_IMAGES_DIR)
circle_detector = CircleDetector(min_radius=50, blur_sigma=4.5)
player_name_extractor = PlayerNameExtractor(languages=['en'], gpu=False)
token_processor = TokenProcessor(token_detector, DETECTED_TOKENS_DIR)


@app.get("/")
async def root():
    """Return API status and link to OpenAPI docs."""
    return {
        "status": "success",
        "message": "BotC Grimoire Parser API is running.",
        "docs": "/docs",
    }


@app.get("/api/health")
async def health_check():
    """Health check for load balancers and monitoring."""
    return {"status": "healthy", "service": "botc-grimoire-parser"}


@app.get("/api/match-tokens", response_model=MatchTokensResponse)
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
            detail="No token images (1.png, 2.png, ...) in detected_tokens. Run extract-tokens first."
        )
    return MatchTokensResponse(matches=matches)


@app.get("/api/grimoire/parse", response_model=ParseGrimoireResponse)
async def parse_grimoire():
    """
    Extract tokens and player names from grimoire images, match to characters with ORB.
    Returns token index, player_name, character, confidence, and is_dead (from -dead ref images).
    """
    extract_result = run_extract_tokens(
        GRIMOIRE_IMAGES_DIR,
        DETECTED_TOKENS_DIR,
        image_processor,
        circle_detector,
        token_processor,
        player_name_extractor,
    )
    if extract_result.total_tokens == 0:
        return ParseGrimoireResponse(tokens=[])
    matches = run_match_tokens(DETECTED_TOKENS_DIR, orb_matcher)
    match_by_token = {m.token: m for m in matches}
    tokens_out = []
    for position, player_name in extract_result.positions_with_names:
        m = match_by_token.get(position)
        is_dead = m.is_dead if m is not None else None
        tokens_out.append(
            ParsedToken(
                token=position,
                player_name=player_name,
                character=m.character if m else None,
                character_type=m.character_type if m else None,
                confidence=m.confidence if m else 0.0,
                is_dead=is_dead,
            )
        )
    return ParseGrimoireResponse(tokens=tokens_out)


def _parse_result_to_townsquare(tokens: list) -> TownSquareGameState:
    """
    Build Town Square Load State from parsed tokens: BMR edition, bluffs from unnamed tokens,
    players from named tokens with role and isDead from ORB match.
    """
    bluffs: list = []
    players: list = []
    for t in tokens:
        role_id = t.character or ""
        name = (t.player_name or "").strip() if t.player_name else ""
        if not name:
            if role_id:
                bluffs.append(role_id)
            continue
        players.append(
            TownSquarePlayer(
                name=name,
                id="",
                role=role_id,
                reminders=[],
                isVoteless=False,
                isDead=t.is_dead if t.is_dead is not None else False,
                pronouns="",
            )
        )
    return TownSquareGameState(
        bluffs=bluffs,
        edition={"id": "bmr"},
        roles="",
        fabled=[],
        players=players,
    )


@app.get("/api/grimoire/townsquare", response_model=TownSquareGameState)
async def parse_townsquare():
    """
    Extract and match grimoire, then return Town Square Load State JSON.
    Use the response in Town Square: Menu > Game State > Load State.
    """
    extract_result = run_extract_tokens(
        GRIMOIRE_IMAGES_DIR,
        DETECTED_TOKENS_DIR,
        image_processor,
        circle_detector,
        token_processor,
        player_name_extractor,
    )
    if extract_result.total_tokens == 0:
        state = TownSquareGameState(edition={"id": "bmr"}, roles="", fabled=[])
        return JSONResponse(content=state.model_dump(mode="json"), media_type="application/json")
    matches = run_match_tokens(DETECTED_TOKENS_DIR, orb_matcher)
    match_by_token = {m.token: m for m in matches}
    tokens_out = []
    for position, player_name in extract_result.positions_with_names:
        m = match_by_token.get(position)
        tokens_out.append(
            ParsedToken(
                token=position,
                player_name=player_name,
                character=m.character if m else None,
                character_type=m.character_type if m else None,
                confidence=m.confidence if m else 0.0,
                is_dead=m.is_dead if m is not None else None,
            )
        )
    state = _parse_result_to_townsquare(tokens_out)
    return JSONResponse(content=state.model_dump(mode="json"), media_type="application/json")


@app.get("/api/grimoire/extract-tokens", response_model=GrimoireResponse)
async def extract_tokens_and_names():
    """
    Extract token circles and player names from grimoire images, match to reference characters.
    Returns processing metadata, player list with character matches, and pipeline steps.
    """
    start_time = time.time()
    try:
        extract_result = run_extract_tokens(
            GRIMOIRE_IMAGES_DIR,
            DETECTED_TOKENS_DIR,
            image_processor,
            circle_detector,
            token_processor,
            player_name_extractor,
        )
        if extract_result.image_count == 0:
            raise HTTPException(
                status_code=404,
                detail="No grimoire images found in source directory.",
            )
        matches = run_match_tokens(DETECTED_TOKENS_DIR, orb_matcher)
        match_by_token = {m.token: m for m in matches}
        all_players = []
        for position, player_name in extract_result.positions_with_names:
            m = match_by_token.get(position)
            all_players.append(
                PlayerData(
                    position=position,
                    player_name=player_name,
                    character=m.character if m else None,
                    character_type=m.character_type if m else None,
                    is_alive=None,
                    reminders=[],
                    match_confidence=round(m.confidence, 3) if m else None,
                )
            )
        processing_time_ms = (time.time() - start_time) * 1000
        image_files = []
        if GRIMOIRE_IMAGES_DIR.exists():
            image_files = sorted(
                set(
                    list(GRIMOIRE_IMAGES_DIR.glob("*.jpg"))
                    + list(GRIMOIRE_IMAGES_DIR.glob("*.jpeg"))
                    + list(GRIMOIRE_IMAGES_DIR.glob("*.png"))
                    + list(GRIMOIRE_IMAGES_DIR.glob("*.JPG"))
                    + list(GRIMOIRE_IMAGES_DIR.glob("*.JPEG"))
                    + list(GRIMOIRE_IMAGES_DIR.glob("*.PNG"))
                )
            )
        first_image_path = image_files[0] if image_files else None
        first_image_info = None
        if first_image_path:
            image_info_dict = image_processor.get_image_info(str(first_image_path))
            first_image_info = ImageInfo(filename=first_image_path.name, **image_info_dict)
        detection_params = circle_detector.get_detection_params()
        if first_image_info:
            min_dim = min(first_image_info.dimensions[0], first_image_info.dimensions[1])
            detection_params["max_radius"] = int(min_dim * 0.2)
        else:
            detection_params["max_radius"] = 0
        extracted_data = ExtractedData(
            players=all_players,
            metadata={
                "pipeline_stage": "part1_extract_tokens_and_names",
                "images_processed": extract_result.image_count,
                "characters_matched": sum(1 for p in all_players if p.character is not None),
                "total_circles_detected": extract_result.total_tokens,
                "total_players": len(all_players),
                "tokens_saved_to": str(DETECTED_TOKENS_DIR),
                "detection_params": detection_params,
            },
        )
        debug_info = DebugInfo(
            preprocessing_applied=[],
            processing_steps=extract_result.processing_steps,
        )
        image_info = (
            first_image_info
            if first_image_info
            else ImageInfo(
                filename=f"{extract_result.image_count} images processed",
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
                "traceback": error_traceback.split("\n") if INCLUDE_TRACEBACK_IN_ERROR else None,
            },
        )
