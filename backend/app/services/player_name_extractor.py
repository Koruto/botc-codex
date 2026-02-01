import cv2
import easyocr
import numpy as np
from typing import Dict, Optional


class PlayerNameExtractor:
    """Service for extracting player names using OCR from regions below tokens"""
    
    def __init__(self, languages: list = ['en'], gpu: bool = False):
        """
        Initialize OCR reader
        Args:
            languages: List of language codes for OCR
            gpu: Whether to use GPU acceleration
        """
        self.ocr_reader = easyocr.Reader(languages, gpu=gpu)
    
    def extract_player_name_region(self, image: np.ndarray, circle_center: tuple, 
                                   offset_y: int = 89, box_width: int = 180, 
                                   box_height: int = 38) -> np.ndarray:
        """
        Extract the region below a token where player name appears
        Args:
            image: Full image
            circle_center: (x, y) center of the token circle
            offset_y: Y offset below circle center
            box_width: Width of the name region box
            box_height: Height of the name region box
        Returns:
            Extracted region image
        """
        x, y = circle_center
        h, w = image.shape[:2]
        
        # Calculate box coordinates
        red_box_y1 = max(0, y + offset_y - box_height // 2)
        red_box_y2 = min(h, y + offset_y + box_height // 2)
        red_box_x1 = max(0, x - box_width // 2)
        red_box_x2 = min(w, x + box_width // 2)
        
        # Extract region
        region = image[red_box_y1:red_box_y2, red_box_x1:red_box_x2]
        return region
    
    def extract_name_from_region(self, region: np.ndarray) -> Optional[str]:
        """
        Extract player name text from a region using OCR
        Args:
            region: Image region containing player name
        Returns:
            Extracted player name text or None if not found
        """
        try:
            # Prepare image for OCR
            if len(region.shape) == 3:
                ocr_image = region.copy()
            else:
                ocr_image = cv2.cvtColor(region, cv2.COLOR_GRAY2BGR)
            
            # Apply OCR
            results = self.ocr_reader.readtext(ocr_image)
            
            # Combine all detected text
            if results:
                text_parts = [result[1] for result in results]
                ocr_text = " ".join(text_parts).strip()
                return ocr_text if ocr_text else None
            
            return None
        except Exception as e:
            import logging
            logging.debug(f"OCR extraction failed: {e}")
            return None
    
    def extract_names_for_circles(self, image: np.ndarray, 
                                  circles: list) -> Dict[int, str]:
        """
        Extract player names for multiple circles
        Args:
            image: Full image
            circles: List of (x, y, radius) tuples
        Returns:
            Dictionary mapping circle index to player name
        """
        player_names = {}
        
        for idx, (x, y, r) in enumerate(circles):
            # Extract name region
            name_region = self.extract_player_name_region(image, (x, y))
            
            # Extract name text
            player_name = self.extract_name_from_region(name_region)
            
            if player_name:
                player_names[idx] = player_name
        
        return player_names
