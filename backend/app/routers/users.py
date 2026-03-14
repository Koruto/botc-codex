"""
Users router: explore, my games, my servers, public user pages.

  GET /api/explore               — random sample of public games (no auth)
  GET /api/me/games              — all games owned by the caller (auth required)
  GET /api/me/servers            — all servers the caller is a member of (auth required)
  GET /api/users/{username}/games — a user's public games (no auth required)
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from motor.motor_asyncio import AsyncIOMotorCollection

from app.auth import get_current_user
from app.db import get_games_collection, get_memberships_collection, get_servers_collection, get_users_collection
from app.models.schemas import GameDocument, ServerDocument, UserDocument

router = APIRouter(prefix="/api", tags=["users"])


# ---------------------------------------------------------------------------
# Explore
# ---------------------------------------------------------------------------

@router.get("/explore")
async def explore(
    limit: int = Query(20, ge=1, le=100),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
    servers: AsyncIOMotorCollection = Depends(get_servers_collection),
    users: AsyncIOMotorCollection = Depends(get_users_collection),
):
    """
    Return a random sample of public games.
    Each item includes serverName and createdByUsername for card display.
    No authentication required — entry point for anonymous users.
    """
    pipeline = [
        {"$match": {"visibility": "public"}},
        {"$sample": {"size": limit}},
    ]
    raw_items = []
    async for raw in collection.aggregate(pipeline):
        raw_items.append(GameDocument(**raw).model_dump(mode="json"))

    server_ids = list({g.get("serverId") for g in raw_items if g.get("serverId")})
    creator_ids = list({g.get("createdBy") for g in raw_items if g.get("createdBy")})

    server_id_to_name: dict[str, str] = {}
    if server_ids:
        async for s in servers.find({"serverId": {"$in": server_ids}}):
            sid = s.get("serverId")
            name = s.get("name")
            if sid and name:
                server_id_to_name[sid] = name

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
        out["serverName"] = server_id_to_name.get(g.get("serverId") or "") if g.get("serverId") else None
        out["createdByUsername"] = user_id_to_username.get(g.get("createdBy") or "") if g.get("createdBy") else None
        items.append(out)

    return {"items": items}


# ---------------------------------------------------------------------------
# My servers
# ---------------------------------------------------------------------------

@router.get("/me/servers")
async def my_servers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    servers: AsyncIOMotorCollection = Depends(get_servers_collection),
    memberships: AsyncIOMotorCollection = Depends(get_memberships_collection),
):
    """
    Return all servers the authenticated user is a member of,
    sorted by joinedAt descending. Paginated.
    """
    user_id = current_user["userId"]
    all_memberships = await memberships.find({"userId": user_id}).sort("joinedAt", -1).to_list(length=None)
    total = len(all_memberships)

    paged = all_memberships[skip : skip + limit]
    server_ids = [m["serverId"] for m in paged]

    server_docs: dict[str, ServerDocument] = {}
    async for raw in servers.find({"serverId": {"$in": server_ids}}):
        doc = ServerDocument(**raw)
        server_docs[doc.serverId] = doc

    membership_joined: dict[str, str] = {m["serverId"]: m["joinedAt"] for m in paged}

    items = []
    for sid in server_ids:
        doc = server_docs.get(sid)
        if doc:
            items.append({
                **doc.model_dump(mode="json"),
                "isCreator": doc.createdBy == user_id,
                "isMember": True,
                "joinedAt": membership_joined[sid],
            })

    return {"total": total, "skip": skip, "limit": limit, "items": items}


# ---------------------------------------------------------------------------
# My games
# ---------------------------------------------------------------------------

@router.get("/me/games")
async def my_games(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
    servers: AsyncIOMotorCollection = Depends(get_servers_collection),
):
    """
    Return all games created by the authenticated user (both private and public),
    sorted by updatedAt descending. Paginated.
    Each item includes serverName and createdByUsername for card display.
    """
    query = {"createdBy": current_user["userId"]}
    cursor = collection.find(query).sort("updatedAt", -1).skip(skip).limit(limit)
    total = await collection.count_documents(query)
    raw_items = [GameDocument(**raw).model_dump(mode="json") async for raw in cursor]

    server_ids = list({g.get("serverId") for g in raw_items if g.get("serverId")})
    server_id_to_name: dict[str, str] = {}
    if server_ids:
        async for s in servers.find({"serverId": {"$in": server_ids}}):
            sid = s.get("serverId")
            name = s.get("name")
            if sid and name:
                server_id_to_name[sid] = name

    items = []
    for g in raw_items:
        out = dict(g)
        out["serverName"] = server_id_to_name.get(g.get("serverId") or "") if g.get("serverId") else None
        out["createdByUsername"] = current_user.get("username")
        items.append(out)

    return {"total": total, "skip": skip, "limit": limit, "items": items}


# ---------------------------------------------------------------------------
# Public user page
# ---------------------------------------------------------------------------

@router.get("/users/{username}/games")
async def user_public_games(
    username: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    users: AsyncIOMotorCollection = Depends(get_users_collection),
    collection: AsyncIOMotorCollection = Depends(get_games_collection),
    servers: AsyncIOMotorCollection = Depends(get_servers_collection),
):
    """
    Return a user's public games from all servers, sorted by updatedAt descending.
    Viewable by anyone including anonymous users.
    Username is normalized to lowercase for lookup.
    Each item includes serverSlug for linking to server page.
    """
    username = username.strip().lower()
    raw_user = await users.find_one({"username": username})
    if not raw_user:
        raise HTTPException(status_code=404, detail="User not found.")
    user = UserDocument(**raw_user)

    query = {"createdBy": user.userId, "visibility": "public"}
    cursor = collection.find(query).sort("updatedAt", -1).skip(skip).limit(limit)
    total = await collection.count_documents(query)
    raw_items = [GameDocument(**raw).model_dump(mode="json") async for raw in cursor]

    server_ids = list({g.get("serverId") for g in raw_items if g.get("serverId")})
    server_id_to_slug: dict[str, str] = {}
    if server_ids:
        async for s in servers.find({"serverId": {"$in": server_ids}}):
            sid = s.get("serverId")
            slug = s.get("slug")
            if sid and slug:
                server_id_to_slug[sid] = slug

    items = []
    for g in raw_items:
        out = dict(g)
        out["serverSlug"] = server_id_to_slug.get(g.get("serverId") or "") or None
        items.append(out)

    return {
        "username": user.username,
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": items,
    }
