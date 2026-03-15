"""
Shared service instances for routers. Initialized once at import.
"""
from app.config import DETECTED_TOKENS_DIR, REF_IMAGES_DIR
from app.services.circle_detector import CircleDetector
from app.services.image_processor import ImageProcessor
from app.services.orb_matcher import ORBMatcher
from app.services.player_name_extractor import PlayerNameExtractor
from app.services.token_detector import TokenDetector
from app.services.token_processor import TokenProcessor

# Processing pipeline (grimoire extract + match)
image_processor = ImageProcessor()
token_detector = TokenDetector(min_radius_cm=1, max_radius_cm=3.5)
orb_matcher = ORBMatcher(REF_IMAGES_DIR)
circle_detector = CircleDetector(min_radius=50, blur_sigma=4.5)
player_name_extractor = PlayerNameExtractor()
token_processor = TokenProcessor(token_detector, DETECTED_TOKENS_DIR)
