"""
Custom script and role types. Stored in GameMeta.script when edition = 'custom'.
Matches client grimoire.types (RoleInfo, ScriptMeta, CustomScript).
"""
from typing import List, Literal, Optional

from pydantic import BaseModel


class RoleInfo(BaseModel):
    """
    Full role descriptor. Matches grimoire.types.ts RoleInfo.
    Used for both standard and homebrew roles in a custom script.
    """
    id: str
    name: str = ""
    edition: str = ""
    team: str = ""
    ability: str = ""
    firstNightReminder: str = ""
    otherNightReminder: str = ""
    reminders: List[str] = []
    setup: bool = False
    icon: Optional[str] = None


class ScriptMeta(BaseModel):
    """First entry in a custom script: script-level metadata."""
    id: Literal["_meta"] = "_meta"
    name: str = ""
    author: str = ""


class CustomScript(BaseModel):
    """Custom script stored in GameMeta.script (only when edition = 'custom'). roles = role IDs (strings)."""
    meta: ScriptMeta
    roles: List[str] = []
