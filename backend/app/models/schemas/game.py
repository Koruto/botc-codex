"""
Game CRUD schemas: create/update bodies, document, copy.
"""
from typing import Literal, Optional

from pydantic import BaseModel

from app.models.schemas.events import GamePhase
from app.models.schemas.game_meta import GameMeta
from app.models.schemas.grimoire import TownSquareGameState


class GameCreateBody(BaseModel):
    """Body for creating a new game."""
    name: Optional[str] = None
    townSquare: Optional[TownSquareGameState] = None
    meta: Optional[GameMeta] = None
    phases: Optional[list[GamePhase]] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    winner: Optional[str] = None
    visibility: Optional[Literal["private", "public"]] = None


class GameUpdateBody(BaseModel):
    """Body for a partial game update (owner only)."""
    name: Optional[str] = None
    townSquare: Optional[TownSquareGameState] = None
    meta: Optional[GameMeta] = None
    phases: Optional[list[GamePhase]] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    winner: Optional[str] = None
    visibility: Optional[Literal["private", "public"]] = None


class GameDocument(BaseModel):
    """
    Stored game document. Returned by all game endpoints.

    Backward-compat notes:
    - Old documents without 'visibility' default to 'public'.
    - Old documents without 'createdBy'/'createdAt'/'updatedBy' default to None.
    - Old 'status' field is silently ignored (Pydantic extra='ignore' default).
    """
    gameId: str
    serverId: str
    slug: Optional[str] = None
    updatedAt: str
    createdAt: Optional[str] = None
    createdBy: Optional[str] = None
    updatedBy: Optional[str] = None
    visibility: str = "public"
    name: Optional[str] = None
    townSquare: Optional[TownSquareGameState] = None
    meta: Optional[GameMeta] = None
    phases: Optional[list[GamePhase]] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    winner: Optional[str] = None

    model_config = {"extra": "ignore"}


class CopyGameBody(BaseModel):
    """Body for copying a public game into one of the caller's servers."""
    serverId: str
