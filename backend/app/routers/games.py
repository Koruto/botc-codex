"""Games API: CRUD for draft/published games (JSON file storage)."""
import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException

from app.config import GAMES_DIR
from app.models.schemas import GameCreateBody, GameDocument, GameUpdateBody

router = APIRouter(prefix="/api", tags=["games"])


def _game_path(server_id: str, game_id: str) -> Path:
    return GAMES_DIR / server_id / f"{game_id}.json"


def _read_game(server_id: str, game_id: str) -> GameDocument:
    path = _game_path(server_id, game_id)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Game not found.")
    data = json.loads(path.read_text(encoding="utf-8"))
    return GameDocument(**data)


def _write_game(doc: GameDocument) -> None:
    path = _game_path(doc.serverId, doc.gameId)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(doc.model_dump_json(indent=2), encoding="utf-8")


@router.post("/servers/{server_id}/games")
async def create_game(server_id: str, body: GameCreateBody):
    """Create a draft game. Returns gameId and full document."""
    game_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = GameDocument(
        gameId=game_id,
        serverId=server_id,
        status="draft",
        updatedAt=now,
        name=body.name,
        townSquare=body.townSquare,
        meta=body.meta,
        phases=body.phases,
        title=body.title,
        subtitle=body.subtitle,
    )
    _write_game(doc)
    return doc.model_dump(mode="json")


@router.patch("/servers/{server_id}/games/{game_id}")
async def update_game(server_id: str, game_id: str, body: GameUpdateBody):
    """Partial update of a game (draft)."""
    doc = _read_game(server_id, game_id)
    if doc.status == "published":
        raise HTTPException(status_code=400, detail="Cannot update a published game.")
    update = body.model_dump(exclude_unset=True)
    for key, value in update.items():
        setattr(doc, key, value)
    doc.updatedAt = datetime.now(timezone.utc).isoformat()
    _write_game(doc)
    return doc.model_dump(mode="json")


@router.get("/servers/{server_id}/games/{game_id}")
async def get_game(server_id: str, game_id: str):
    """Get one game by id."""
    doc = _read_game(server_id, game_id)
    return doc.model_dump(mode="json")


@router.get("/servers/{server_id}/games")
async def list_games(server_id: str, status: Optional[str] = None):
    """List games for a server. Optional ?status=draft or ?status=published."""
    dir_path = GAMES_DIR / server_id
    if not dir_path.exists():
        return []
    out = []
    for path in dir_path.glob("*.json"):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
            doc = GameDocument(**data)
            if status and doc.status != status:
                continue
            out.append(doc.model_dump(mode="json"))
        except Exception:
            continue
    out.sort(key=lambda x: x.get("updatedAt", ""), reverse=True)
    return out


@router.get("/games/{game_id}")
async def get_game_by_id(game_id: str):
    """Get a game by id (searches across all servers). For shareable game links."""
    if not GAMES_DIR.exists():
        raise HTTPException(status_code=404, detail="Game not found.")
    for server_dir in GAMES_DIR.iterdir():
        if not server_dir.is_dir():
            continue
        path = server_dir / f"{game_id}.json"
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
            doc = GameDocument(**data)
            return doc.model_dump(mode="json")
    raise HTTPException(status_code=404, detail="Game not found.")
