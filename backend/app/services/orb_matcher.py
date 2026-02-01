"""
Token-to-character matching using ORB feature matching (Oriented FAST and Rotated BRIEF).
Matches detected token images against reference images in ref-images by extracting
and comparing visual features. Used by the /api/match-tokens endpoint.
"""
import cv2
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from app.utils.character_matcher import get_character_type
from app.utils.image_utils import ensure_grayscale


# Default size for normalizing token and ref images before feature extraction
MATCH_SIZE = (200, 200)

# Ratio test threshold (Lowe's): keep match if distance < ratio * 2nd_nearest
RATIO_THRESHOLD = 0.75

# Scale factor to map raw match count to [0, 1] confidence
CONFIDENCE_SCALE = 5.0


class ORBMatcher:
    """
    Match token images to reference character images using ORB features.
    Loads all PNGs from ref_images_dir, precomputes descriptors, and returns
    the best-matching character (by name and type) and confidence for a query token image.
    """

    def __init__(self, ref_images_dir: Path, nfeatures: int = 500):
        self.ref_images_dir = Path(ref_images_dir)
        self.orb = cv2.ORB_create(nfeatures=nfeatures)
        self.matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
        self._descriptors: Dict[str, np.ndarray] = {}
        self._load_references()

    def _load_references(self) -> None:
        """Load reference images and compute ORB descriptors."""
        self._descriptors.clear()
        if not self.ref_images_dir.exists():
            return
        for path in sorted(self.ref_images_dir.glob("*.png")):
            img = cv2.imread(str(path), cv2.IMREAD_GRAYSCALE)
            if img is None:
                continue
            img = self._preprocess(img)
            _, des = self.orb.detectAndCompute(img, None)
            if des is not None and len(des) >= 2:
                self._descriptors[path.stem] = des

    def _preprocess(self, image: np.ndarray) -> np.ndarray:
        """Convert to grayscale and resize to fixed size for consistent features."""
        gray = ensure_grayscale(image)
        return cv2.resize(gray, MATCH_SIZE, interpolation=cv2.INTER_AREA)

    def _confidence(self, des_query: np.ndarray, des_ref: np.ndarray) -> float:
        """
        Compute match confidence in [0, 1] using ORB descriptor matching with ratio test.
        """
        if des_query is None or des_ref is None:
            return 0.0
        if des_query.shape[0] < 2 or des_ref.shape[0] < 2:
            return 0.0
        try:
            pairs = self.matcher.knnMatch(des_query, des_ref, k=2)
        except cv2.error:
            return 0.0
        good = sum(1 for p in pairs if len(p) == 2 and p[0].distance < RATIO_THRESHOLD * p[1].distance)
        denom = min(des_query.shape[0], des_ref.shape[0])
        if denom == 0:
            return 0.0
        raw = good / denom
        return min(1.0, raw * CONFIDENCE_SCALE)

    def match_character(self, token_image: np.ndarray) -> Optional[Tuple[str, str, float]]:
        """
        Find the best-matching character for a single token image.

        Returns:
            (character_name, character_type, confidence) or None if no refs or no features.
        """
        gray = self._preprocess(token_image)
        _, des_q = self.orb.detectAndCompute(gray, None)
        if des_q is None or len(des_q) < 2:
            return None
        if not self._descriptors:
            return None

        best_name: Optional[str] = None
        best_type: Optional[str] = None
        best_score = 0.0

        for name, des_ref in self._descriptors.items():
            score = self._confidence(des_q, des_ref)
            if score > best_score:
                best_score = score
                best_name = name
                best_type = get_character_type(name)

        if best_name is None:
            return None
        return (best_name, best_type, best_score)

    def match_all_characters(
        self, token_image: np.ndarray, top_n: int = 1
    ) -> List[Tuple[str, str, float]]:
        """Return top N (character_name, character_type, confidence) for debugging."""
        gray = self._preprocess(token_image)
        _, des_q = self.orb.detectAndCompute(gray, None)
        if des_q is None or len(des_q) < 2 or not self._descriptors:
            return []
        results = [
            (name, get_character_type(name), self._confidence(des_q, des_ref))
            for name, des_ref in self._descriptors.items()
        ]
        results.sort(key=lambda x: x[2], reverse=True)
        return results[:top_n]
