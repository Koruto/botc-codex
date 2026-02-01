import cv2
import numpy as np
from pathlib import Path
from typing import List, Tuple, Dict
from app.services.token_detector import TokenDetector


class TokenProcessor:
    """Service for processing tokens: extraction, visualization, and saving"""
    
    def __init__(self, token_detector: TokenDetector, output_dir: Path):
        """
        Initialize token processor
        Args:
            token_detector: TokenDetector instance
            output_dir: Directory to save extracted tokens
        """
        self.token_detector = token_detector
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def create_visualization(self, image: np.ndarray, circles: List[Tuple[int, int, int]],
                           player_name_regions: List[Tuple[int, int, int, int]] = None) -> np.ndarray:
        """
        Create visualization image with detected circles and name regions
        Args:
            image: Original image
            circles: List of (x, y, radius) tuples
            player_name_regions: List of (x1, y1, x2, y2) tuples for name regions
        Returns:
            Visualization image with annotations
        """
        vis_image = image.copy()
        if len(vis_image.shape) == 2:
            vis_image = cv2.cvtColor(vis_image, cv2.COLOR_GRAY2BGR)
        # Note: For BGR images, we keep as-is; for grayscale, convert to BGR for visualization
        
        # Draw circles
        for idx, (x, y, r) in enumerate(circles):
            # Draw circle outline
            cv2.circle(vis_image, (x, y), r, (0, 255, 0), 2)
            cv2.circle(vis_image, (x, y), 5, (0, 255, 0), -1)
            
            # Draw player name region box if provided
            if player_name_regions and idx < len(player_name_regions):
                x1, y1, x2, y2 = player_name_regions[idx]
                cv2.rectangle(vis_image, (x1, y1), (x2, y2), (0, 0, 255), 2)
            
            # Add labels
            cv2.putText(vis_image, str(idx + 1), (x - 10, y - r - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
            cv2.putText(vis_image, f"r={r}", (x - 20, y + r + 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 255, 0), 1)
        
        return vis_image
    
    def extract_tokens(self, image: np.ndarray, 
                      circles: List[Tuple[int, int, int]]) -> List[Tuple[np.ndarray, int, int, int]]:
        """
        Extract token images from detected circles
        Args:
            image: Original image
            circles: List of (x, y, radius) tuples
        Returns:
            List of (token_image, x, y, radius) tuples
        """
        extracted_tokens = []
        for x, y, r in circles:
            token = self.token_detector.extract_token(image, x, y, r, circular=True)
            extracted_tokens.append((token, x, y, r))
        return extracted_tokens
    
    def save_tokens(self, extracted_tokens: List[Tuple[np.ndarray, int, int, int]],
                   base_name: str) -> List[Dict]:
        """
        Save extracted tokens to disk
        Args:
            extracted_tokens: List of (token_image, x, y, radius) tuples
            base_name: Base filename for saved tokens
        Returns:
            List of dictionaries with token info and file paths
        """
        saved_tokens = []
        
        for idx, (token, x, y, r) in enumerate(extracted_tokens):
            # Save full token
            token_path = self.output_dir / f"{base_name}_token_{idx+1}_full.png"
            cv2.imwrite(str(token_path), token)
            
            # Extract and save text region
            text_region = self.token_detector.extract_text_region(
                token, lower_half=True, region_ratio=0.4
            )
            text_path = self.output_dir / f"{base_name}_token_{idx+1}_text.png"
            cv2.imwrite(str(text_path), text_region)
            
            saved_tokens.append({
                "index": idx + 1,
                "center": (x, y),
                "radius": r,
                "full_token_path": str(token_path),
                "text_region_path": str(text_path)
            })
        
        return saved_tokens
    
    def get_player_name_regions(self, circles: List[Tuple[int, int, int]],
                               image_shape: Tuple[int, int],
                               offset_y: int = 89, box_width: int = 180,
                               box_height: int = 38) -> List[Tuple[int, int, int, int]]:
        """
        Calculate player name region boxes for visualization
        Args:
            circles: List of (x, y, radius) tuples
            image_shape: (height, width) of image
            offset_y: Y offset below circle center
            box_width: Width of name region box
            box_height: Height of name region box
        Returns:
            List of (x1, y1, x2, y2) tuples for name regions
        """
        h, w = image_shape
        regions = []
        
        for x, y, r in circles:
            red_box_y1 = max(0, y + offset_y - box_height // 2)
            red_box_y2 = min(h, y + offset_y + box_height // 2)
            red_box_x1 = max(0, x - box_width // 2)
            red_box_x2 = min(w, x + box_width // 2)
            regions.append((red_box_x1, red_box_y1, red_box_x2, red_box_y2))
        
        return regions
