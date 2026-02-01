"""
Extract tokens from grimoire images: detect circles, save token images (1.png, 2.png, ...),
save detection.png, and extract player names per position. Used by /api/grimoire/extract-tokens
and by the combined /api/grimoire/parse pipeline.
"""
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional, Tuple

import cv2

from app.services.circle_detector import CircleDetector
from app.services.image_processor import ImageProcessor
from app.services.player_name_extractor import PlayerNameExtractor
from app.services.token_processor import TokenProcessor


@dataclass
class ExtractResult:
    """Result of running the extract-tokens pipeline (no character matching)."""
    # List of (position, player_name) in order; position is 1-based
    positions_with_names: List[Tuple[int, Optional[str]]]
    processing_steps: List[str]
    total_tokens: int
    image_count: int


def extract_tokens(
    test_images_dir: Path,
    detected_tokens_dir: Path,
    image_processor: ImageProcessor,
    circle_detector: CircleDetector,
    token_processor: TokenProcessor,
    player_name_extractor: PlayerNameExtractor,
) -> ExtractResult:
    """
    Run the extract-tokens pipeline: find grimoire images, detect circles, save
    token images as 1.png, 2.png, ... and detection.png, and extract player names.
    Does not perform character matching.
    """
    processing_steps: List[str] = []
    positions_with_names: List[Tuple[int, Optional[str]]] = []
    total_tokens = 0

    if not test_images_dir.exists():
        processing_steps.append("test_images directory not found")
        return ExtractResult(
            positions_with_names=[],
            processing_steps=processing_steps,
            total_tokens=0,
            image_count=0,
        )

    image_files = (
        list(test_images_dir.glob("*.jpg"))
        + list(test_images_dir.glob("*.jpeg"))
        + list(test_images_dir.glob("*.png"))
        + list(test_images_dir.glob("*.JPG"))
        + list(test_images_dir.glob("*.JPEG"))
        + list(test_images_dir.glob("*.PNG"))
    )
    image_files = sorted(set(image_files))

    if not image_files:
        processing_steps.append("No image files found in test_images")
        return ExtractResult(
            positions_with_names=[],
            processing_steps=processing_steps,
            total_tokens=0,
            image_count=0,
        )

    processing_steps.append(f"Found {len(image_files)} image(s) to process")
    detected_tokens_dir.mkdir(parents=True, exist_ok=True)
    position = 0

    for img_idx, image_path in enumerate(image_files):
        filename = image_path.name
        processing_steps.append(f"--- Processing image {img_idx + 1}/{len(image_files)}: {filename} ---")

        image = image_processor.load_image(str(image_path))
        h, w = image.shape[:2]

        detected_circles = circle_detector.detect_circles(image)
        processing_steps.append(f"Image {img_idx + 1}: Detected {len(detected_circles)} circular tokens")
        total_tokens += len(detected_circles)

        if not detected_circles:
            processing_steps.append(f"Image {img_idx + 1}: No circles detected, skipping")
            continue

        player_names = player_name_extractor.extract_names_for_circles(image, detected_circles)
        for idx, name in player_names.items():
            processing_steps.append(f"Image {img_idx + 1}, Token {idx + 1}: Extracted player name '{name}'")

        name_regions = token_processor.get_player_name_regions(detected_circles, (h, w))
        vis_image = token_processor.create_visualization(image, detected_circles, name_regions)
        vis_path = detected_tokens_dir / "detection.png"
        cv2.imwrite(str(vis_path), vis_image)
        processing_steps.append(f"Image {img_idx + 1}: Saved visualization to {vis_path}")

        extracted_tokens = token_processor.extract_tokens(image, detected_circles)
        processing_steps.append(f"Image {img_idx + 1}: Extracted {len(extracted_tokens)} tokens")

        token_processor.save_tokens(extracted_tokens, image_path.stem)
        processing_steps.append(f"Image {img_idx + 1}: Saved {len(extracted_tokens)} tokens to disk")

        for idx in range(len(extracted_tokens)):
            position += 1
            player_name = player_names.get(idx)
            positions_with_names.append((position, player_name))

    return ExtractResult(
        positions_with_names=positions_with_names,
        processing_steps=processing_steps,
        total_tokens=total_tokens,
        image_count=len(image_files),
    )
