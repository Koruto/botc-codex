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
    preprocessing_applied: List[str] = []
    processing_steps: List[str] = []


class TokenMatch(BaseModel):
    """Single token-to-character match using ORB feature matching."""
    token: int
    character: Optional[str] = None
    character_type: Optional[str] = None
    confidence: float


class MatchTokensResponse(BaseModel):
    """Response for /api/match-tokens: ORB-matched tokens against ref-images."""
    matches: List[TokenMatch]


class ParsedToken(BaseModel):
    """Single parsed token: position, player name (from extract), character (from ORB match)."""
    token: int
    player_name: Optional[str] = None
    character: Optional[str] = None
    character_type: Optional[str] = None
    confidence: float


class ParseGrimoireResponse(BaseModel):
    """Response for /api/grimoire/parse: extract + match combined, correct character name per token."""
    tokens: List[ParsedToken]


class GrimoireResponse(BaseModel):
    status: str
    processing_method: str
    processing_time_ms: float
    image_info: ImageInfo
    extracted_data: ExtractedData
    debug_info: DebugInfo
