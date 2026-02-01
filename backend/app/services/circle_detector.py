import cv2
import numpy as np
from typing import List, Tuple
from app.utils.image_utils import ensure_grayscale


class CircleDetector:
    """Service for detecting circular tokens using Hough Circle Transform"""
    
    def __init__(self, min_radius: int = 50, blur_sigma: float = 4.5):
        """
        Initialize circle detector
        Args:
            min_radius: Minimum circle radius in pixels
            blur_sigma: Gaussian blur sigma value
        """
        self.min_radius = min_radius
        self.blur_sigma = blur_sigma
    
    def detect_circles(self, image: np.ndarray) -> List[Tuple[int, int, int]]:
        """
        Detect circular tokens in the image
        Args:
            image: Input image (BGR or grayscale)
        Returns:
            List of (x, y, radius) tuples for detected circles
        """
        h, w = image.shape[:2]
        
        # Convert to grayscale if needed
        gray = ensure_grayscale(image)
        
        # Apply Gaussian blur for better circle detection
        kernel_size = int(6 * self.blur_sigma) + 1
        if kernel_size % 2 == 0:
            kernel_size += 1
        blurred = cv2.GaussianBlur(gray, (kernel_size, kernel_size), self.blur_sigma)
        
        # Calculate max radius (20% of image dimension)
        max_radius = int(min(w, h) * 0.2)
        
        # Detect circles using HoughCircles
        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1,
            minDist=self.min_radius * 2,
            param1=50,  # Upper threshold for edge detection
            param2=30,  # Accumulator threshold for center detection
            minRadius=self.min_radius,
            maxRadius=max_radius
        )
        
        detected_circles = []
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            for x, y, r in circles:
                # Ensure circle is within image bounds
                if x - r >= 0 and x + r < w and y - r >= 0 and y + r < h:
                    detected_circles.append((x, y, r))
        
        return detected_circles
    
    def get_detection_params(self) -> dict:
        """Get detection parameters used"""
        return {
            "min_radius": self.min_radius,
            "blur_sigma": self.blur_sigma
        }
