"""
Single pipeline: extract tokens from grimoire images + match to ref characters.
Returns parsed tokens (position, player name, character, is_dead) and can convert to Town Square state.
"""
from dataclasses import dataclass
from pathlib import Path
from typing import List

from app.models.schemas import (
    ParsedToken,
    TownSquareGameState,
    TownSquarePlayer,
    TokenMatch,
)
from app.services.circle_detector import CircleDetector
from app.services.extract_tokens import ExtractResult, extract_tokens as run_extract_tokens
from app.services.image_processor import ImageProcessor
from app.services.match_tokens import match_tokens as run_match_tokens
from app.services.orb_matcher import ORBMatcher
from app.services.player_name_extractor import PlayerNameExtractor
from app.services.token_processor import TokenProcessor


@dataclass
class ExtractAndMatchResult:
    """Result of extract + match pipeline."""
    extract_result: ExtractResult
    matches: List[TokenMatch]
    parsed_tokens: List[ParsedToken]


def extract_and_match(
    source_images_dir: Path,
    detected_tokens_dir: Path,
    image_processor: ImageProcessor,
    circle_detector: CircleDetector,
    token_processor: TokenProcessor,
    player_name_extractor: PlayerNameExtractor,
    orb_matcher: ORBMatcher,
) -> ExtractAndMatchResult:
    """
    Run extract-tokens then match-tokens; merge into a list of ParsedToken.
    Reusable for parse, townsquare, process, and extract-tokens endpoints.
    """
    extract_result = run_extract_tokens(
        source_images_dir,
        detected_tokens_dir,
        image_processor,
        circle_detector,
        token_processor,
        player_name_extractor,
    )
    matches = run_match_tokens(detected_tokens_dir, orb_matcher)
    match_by_token = {m.token: m for m in matches}
    parsed_tokens: List[ParsedToken] = []
    for position, player_name in extract_result.positions_with_names:
        m = match_by_token.get(position)
        parsed_tokens.append(
            ParsedToken(
                token=position,
                player_name=player_name,
                character=m.character if m else None,
                character_type=m.character_type if m else None,
                confidence=m.confidence if m else 0.0,
                is_dead=m.is_dead if m is not None else None,
            )
        )
    return ExtractAndMatchResult(
        extract_result=extract_result,
        matches=matches,
        parsed_tokens=parsed_tokens,
    )


def parsed_tokens_to_town_square(tokens: List[ParsedToken]) -> TownSquareGameState:
    """
    Build Town Square Load State from parsed tokens: BMR edition, bluffs from unnamed tokens,
    players from named tokens with role and isDead from ORB match.
    """
    bluffs: List[str] = []
    players: List[TownSquarePlayer] = []
    for t in tokens:
        role_id = t.character or ""
        name = (t.player_name or "").strip() if t.player_name else ""
        if not name:
            if role_id:
                bluffs.append(role_id)
            continue
        players.append(
            TownSquarePlayer(
                name=name,
                id="",
                role=role_id,
                reminders=[],
                isVoteless=False,
                isDead=t.is_dead if t.is_dead is not None else False,
                pronouns="",
            )
        )
    return TownSquareGameState(
        bluffs=bluffs,
        edition={"id": "bmr"},
        roles="",
        fabled=[],
        players=players,
    )
