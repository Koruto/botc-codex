import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple
from app.utils.image_utils import ensure_grayscale


class TokenDetector:
    """Detect circular tokens in grimoire images"""
    
    def __init__(self, min_radius_cm: float = 2.5, max_radius_cm: float = 3.5, 
                 dpi: float = 300.0):
        """
        Initialize with physical dimensions
        Args:
            min_radius_cm: Minimum token radius in centimeters (default 2.5 cm)
            max_radius_cm: Maximum token radius in centimeters (default 3.5 cm)
            dpi: Assumed DPI of the image (default 300)
        """
        # Convert cm to pixels: 1 inch = 2.54 cm, so 1 cm = dpi/2.54 pixels
        self.pixels_per_cm = dpi / 2.54
        self.min_radius_cm = min_radius_cm
        self.max_radius_cm = max_radius_cm
    
    def _calculate_radius_from_image(self, image: np.ndarray) -> Tuple[int, int]:
        """
        Calculate min/max radius in pixels based on image dimensions
        Estimates DPI from image size if reasonable
        """
        h, w = image.shape[:2]
        
        # Estimate image DPI based on common photo sizes
        # Typical phone camera: 12MP = 4000x3000, printed at 4x6" = ~1000 DPI
        # But for processing, we'll use a conservative estimate
        # If image is very large, assume higher DPI
        if max(h, w) > 3000:
            estimated_dpi = 300.0
        elif max(h, w) > 2000:
            estimated_dpi = 250.0
        elif max(h, w) > 1000:
            estimated_dpi = 200.0
        else:
            estimated_dpi = 150.0
        
        pixels_per_cm = estimated_dpi / 2.54
        min_radius = int(self.min_radius_cm * pixels_per_cm)
        max_radius = int(self.max_radius_cm * pixels_per_cm)
        
        # Ensure reasonable bounds
        min_radius = max(20, min_radius)  # At least 20 pixels
        max_radius = min(max_radius, min(h, w) // 4)  # At most 1/4 of image dimension
        
        return min_radius, max_radius
    
    def detect_circles(self, image: np.ndarray) -> List[Tuple[int, int, int]]:
        """
        Detect circular tokens in the image using Hough Circle Transform
        Returns list of (x, y, radius) tuples
        """
        # Calculate radius limits based on image size
        min_radius, max_radius = self._calculate_radius_from_image(image)
        
        # Convert to grayscale if needed
        gray = ensure_grayscale(image)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)
        
        # Detect circles using HoughCircles
        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1,
            minDist=min_radius * 2,  # Minimum distance between circle centers
            param1=50,  # Upper threshold for edge detection
            param2=30,  # Accumulator threshold for center detection
            minRadius=min_radius,
            maxRadius=max_radius
        )
        
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            # Convert to list of tuples more efficiently
            return circles.tolist()
        
        return []
    
    def extract_token_circular(self, image: np.ndarray, x: int, y: int, radius: int, 
                               padding: int = 5) -> np.ndarray:
        """
        Extract a circular token region from the image
        Creates a mask to extract only the circular area
        Returns cropped circular token image
        """
        h, w = image.shape[:2]
        
        # Calculate bounding box with padding
        x1 = max(0, x - radius - padding)
        y1 = max(0, y - radius - padding)
        x2 = min(w, x + radius + padding)
        y2 = min(h, y + radius + padding)
        
        # Extract square region
        token_square = image[y1:y2, x1:x2]
        
        # Create circular mask
        # Calculate center relative to original image coordinates, then adjust for cropped region
        mask_h, mask_w = token_square.shape[0], token_square.shape[1]
        mask = np.zeros((mask_h, mask_w), dtype=np.uint8)
        center_x = mask_w // 2
        center_y = mask_h // 2
        cv2.circle(mask, (center_x, center_y), radius, 255, -1)
        
        # Apply mask to extract circular region
        if len(token_square.shape) == 3:
            mask_3d = cv2.merge([mask, mask, mask])
            token_circular = cv2.bitwise_and(token_square, mask_3d)
        else:
            token_circular = cv2.bitwise_and(token_square, token_square, mask=mask)
        
        return token_circular
    
    def extract_token(self, image: np.ndarray, x: int, y: int, radius: int, 
                     padding: int = 5, circular: bool = True) -> np.ndarray:
        """
        Extract a token region from the image
        Args:
            circular: If True, extract circular region. If False, extract square bounding box.
        Returns cropped token image
        """
        if circular:
            return self.extract_token_circular(image, x, y, radius, padding)
        else:
            # Fallback to square extraction
            h, w = image.shape[:2]
            x1 = max(0, x - radius - padding)
            y1 = max(0, y - radius - padding)
            x2 = min(w, x + radius + padding)
            y2 = min(h, y + radius + padding)
            return image[y1:y2, x1:x2]
    
    def extract_text_region(self, token: np.ndarray, lower_half: bool = True, 
                           region_ratio: float = 0.4) -> np.ndarray:
        """
        Extract text region from token
        Args:
            lower_half: If True, extract from lower portion. If False, from upper.
            region_ratio: Ratio of token height to extract (default 0.4 = 40% of height)
        Returns cropped text region
        """
        h, w = token.shape[:2]
        
        # Extract a region (not just half, but a portion where text typically appears)
        region_height = int(h * region_ratio)
        
        if lower_half:
            # Extract lower portion where text typically appears
            # Start from middle and go down
            start_y = h // 2
            text_region = token[start_y:start_y + region_height, :]
        else:
            # Extract upper portion
            text_region = token[:region_height, :]
        
        return text_region
    
    def save_detected_tokens(self, image: np.ndarray, circles: List[Tuple[int, int, int]], 
                           output_dir: Path, base_name: str = "token"):
        """Save detected token circles as images in the given output directory."""
        output_dir.mkdir(parents=True, exist_ok=True)
        
        saved_tokens = []
        for idx, (x, y, r) in enumerate(circles):
            # Extract token (circular)
            token = self.extract_token(image, x, y, r, circular=True)
            token_path = output_dir / f"{idx+1}.png"
            cv2.imwrite(str(token_path), token)
            saved_tokens.append({
                "index": idx + 1,
                "center": (x, y),
                "radius": r,
                "token_path": str(token_path)
            })
        return saved_tokens
