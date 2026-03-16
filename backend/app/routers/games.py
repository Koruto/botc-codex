"""
Games router.

Visibility rules:
  - public  → anyone can view (including anonymous)
  - private → owner only

Auth rules:
  - Create:  must be a member of the target server
  - Edit:    owner only
  - Copy:    any logged-in user; target game must be public; self-copy blocked
  - Delete:  owner only

All list endpoints are paginated via ?skip=&limit= query params.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorCollection

from app.auth import get_current_user, get_optional_user
from app.db import get_games_collection, get_memberships_collection, get_servers_collection, get_users_collection
from app.models.schemas import (
    CopyGameBody,
    GameCreateBody,
    GameDocument,
    GameUpdateBody,
)

router = APIRouter(prefix="/api", tags=["games"])


def _title_to_slug(title: str) -> str:
    """Lowercase, spaces to hyphens, strip non [a-z0-9-], strip leading/trailing hyphens."""
    s = (title or "").strip().lower().replace(" ", "-")
    s = "".join(c for c in s if c in "abcdefghijklmnopqrstuvwxyz0123456789-")
    return s.strip("-") or "game"


async def _ensure_unique_game_slug(
    collection: AsyncIOMotorCollection, base_slug: str, exclude_game_id: Optional[str] = None
) -> str:
    """Return base_slug or base_slug-2, base_slug-3, ... globally unique."""
    slug = base_slug
    n = 2
    while True:
        existing = await collection.find_one({"slug": slug})
        if not existing or (exclude_game_id and existing.get("gameId") == exclude_game_id):
            return slug
        slug = f"{base_slug}-{n}"
        n += 1


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _is_member(
    memberships: AsyncIOMotorCollection, server_id: str, user_id: str
) -> bool:
    return await memberships.find_one({"serverId": server_id, "userId": user_id}) is not None


async def _get_game_or_404(
    collection: AsyncIOMotorCollection, game_id: str, server_id: Optional[str] = None
) -> GameDocument:
    query = {"gameId": game_id}
    if server_id:
        query["serverId"] = server_id
    raw = await collection.find_one(query)
    if not raw:
        raise HTTPException(status_code=404, detail="Game not found.")
    return GameDocument(**raw)


async def _get_game_by_slug_or_404(
    collection: AsyncIOMotorCollection, slug: str
) -> GameDocument:
    raw = await collection.find_one({"slug": slug})
    if not raw:
        raise HTTPException(status_code=404, detail="Game not found.")
    return GameDocument(**raw)


async def _get_game_by_server_and_slug_or_404(
    collection: AsyncIOMotorCollection, server_id: str, game_slug: str
) -> GameDocument:
    raw = await collection.find_one({"serverId": server_id, "slug": game_slug})
    if not raw:
        raise HTTPException(status_code=404, detail="Game not found.")
    return GameDocument(**raw)


def _enforce_visibility(game: GameDocument, current_user: Optional[dict]) -> None:
    """
    Raise 403 if the caller is not allowed to view this game.
    Public games are accessible to everyone (including anonymous).
    Private games are accessible only to their owner.
    """
    if game.visibility == "public":
        return
    user_id = current_user["userId"] if current_user else None
    if user_id != game.createdBy:
        raise HTTPException(
            status_code=403, detail="This game is private."
        )


# ---------------------------------------------------------------------------
# Create
# ---------------------------------------------------------------------------

@router.post("/servers/{server_id}/games", status_code=status.HTTP_201_CREATED)
async def create_game(
    server_id: str,
    body: GameCreateBody,
    current_user: dict = Depends(get_current_user),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
    memberships: AsyncIOMotorCollection = Depends(get_memberships_collection),
):
    """
    Create a game in a server. Caller must be a member of the server.
    Default visibility is private.
    """
    if not await _is_member(memberships, server_id, current_user["userId"]):
        raise HTTPException(
            status_code=403, detail="You must be a member of the server to create games."
        )

    base_slug = _title_to_slug(body.title or body.name or "Untitled")
    slug = await _ensure_unique_game_slug(collection, base_slug)
    now = datetime.now(timezone.utc).isoformat()
    doc = GameDocument(
        gameId=str(uuid.uuid4()),
        serverId=server_id,
        slug=slug,
        createdBy=current_user["userId"],
        createdAt=now,
        updatedAt=now,
        visibility=body.visibility or "private",
        name=body.name,
        townSquare=body.townSquare,
        meta=body.meta,
        phases=body.phases,
        title=body.title,
        subtitle=body.subtitle,
        winner=body.winner,
    )
    await collection.insert_one(doc.model_dump(mode="json"))
    return doc.model_dump(mode="json")


# ---------------------------------------------------------------------------
# Read (single)
# ---------------------------------------------------------------------------

@router.get("/servers/{server_id}/games/{game_id}")
async def get_game(
    server_id: str,
    game_id: str,
    current_user: Optional[dict] = Depends(get_optional_user),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
):
    """Get a single game by server + game ID. Visibility enforced."""
    game = await _get_game_or_404(collection, game_id, server_id)
    _enforce_visibility(game, current_user)
    return game.model_dump(mode="json")


@router.get("/games/by-slug/{slug}")
async def get_game_by_slug(
    slug: str,
    current_user: Optional[dict] = Depends(get_optional_user),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
):
    """Get a game by its slug (cross-server). Used for shareable game links. Visibility enforced."""
    game = await _get_game_by_slug_or_404(collection, slug)
    _enforce_visibility(game, current_user)
    return game.model_dump(mode="json")


@router.get("/games/{game_id}")
async def get_game_by_id(
    game_id: str,
    current_user: Optional[dict] = Depends(get_optional_user),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
):
    """Get a game by its ID (cross-server). Used for shareable game links. Visibility enforced."""
    game = await _get_game_or_404(collection, game_id)
    _enforce_visibility(game, current_user)
    return game.model_dump(mode="json")


@router.get("/servers/{server_id}/games/by-slug/{game_slug}")
async def get_game_by_server_and_slug(
    server_id: str,
    game_slug: str,
    current_user: Optional[dict] = Depends(get_optional_user),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
):
    """Get a game by server id + game slug. Used for edit page. Visibility enforced."""
    game = await _get_game_by_server_and_slug_or_404(collection, server_id, game_slug)
    _enforce_visibility(game, current_user)
    return game.model_dump(mode="json")


# ---------------------------------------------------------------------------
# Read (list)
# ---------------------------------------------------------------------------

SORT_FIELDS = {"updatedAt", "playedOn", "edition", "winner", "playerCount"}
SORT_TO_KEY = {
    "updatedAt": "updatedAt",
    "playedOn": "meta.playedOn",
    "edition": "meta.edition",
    "winner": "winner",
    "playerCount": "meta.playerCount",
}


@router.get("/servers/{server_id}/games")
async def list_games(
    server_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("updatedAt", description="Sort field: updatedAt, playedOn, edition, winner, playerCount"),
    order: str = Query("desc", description="Sort order: asc or desc"),
    current_user: Optional[dict] = Depends(get_optional_user),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
    servers: AsyncIOMotorCollection = Depends(get_servers_collection),
    users: AsyncIOMotorCollection = Depends(get_users_collection),
):
    """
    List games for a server. Paginated.
    Sort: updatedAt (default), playedOn, edition, winner, playerCount. Order: asc | desc.
    Each item includes serverName and createdByUsername for card display.

    Visibility filter:
    - Anonymous users see only public games.
    - Authenticated users see public games + their own private games.
    """
    user_id = current_user["userId"] if current_user else None

    if user_id:
        query = {
            "serverId": server_id,
            "$or": [{"visibility": "public"}, {"createdBy": user_id}],
        }
    else:
        query = {"serverId": server_id, "visibility": "public"}

    sort_key = SORT_TO_KEY.get(sort, "updatedAt")
    sort_dir = -1 if order == "desc" else 1
    cursor = collection.find(query).sort(sort_key, sort_dir).skip(skip).limit(limit)
    total = await collection.count_documents(query)
    raw_items = [GameDocument(**raw).model_dump(mode="json") async for raw in cursor]

    server_name: Optional[str] = None
    server_doc = await servers.find_one({"serverId": server_id})
    if server_doc:
        server_name = server_doc.get("name")

    creator_ids = list({g.get("createdBy") for g in raw_items if g.get("createdBy")})
    user_id_to_username: dict[str, str] = {}
    if creator_ids:
        async for u in users.find({"userId": {"$in": creator_ids}}):
            uid = u.get("userId")
            uname = u.get("username")
            if uid and uname:
                user_id_to_username[uid] = uname

    items = []
    for g in raw_items:
        out = dict(g)
        out["serverName"] = server_name
        out["createdByUsername"] = user_id_to_username.get(g.get("createdBy") or "") if g.get("createdBy") else None
        items.append(out)

    return {"total": total, "skip": skip, "limit": limit, "items": items}


# ---------------------------------------------------------------------------
# Update
# ---------------------------------------------------------------------------

@router.patch("/servers/{server_id}/games/{game_id}")
async def update_game(
    server_id: str,
    game_id: str,
    body: GameUpdateBody,
    current_user: dict = Depends(get_current_user),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
):
    """Partial update of a game. Owner only."""
    game = await _get_game_or_404(collection, game_id, server_id)

    if game.createdBy != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Only the game owner can edit it.")

    updates = body.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(game, key, value)
    game.updatedAt = datetime.now(timezone.utc).isoformat()
    game.updatedBy = current_user["userId"]

    await collection.replace_one(
        {"serverId": server_id, "gameId": game_id},
        game.model_dump(mode="json"),
    )
    return game.model_dump(mode="json")


# ---------------------------------------------------------------------------
# Copy
# ---------------------------------------------------------------------------

@router.post("/games/{game_id}/copy", status_code=status.HTTP_201_CREATED)
async def copy_game(
    game_id: str,
    body: CopyGameBody,
    current_user: dict = Depends(get_current_user),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
    memberships: AsyncIOMotorCollection = Depends(get_memberships_collection),
):
    """
    Copy another user's public game into one of the caller's servers.

    Rules:
    - Target game must be public.
    - Self-copy is not allowed.
    - Caller must be a member of the destination server.
    - All content fields are copied as-is.
    - Owner-meta is stripped and reset (createdBy, createdAt, updatedAt, updatedBy, visibility).
    """
    source = await _get_game_or_404(collection, game_id)

    if source.visibility != "public":
        raise HTTPException(status_code=403, detail="Only public games can be copied.")

    if source.createdBy == current_user["userId"]:
        raise HTTPException(status_code=400, detail="You cannot copy your own game.")

    if not await _is_member(memberships, body.serverId, current_user["userId"]):
        raise HTTPException(
            status_code=403,
            detail="You must be a member of the destination server.",
        )

    base_slug = _title_to_slug(source.title or source.name or "Untitled")
    slug = await _ensure_unique_game_slug(collection, base_slug)
    now = datetime.now(timezone.utc).isoformat()
    copy = GameDocument(
        gameId=str(uuid.uuid4()),
        serverId=body.serverId,
        slug=slug,
        createdBy=current_user["userId"],
        createdAt=now,
        updatedAt=now,
        updatedBy=None,
        visibility="private",
        # Content fields copied as-is
        name=source.name,
        townSquare=source.townSquare,
        meta=source.meta,
        phases=source.phases,
        title=source.title,
        subtitle=source.subtitle,
        winner=source.winner,
    )
    await collection.insert_one(copy.model_dump(mode="json"))
    return copy.model_dump(mode="json")


# ---------------------------------------------------------------------------
# Delete
# ---------------------------------------------------------------------------

@router.delete("/servers/{server_id}/games/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_game(
    server_id: str,
    game_id: str,
    current_user: dict = Depends(get_current_user),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
):
    """
    Permanently delete a game. Owner only.
    """
    game = await _get_game_or_404(collection, game_id, server_id)

    if game.createdBy != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Only the game owner can delete it.")

    await collection.delete_one({"serverId": server_id, "gameId": game_id})
