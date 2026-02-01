import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple, Optional, Dict
from app.utils.character_matcher import get_character_type
from app.utils.image_utils import ensure_grayscale


class TextMatcher:
    """Match extracted text regions with reference images"""
    
    def __init__(self, ref_images_dir: Path, match_scales: List[float] = None):
        self.ref_images_dir = Path(ref_images_dir)
        self.ref_images = self._load_reference_images()
        # Cache CLAHE object to avoid recreation on every call
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        # Configurable scales for multi-scale matching
        self.match_scales = match_scales if match_scales is not None else [0.8, 0.9, 1.0, 1.1, 1.2]
    
    def _load_reference_images(self) -> Dict[str, np.ndarray]:
        """Load all reference images from ref-images directory"""
        ref_images = {}
        
        if not self.ref_images_dir.exists():
            return ref_images
        
        # Load all PNG images
        for img_path in self.ref_images_dir.glob("*.png"):
            character_name = img_path.stem  # Get filename without extension
            img = cv2.imread(str(img_path), cv2.IMREAD_GRAYSCALE)
            if img is not None:
                ref_images[character_name] = img
        
        return ref_images
    
    def preprocess_for_matching(self, image: np.ndarray) -> np.ndarray:
        """Preprocess image for template matching"""
        # Convert to grayscale if needed
        gray = ensure_grayscale(image)
        
        # Resize to standard size for better matching
        # Reference images are typically 150x150, but we'll normalize
        target_size = (200, 200)
        resized = cv2.resize(gray, target_size, interpolation=cv2.INTER_AREA)
        
        # Enhance contrast (using cached CLAHE instance)
        enhanced = self.clahe.apply(resized)
        
        # Normalize
        normalized = cv2.normalize(enhanced, None, 0, 255, cv2.NORM_MINMAX)
        
        return normalized
    
    def match_template(self, extracted_text: np.ndarray, 
                      ref_image: np.ndarray, 
                      try_multiple_scales: bool = True) -> float:
        """
        Match extracted text region with reference image using template matching
        Args:
            try_multiple_scales: If True, try matching at different scales
        Returns confidence score (0-1)
        """
        # Preprocess both images
        extracted = self.preprocess_for_matching(extracted_text)
        reference = self.preprocess_for_matching(ref_image)
        
        best_score = 0.0
        
        if try_multiple_scales:
            # Try matching at different scales (ref image might be full token or just text)
            for scale in self.match_scales:
                # Resize reference to match extracted
                ref_w = int(reference.shape[1] * scale)
                ref_h = int(reference.shape[0] * scale)
                
                # Ensure we don't exceed extracted size
                if ref_w <= extracted.shape[1] and ref_h <= extracted.shape[0]:
                    ref_scaled = cv2.resize(reference, (ref_w, ref_h), 
                                          interpolation=cv2.INTER_AREA)
                    
                    # Use template matching
                    result = cv2.matchTemplate(extracted, ref_scaled, cv2.TM_CCOEFF_NORMED)
                    _, max_val, _, _ = cv2.minMaxLoc(result)
                    best_score = max(best_score, float(max_val))
        else:
            # Single scale matching
            if extracted.shape != reference.shape:
                reference = cv2.resize(reference, 
                                     (extracted.shape[1], extracted.shape[0]),
                                     interpolation=cv2.INTER_AREA)
            
            result = cv2.matchTemplate(extracted, reference, cv2.TM_CCOEFF_NORMED)
            _, max_val, _, _ = cv2.minMaxLoc(result)
            best_score = float(max_val)
        
        return best_score
    
    def match_character(self, extracted_text: np.ndarray, 
                       threshold: float = 0.3,
                       try_multiple_scales: bool = True) -> Optional[Tuple[str, str, float]]:
        """
        Match extracted text region to a character
        Args:
            try_multiple_scales: Try matching at different scales (handles full vs partial text)
        Returns (character_name, character_type, confidence) or None
        """
        best_match = None
        best_score = 0.0
        
        # Try matching against all reference images
        for character_name, ref_image in self.ref_images.items():
            score = self.match_template(extracted_text, ref_image, 
                                       try_multiple_scales=try_multiple_scales)
            
            if score > best_score:
                best_score = score
                character_type = get_character_type(character_name)
                best_match = (character_name, character_type, score)
        
        # Return match if above threshold
        if best_match and best_match[2] >= threshold:
            return best_match
        
        return None
    
    def match_all_characters(self, extracted_text: np.ndarray, 
                            top_n: int = 5,
                            try_multiple_scales: bool = True) -> List[Tuple[str, str, float]]:
        """
        Get top N character matches for debugging
        Args:
            try_multiple_scales: Whether to try multiple scales (default True for consistency)
        Returns list of (character_name, character_type, confidence) tuples
        """
        matches = []
        
        for character_name, ref_image in self.ref_images.items():
            score = self.match_template(extracted_text, ref_image, 
                                       try_multiple_scales=try_multiple_scales)
            character_type = get_character_type(character_name)
            matches.append((character_name, character_type, score))
        
        # Sort by confidence (descending)
        matches.sort(key=lambda x: x[2], reverse=True)
        
        return matches[:top_n]
