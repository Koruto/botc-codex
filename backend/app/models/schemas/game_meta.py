"""
Game meta (edition, script, storyteller). Matches client GameMeta.
"""
from typing import List, Optional

from pydantic import BaseModel

from app.models.schemas.script import CustomScript, RoleInfo


class GameMeta(BaseModel):
    playedOn: str = ""
    edition: str = "bmr"  # "bmr" | "snv" | "tb" | "custom"
    playerCount: int = 0
    storyteller: str = ""
    coStorytellers: Optional[List[str]] = None
    script: Optional[CustomScript] = None
    customRoles: Optional[List[RoleInfo]] = None
