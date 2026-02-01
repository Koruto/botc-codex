from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class PlayerData(BaseModel):
    position: Optional[int] = None
    player_name: Optional[str] = None
    character: Optional[str] = None
    character_type: Optional[str] = None
    is_alive: Optional[bool] = None
    reminders: List[str] = []
    match_confidence: Optional[float] = None


class ExtractedData(BaseModel):
    players: List[PlayerData] = []
    metadata: Dict[str, Any] = {}


class ImageInfo(BaseModel):
    filename: str
    dimensions: List[int]
    file_size_kb: float


class DebugInfo(BaseModel):
    """Processing metadata for extract-tokens responses (preprocessing and pipeline steps)."""
    preprocessing_applied: List[str] = []
    processing_steps: List[str] = []


DEAD_SUFFIX = "-dead"


class TokenMatch(BaseModel):
    """Token-to-character match from ORB feature matching. is_dead is True when the best match is a -dead reference."""
    token: int
    character: Optional[str] = None
    character_type: Optional[str] = None
    confidence: float
    is_dead: Optional[bool] = None


class MatchTokensResponse(BaseModel):
    """Response for /api/match-tokens: ORB-matched tokens against ref-images."""
    matches: List[TokenMatch]


class ParsedToken(BaseModel):
    """Parsed token: position, player name (OCR), character (ORB match), and dead state from -dead ref images."""
    token: int
    player_name: Optional[str] = None
    character: Optional[str] = None
    character_type: Optional[str] = None
    confidence: float
    is_dead: Optional[bool] = None


class ParseGrimoireResponse(BaseModel):
    """Response for /api/grimoire/parse: extract + match combined, correct character name per token."""
    tokens: List[ParsedToken]


class TownSquarePlayer(BaseModel):
    """Player entry for Town Square Load State JSON."""
    name: str = ""
    id: str = ""
    role: str
    reminders: List[str] = []
    isVoteless: bool = False
    isDead: bool = False
    pronouns: str = ""


class TownSquareGameState(BaseModel):
    """Game state payload for Town Square Load State (bluffs, edition, players with role and isDead)."""
    bluffs: List[str] = []
    edition: Dict[str, str] = {"id": "bmr"}
    roles: str = ""
    fabled: List[Any] = []
    players: List[TownSquarePlayer] = []


class GrimoireResponse(BaseModel):
    status: str
    processing_method: str
    processing_time_ms: float
    image_info: ImageInfo
    extracted_data: ExtractedData
    debug_info: DebugInfo
