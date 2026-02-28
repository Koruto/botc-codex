"""
One lenient input shape for pasted JSON; convert to TownSquareGameState + meta.
"""
from typing import Any, Dict, List, Optional, Tuple, Union

from pydantic import BaseModel, ValidationError

from app.models.schemas import GameMeta, TownSquareGameState, TownSquarePlayer


def _role_to_str(role: Any) -> str:
    """Role can be string or Town Square object like { \"id\": \"lunatic\" } or {}."""
    if role is None:
        return ""
    if isinstance(role, str):
        return role.strip()
    if isinstance(role, dict):
        return str(role.get("id", "") or "").strip()
    return ""


class LenientPlayer(BaseModel):
    """Player: take what's there, default the rest. role can be string or { \"id\": \"...\" }."""
    name: str = ""
    id: str = ""
    role: Union[str, Dict[str, Any]] = ""  # Town Square sometimes sends object
    reminders: List[str] = []
    isVoteless: bool = False
    isDead: bool = False
    pronouns: str = ""


class LenientGameInput(BaseModel):
    """Pasted JSON: bluffs, edition, players. All optional; we default the rest."""
    bluffs: List[str] = []
    bluff: Optional[List[str]] = None  # alias
    edition: Optional[Union[str, Dict[str, Any]]] = None
    roles: Optional[Any] = None
    fabled: Optional[List[Any]] = None
    players: List[LenientPlayer] = []

    model_config = {"extra": "ignore"}


def _edition_id(edition: Optional[Union[str, Dict[str, Any]]]) -> str:
    if edition is None:
        return "bmr"
    if isinstance(edition, str):
        return (edition or "bmr").strip()
    if isinstance(edition, dict):
        return str(edition.get("id", "bmr") or "bmr").strip()
    return "bmr"


def to_town_square(inp: LenientGameInput) -> Tuple[TownSquareGameState, GameMeta]:
    """Map lenient input to our format. If we have bluffs, add them; same for the rest."""
    bluffs = inp.bluffs or inp.bluff or []
    eid = _edition_id(inp.edition)
    players = [
        TownSquarePlayer(
            name=p.name or "",
            id=p.id or "",
            role=_role_to_str(p.role),
            reminders=p.reminders or [],
            isVoteless=p.isVoteless,
            isDead=p.isDead,
            pronouns=p.pronouns or "",
        )
        for p in inp.players
    ]
    fabled = [x for x in (inp.fabled or []) if isinstance(x, dict)]
    state = TownSquareGameState(
        bluffs=bluffs,
        edition={"id": eid},
        roles="",
        fabled=fabled,
        players=players,
    )
    meta = GameMeta(
        playedOn="",
        edition=eid,
        playerCount=len(players),
        storyteller="",
        coStorytellers=None,
    )
    return state, meta


def _format_validation_error(err: ValidationError) -> str:
    """Turn Pydantic errors into one clear message: field path and reason."""
    parts = []
    for e in err.errors():
        loc = ".".join(str(x) for x in e["loc"])
        msg = e.get("msg", "Invalid value")
        parts.append(f"{loc}: {msg}")
    return "Validation failed: " + "; ".join(parts)


def normalize_from_json(body: Dict[str, Any]) -> Tuple[TownSquareGameState, GameMeta]:
    """Parse body as lenient game JSON; return townSquare + meta."""
    if not isinstance(body, dict):
        raise ValueError("Body must be a JSON object.")
    try:
        inp = LenientGameInput(**body)
    except ValidationError as e:
        raise ValueError(_format_validation_error(e)) from e
    except Exception as e:
        raise ValueError(f"Invalid JSON: {str(e)}") from e
    return to_town_square(inp)
