import os
import time
import traceback
from pathlib import Path

from fastapi import FastAPI, HTTPException

from app.services.image_processor import ImageProcessor
from app.services.token_detector import TokenDetector
from app.services.text_matcher import TextMatcher
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
)

app = FastAPI(
    title="BotC Codex Parser API",
    description="API for extracting Blood on the Clocktower game state from grimoire photographs",
    version="1.0.0"
)

# Directory paths
BASE_DIR = Path(__file__).parent.parent
TEST_IMAGES_DIR = BASE_DIR / "test_images"
REF_IMAGES_DIR = BASE_DIR / "ref-images"
DETECTED_TOKENS_DIR = BASE_DIR / "detected_tokens"

# Cache DEBUG environment variable
DEBUG_MODE = os.getenv("DEBUG", "False").lower() == "true"

# Initialize services
image_processor = ImageProcessor()
token_detector = TokenDetector(min_radius_cm=1, max_radius_cm=3.5)
text_matcher = TextMatcher(REF_IMAGES_DIR)
orb_matcher = ORBMatcher(REF_IMAGES_DIR)
circle_detector = CircleDetector(min_radius=50, blur_sigma=4.5)
player_name_extractor = PlayerNameExtractor(languages=['en'], gpu=False)
token_processor = TokenProcessor(token_detector, DETECTED_TOKENS_DIR)


@app.get("/")
async def root():
    """Root endpoint to test if the API is working"""
    return {
        "status": "success",
        "message": "BotC Grimoire Parser API is running!",
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "botc-grimoire-parser"
    }


@app.get("/api/match-tokens", response_model=MatchTokensResponse)
async def match_tokens_route():
    """
    Match detected tokens (1.png, 2.png, ... in detected_tokens) to ref-images using
    ORB feature matching. Returns JSON with token number, matched character, character type, confidence.
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
    Run extract then match: process grimoire images from test_images, save tokens,
    match to ref-images with ORB, and return JSON with correct character name per token
    (token, player_name, character, character_type, confidence).
    """
    extract_result = run_extract_tokens(
        TEST_IMAGES_DIR,
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
        tokens_out.append(
            ParsedToken(
                token=position,
                player_name=player_name,
                character=m.character if m else None,
                character_type=m.character_type if m else None,
                confidence=m.confidence if m else 0.0,
            )
        )
    return ParseGrimoireResponse(tokens=tokens_out)


@app.get("/api/grimoire/extract-tokens", response_model=GrimoireResponse)
async def extract_tokens_and_names():
    """
    Extract tokens and player names from test_images, then match to characters with ORB.
    Uses run_extract_tokens() and run_match_tokens() under the hood.
    """
    start_time = time.time()
    try:
        extract_result = run_extract_tokens(
            TEST_IMAGES_DIR,
            DETECTED_TOKENS_DIR,
            image_processor,
            circle_detector,
            token_processor,
            player_name_extractor,
        )
        if extract_result.image_count == 0:
            raise HTTPException(
                status_code=404,
                detail="No image files found in test_images directory"
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
        if TEST_IMAGES_DIR.exists():
            image_files = sorted(
                set(
                    list(TEST_IMAGES_DIR.glob("*.jpg"))
                    + list(TEST_IMAGES_DIR.glob("*.jpeg"))
                    + list(TEST_IMAGES_DIR.glob("*.png"))
                    + list(TEST_IMAGES_DIR.glob("*.JPG"))
                    + list(TEST_IMAGES_DIR.glob("*.JPEG"))
                    + list(TEST_IMAGES_DIR.glob("*.PNG"))
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
        processing_time_ms = (time.time() - start_time) * 1000
        error_traceback = traceback.format_exc()
        print(f"Error occurred: {error_traceback}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": str(e),
                "error_type": type(e).__name__,
                "traceback": error_traceback.split("\n") if DEBUG_MODE else None,
            },
        )
