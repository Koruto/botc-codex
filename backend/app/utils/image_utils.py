"""Utility functions for image processing"""
import cv2
import numpy as np


def ensure_grayscale(image: np.ndarray) -> np.ndarray:
    """
    Convert image to grayscale if needed, otherwise return as-is.
    More efficient than always copying.
    
    Args:
        image: Input image (BGR, RGB, or grayscale)
    
    Returns:
        Grayscale image
    """
    if len(image.shape) == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return image
