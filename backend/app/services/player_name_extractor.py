import logging
import cv2
import numpy as np
import pytesseract
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# psm 7 = single text line, oem 3 = default LSTM engine
# No whitelist: a space inside -c value would split the shell arg and silently break the config
_TESS_CONFIG = "--psm 7 --oem 3"


class PlayerNameExtractor:
    """Service for extracting player names using Tesseract OCR from regions below tokens."""

    def extract_player_name_region(
        self,
        image: np.ndarray,
        circle_center: tuple,
        offset_y: int = 89,
        box_width: int = 180,
        box_height: int = 38,
    ) -> np.ndarray:
        """
        Extract the region below a token where the player name appears.
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

        red_box_y1 = max(0, y + offset_y - box_height // 2)
        red_box_y2 = min(h, y + offset_y + box_height // 2)
        red_box_x1 = max(0, x - box_width // 2)
        red_box_x2 = min(w, x + box_width // 2)

        return image[red_box_y1:red_box_y2, red_box_x1:red_box_x2]

    def _preprocess_for_ocr(self, region: np.ndarray) -> np.ndarray:
        """
        Preprocess a name region to maximise Tesseract accuracy.

        Pipeline:
          1. Upscale 3x so Tesseract has enough pixel density.
          2. Convert to greyscale.
          3. Denoise with a bilateral filter (preserves edges / letter shapes).
          4. Otsu threshold -> clean black-on-white binary image.
        """
        scaled = cv2.resize(region, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

        if len(scaled.shape) == 3:
            gray = cv2.cvtColor(scaled, cv2.COLOR_BGR2GRAY)
        else:
            gray = scaled

        denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)

        _, binary = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        # If the image is mostly dark (white text on dark bg) invert it so
        # Tesseract always sees dark text on a light background.
        if np.mean(binary) < 127:
            binary = cv2.bitwise_not(binary)

        return binary

    def extract_name_from_region(self, region: np.ndarray) -> Optional[str]:
        """
        Extract player name text from a region using Tesseract OCR.
        Args:
            region: Image region containing player name
        Returns:
            Extracted player name text or None if not found
        """
        try:
            processed = self._preprocess_for_ocr(region)
            raw = pytesseract.image_to_string(processed, config=_TESS_CONFIG)
            name = raw.strip()
            return name if name else None
        except Exception as e:
            logger.error("OCR extraction failed: %s", e)
            return None

    def extract_names_for_circles(
        self, image: np.ndarray, circles: list
    ) -> Dict[int, str]:
        """
        Extract player names for multiple circles.
        Args:
            image: Full image
            circles: List of (x, y, radius) tuples
        Returns:
            Dictionary mapping circle index to player name
        """
        player_names = {}

        for idx, (x, y, r) in enumerate(circles):
            name_region = self.extract_player_name_region(image, (x, y))
            player_name = self.extract_name_from_region(name_region)
            if player_name:
                player_names[idx] = player_name

        return player_names
