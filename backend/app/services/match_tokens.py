"""
Match detected token images (1.png, 2.png, ... in detected_tokens) to ref-images using
ORB feature matching. Used by /api/match-tokens and by the combined /api/grimoire/parse.
"""
from pathlib import Path
from typing import List, Tuple

import cv2

from app.models.schemas import TokenMatch
from app.services.orb_matcher import ORBMatcher


def collect_token_files(detected_tokens_dir: Path) -> List[Tuple[int, Path]]:
    """Collect numeric token PNGs (1.png, 2.png, ...) from detected_tokens, sorted by token number."""
    if not detected_tokens_dir.exists():
        return []
    out = []
    for p in detected_tokens_dir.glob("*.png"):
        if p.name == "detection.png":
            continue
        try:
            out.append((int(p.stem), p))
        except ValueError:
            continue
    out.sort(key=lambda x: x[0])
    return out


def match_tokens(
    detected_tokens_dir: Path,
    orb_matcher: ORBMatcher,
) -> List[TokenMatch]:
    """
    Load token images (1.png, 2.png, ...) from detected_tokens_dir and match each
    to ref-images using ORB. Returns list of TokenMatch (token, character, character_type, confidence).
    """
    token_files = collect_token_files(detected_tokens_dir)
    matches: List[TokenMatch] = []
    for token_num, path in token_files:
        img = cv2.imread(str(path))
        if img is None:
            matches.append(
                TokenMatch(token=token_num, character=None, character_type=None, confidence=0.0)
            )
            continue
        result = orb_matcher.match_character(img)
        if result:
            character, character_type, confidence = result
            matches.append(
                TokenMatch(
                    token=token_num,
                    character=character,
                    character_type=character_type,
                    confidence=round(confidence, 4),
                )
            )
        else:
            matches.append(
                TokenMatch(token=token_num, character=None, character_type=None, confidence=0.0)
            )
    return matches
