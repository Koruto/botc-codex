"""
App config: paths and constants shared by routers and services.
"""
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
GRIMOIRE_IMAGES_DIR = BASE_DIR / "test_images"
REF_IMAGES_DIR = BASE_DIR / "ref-images"
DETECTED_TOKENS_DIR = BASE_DIR / "detected_tokens"
GAMES_DIR = BASE_DIR / "games"

MAX_UPLOAD_MB = 10
ALLOWED_IMAGE_TYPES = ("image/jpeg", "image/png", "image/jpg")

INCLUDE_TRACEBACK_IN_ERROR = os.getenv("DEBUG", "false").lower() == "true"
