"""
Match detected token images (1.png, 2.png, ... in detected_tokens) to ref-images using
ORB feature matching. Used by /api/match-tokens and by the combined /api/grimoire/parse.
"""
from pathlib import Path
from typing import List, Tuple

import cv2

from app.models.schemas import DEAD_SUFFIX, TokenMatch
from app.services.orb_matcher import ORBMatcher
from app.utils.character_matcher import get_character_type


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
                TokenMatch(token=token_num, character=None, character_type=None, confidence=0.0, is_dead=None)
            )
            continue
        result = orb_matcher.match_character(img)
        if result:
            ref_name, _, confidence = result
            if ref_name.endswith(DEAD_SUFFIX):
                character = ref_name[: -len(DEAD_SUFFIX)]
                character_type = get_character_type(character)
                is_dead = True
            else:
                character = ref_name
                character_type = get_character_type(character)
                is_dead = False
            matches.append(
                TokenMatch(
                    token=token_num,
                    character=character,
                    character_type=character_type,
                    confidence=round(confidence, 4),
                    is_dead=is_dead,
                )
            )
        else:
            matches.append(
                TokenMatch(token=token_num, character=None, character_type=None, confidence=0.0, is_dead=None)
            )
    return matches
