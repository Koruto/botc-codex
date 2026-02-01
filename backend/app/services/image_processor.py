import cv2
import numpy as np
import os
from typing import Tuple, List


class ImageProcessor:
    """Basic image preprocessing for Method 1 (Easy Processing)"""
    
    def __init__(self):
        self.preprocessing_steps = []
        # Cache CLAHE object to avoid recreation on every call
        self.clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    
    def load_image(self, image_path: str) -> np.ndarray:
        """Load image from file path"""
        if not os.path.exists(image_path):
            raise ValueError(f"Image file does not exist: {image_path}")
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image from {image_path}")
        return image
    
    def get_image_info(self, image_path: str) -> dict:
        """Get basic image information using cv2 for consistency"""
        # Use cv2 to get dimensions (more efficient than PIL for this use case)
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not load image from {image_path}")
        height, width = img.shape[:2]
        
        # Get actual file size from filesystem
        file_size_bytes = os.path.getsize(image_path)
        file_size_kb = file_size_bytes / 1024
        
        return {
            "dimensions": [width, height],
            "file_size_kb": round(file_size_kb, 2)
        }
    
    def preprocess(self, image: np.ndarray) -> Tuple[np.ndarray, List[str]]:
        """
        Basic preprocessing: grayscale conversion and contrast enhancement
        Returns processed image and list of applied steps
        """
        steps = []
        
        # Convert to grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
            steps.append("grayscale")
        else:
            gray = image
        
        # Basic contrast enhancement using CLAHE (cached instance)
        enhanced = self.clahe.apply(gray)
        steps.append("contrast_enhancement")
        
        self.preprocessing_steps = steps
        return enhanced, steps
