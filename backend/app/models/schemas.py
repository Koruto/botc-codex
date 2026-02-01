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


class GrimoireResponse(BaseModel):
    status: str
    processing_method: str
    processing_time_ms: float
    image_info: ImageInfo
    extracted_data: ExtractedData
    debug_info: DebugInfo
