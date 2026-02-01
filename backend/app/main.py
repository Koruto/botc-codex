import os
import time
import traceback
import cv2
from pathlib import Path
from fastapi import FastAPI, HTTPException

from app.services.image_processor import ImageProcessor
from app.services.token_detector import TokenDetector
from app.services.text_matcher import TextMatcher
from app.services.circle_detector import CircleDetector
from app.services.player_name_extractor import PlayerNameExtractor
from app.services.token_processor import TokenProcessor
from app.models.schemas import GrimoireResponse, ImageInfo, ExtractedData, PlayerData, DebugInfo

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


@app.get("/api/grimoire/extract-tokens", response_model=GrimoireResponse)
async def extract_tokens_and_names():
    """
    Part 1 of Processing Pipeline: Extract Tokens and Player Names
    
    This endpoint:
    1. Detects circular tokens using Hough Circle Transform
    2. Extracts token images and text regions
    3. Extracts player names using OCR from regions below tokens
    4. Matches tokens to character types using reference images
    
    Processes all images in the test_images directory.
    """
    start_time = time.time()
    processing_steps = []
    
    try:
        # Find all images in test_images directory (case-insensitive)
        image_files = []
        if TEST_IMAGES_DIR.exists():
            # Use case-insensitive pattern matching
            image_files = list(TEST_IMAGES_DIR.glob("*.jpg")) + \
                         list(TEST_IMAGES_DIR.glob("*.jpeg")) + \
                         list(TEST_IMAGES_DIR.glob("*.png")) + \
                         list(TEST_IMAGES_DIR.glob("*.JPG")) + \
                         list(TEST_IMAGES_DIR.glob("*.JPEG")) + \
                         list(TEST_IMAGES_DIR.glob("*.PNG"))
        
        if not image_files:
            raise HTTPException(
                status_code=404,
                detail="No image files found in test_images directory"
            )
        
        # Sort image files for consistent processing order
        image_files.sort()
        processing_steps.append(f"Found {len(image_files)} image(s) to process")
        processing_steps.append(f"Loaded {len(text_matcher.ref_images)} reference character images")
        
        # Get image info for first image (used for response)
        first_image_info = None
        if image_files:
            first_image_path = image_files[0]
            image_info_dict = image_processor.get_image_info(str(first_image_path))
            first_image_info = ImageInfo(
                filename=first_image_path.name,
                **image_info_dict
            )
        
        # Process all images and collect players
        all_players = []
        total_circles = 0
        
        for img_idx, image_path in enumerate(image_files):
            filename = image_path.name
            processing_steps.append(f"\n--- Processing image {img_idx + 1}/{len(image_files)}: {filename} ---")
            
            # Load image for processing
            image = image_processor.load_image(str(image_path))
            h, w = image.shape[:2]
            
            # Step 1: Detect circles using Hough Circle Transform
            detected_circles = circle_detector.detect_circles(image)
            processing_steps.append(f"Image {img_idx + 1}: Detected {len(detected_circles)} circular tokens")
            total_circles += len(detected_circles)
            
            if not detected_circles:
                processing_steps.append(f"Image {img_idx + 1}: No circles detected, skipping")
                continue
            
            # Step 2: Extract player names using OCR
            player_names = player_name_extractor.extract_names_for_circles(image, detected_circles)
            for idx, name in player_names.items():
                processing_steps.append(f"Image {img_idx + 1}, Token {idx+1}: Extracted player name '{name}'")
            
            # Step 3: Create visualization
            name_regions = token_processor.get_player_name_regions(detected_circles, (h, w))
            vis_image = token_processor.create_visualization(image, detected_circles, name_regions)
            
            # Save visualization
            DETECTED_TOKENS_DIR.mkdir(parents=True, exist_ok=True)
            vis_path = DETECTED_TOKENS_DIR / f"{image_path.stem}_detection.png"
            cv2.imwrite(str(vis_path), vis_image)
            processing_steps.append(f"Image {img_idx + 1}: Saved visualization to {vis_path}")
            
            # Step 4: Extract tokens
            extracted_tokens = token_processor.extract_tokens(image, detected_circles)
            processing_steps.append(f"Image {img_idx + 1}: Extracted {len(extracted_tokens)} tokens")
            
            # Step 5: Save tokens to disk
            base_name = image_path.stem
            saved_tokens = token_processor.save_tokens(extracted_tokens, base_name)
            processing_steps.append(f"Image {img_idx + 1}: Saved {len(saved_tokens)} tokens to disk")
            
            # Step 6: Match tokens to characters
            position_offset = len(all_players)
            for idx, (token, x, y, r) in enumerate(extracted_tokens):
                text_region = token_detector.extract_text_region(token, lower_half=True, region_ratio=0.4)
                match_result = text_matcher.match_character(text_region, threshold=0.3, try_multiple_scales=True)
                player_name = player_names.get(idx, None)
                
                player_data = {
                    "position": position_offset + idx + 1,
                    "player_name": player_name,
                    "character": None,
                    "character_type": None,
                    "is_alive": None,
                    "reminders": [],
                    "match_confidence": None
                }
                
                if match_result:
                    character_name, character_type, confidence = match_result
                    player_data.update({
                        "character": character_name,
                        "character_type": character_type,
                        "match_confidence": round(confidence, 3)
                    })
                    processing_steps.append(
                        f"Image {img_idx + 1}, Token {idx+1}: Matched to {character_name} "
                        f"(confidence: {confidence:.3f})"
                    )
                else:
                    processing_steps.append(f"Image {img_idx + 1}, Token {idx+1}: No character match")
                
                all_players.append(PlayerData(**player_data))
        
        # Calculate processing time
        processing_time_ms = (time.time() - start_time) * 1000
        
        # Build response
        detection_params = circle_detector.get_detection_params()
        # Calculate max_radius from first image dimensions
        if first_image_info:
            min_dimension = min(first_image_info.dimensions[0], first_image_info.dimensions[1])
            detection_params["max_radius"] = int(min_dimension * 0.2)
        else:
            detection_params["max_radius"] = 0
        
        extracted_data = ExtractedData(
            players=all_players,
            metadata={
                "pipeline_stage": "part1_extract_tokens_and_names",
                "images_processed": len(image_files),
                "characters_matched": sum(1 for p in all_players if p.character is not None),
                "total_circles_detected": total_circles,
                "total_players": len(all_players),
                "tokens_saved_to": str(DETECTED_TOKENS_DIR),
                "detection_params": detection_params
            }
        )
        
        debug_info = DebugInfo(
            preprocessing_applied=[],
            processing_steps=processing_steps
        )
        
        # Use first image info, or create a combined one
        if first_image_info:
            image_info = first_image_info
        else:
            image_info = ImageInfo(
                filename=f"{len(image_files)} images processed",
                dimensions=[0, 0],
                file_size_kb=0.0
            )
        
        response = GrimoireResponse(
            status="success",
            processing_method="part1_extract_tokens_and_names",
            processing_time_ms=round(processing_time_ms, 2),
            image_info=image_info,
            extracted_data=extracted_data,
            debug_info=debug_info
        )
        
        return response
        
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
                "traceback": error_traceback.split('\n') if DEBUG_MODE else None
            }
        )
