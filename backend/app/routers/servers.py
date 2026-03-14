"""
Servers router: create, rename, get server info, invite code resolve, join via invite.

Server page is publicly viewable (no auth needed to GET /servers/{server_id}).
Create/rename/join all require auth.
"""
import secrets
import string
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorCollection

from app.auth import get_current_user, get_optional_user
from app.db import get_memberships_collection, get_servers_collection
from app.models.schemas import (
    MembershipDocument,
    ServerCreateBody,
    ServerDocument,
    ServerRenameBody,
)

router = APIRouter(prefix="/api", tags=["servers"])

_INVITE_ALPHABET = string.ascii_lowercase + string.digits


def _name_to_slug(name: str) -> str:
    """Lowercase, spaces to hyphens, strip non [a-z0-9-], strip leading/trailing hyphens."""
    s = name.strip().lower().replace(" ", "-")
    s = "".join(c for c in s if c in "abcdefghijklmnopqrstuvwxyz0123456789-")
    return s.strip("-") or "server"


async def _ensure_unique_slug(
    servers: AsyncIOMotorCollection,
    base_slug: str,
    exclude_server_id: Optional[str] = None,
) -> str:
    """Return base_slug or base_slug-2, base_slug-3, ... so it is unique."""
    slug = base_slug
    n = 2
    while True:
        existing = await servers.find_one({"slug": slug})
        if not existing or (exclude_server_id and existing.get("serverId") == exclude_server_id):
            return slug
        slug = f"{base_slug}-{n}"
        n += 1


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _generate_unique_invite_code(servers: AsyncIOMotorCollection) -> str:
    """Generate a unique 6-character lowercase alphanumeric invite code."""
    for _ in range(10):
        code = "".join(secrets.choice(_INVITE_ALPHABET) for _ in range(6))
        if not await servers.find_one({"inviteCode": code}):
            return code
    raise RuntimeError("Could not generate a unique invite code after 10 attempts.")


async def _is_member(memberships: AsyncIOMotorCollection, server_id: str, user_id: str) -> bool:
    doc = await memberships.find_one({"serverId": server_id, "userId": user_id})
    return doc is not None


async def _get_server_or_404(servers: AsyncIOMotorCollection, server_id: str) -> ServerDocument:
    raw = await servers.find_one({"serverId": server_id})
    if not raw:
        raise HTTPException(status_code=404, detail="Server not found.")
    return ServerDocument(**raw)


async def _get_server_by_slug_or_404(
    servers: AsyncIOMotorCollection, slug: str
) -> ServerDocument:
    raw = await servers.find_one({"slug": slug})
    if not raw:
        raise HTTPException(status_code=404, detail="Server not found.")
    return ServerDocument(**raw)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/servers", status_code=status.HTTP_201_CREATED)
async def create_server(
    body: ServerCreateBody,
    current_user: dict = Depends(get_current_user),
    servers: AsyncIOMotorCollection = Depends(get_servers_collection),
    memberships: AsyncIOMotorCollection = Depends(get_memberships_collection),
):
    """
    Create a new server. The creator is automatically added as a member.
    Returns the server document including the permanent invite code.
    """
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Server name cannot be empty.")
    if len(name) > 100:
        raise HTTPException(status_code=400, detail="Server name must be 100 characters or fewer.")

    server_id = str(uuid.uuid4())
    invite_code = await _generate_unique_invite_code(servers)
    base_slug = _name_to_slug(name)
    slug = await _ensure_unique_slug(servers, base_slug)
    now = datetime.now(timezone.utc).isoformat()

    server = ServerDocument(
        serverId=server_id,
        name=name,
        slug=slug,
        createdBy=current_user["userId"],
        createdAt=now,
        inviteCode=invite_code,
    )
    await servers.insert_one(server.model_dump(mode="json"))

    # Auto-join creator as first member
    membership = MembershipDocument(
        serverId=server_id,
        userId=current_user["userId"],
        joinedAt=now,
    )
    await memberships.insert_one(membership.model_dump(mode="json"))

    return server.model_dump(mode="json")


@router.get("/servers/by-slug/{slug}")
async def get_server_by_slug(
    slug: str,
    current_user: Optional[dict] = Depends(get_optional_user),
    servers: AsyncIOMotorCollection = Depends(get_servers_collection),
    memberships: AsyncIOMotorCollection = Depends(get_memberships_collection),
):
    """
    Get server info by slug. Public — no auth required.
    Response includes isMember and isCreator flags for the caller.
    """
    server = await _get_server_by_slug_or_404(servers, slug)
    user_id = current_user["userId"] if current_user else None
    is_member = (
        await _is_member(memberships, server.serverId, user_id) if user_id else False
    )
    is_creator = user_id == server.createdBy if user_id else False

    return {
        **server.model_dump(mode="json"),
        "isMember": is_member,
        "isCreator": is_creator,
    }


@router.get("/servers/{server_id}")
async def get_server(
    server_id: str,
    current_user: Optional[dict] = Depends(get_optional_user),
    servers: AsyncIOMotorCollection = Depends(get_servers_collection),
    memberships: AsyncIOMotorCollection = Depends(get_memberships_collection),
):
    """
    Get server info. Public — no auth required.
    Response includes isMember and isCreator flags for the caller.
    """
    server = await _get_server_or_404(servers, server_id)
    user_id = current_user["userId"] if current_user else None
    is_member = await _is_member(memberships, server_id, user_id) if user_id else False
    is_creator = user_id == server.createdBy if user_id else False

    return {
        **server.model_dump(mode="json"),
        "isMember": is_member,
        "isCreator": is_creator,
    }


@router.patch("/servers/{server_id}")
async def rename_server(
    server_id: str,
    body: ServerRenameBody,
    current_user: dict = Depends(get_current_user),
    servers: AsyncIOMotorCollection = Depends(get_servers_collection),
):
    """Rename a server. Creator only."""
    server = await _get_server_or_404(servers, server_id)
    if server.createdBy != current_user["userId"]:
        raise HTTPException(status_code=403, detail="Only the server creator can rename it.")

    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Server name cannot be empty.")
    if len(name) > 100:
        raise HTTPException(status_code=400, detail="Server name must be 100 characters or fewer.")

    base_slug = _name_to_slug(name)
    new_slug = await _ensure_unique_slug(servers, base_slug, exclude_server_id=server_id)
    await servers.update_one(
        {"serverId": server_id},
        {"$set": {"name": name, "slug": new_slug}},
    )
    server.name = name
    server.slug = new_slug
    return server.model_dump(mode="json")


@router.get("/invite/{invite_code}")
async def get_invite(
    invite_code: str,
    servers: AsyncIOMotorCollection = Depends(get_servers_collection),
):
    """
    Resolve an invite code to its server.
    Public — used to preview the server before logging in to join.
    """
    raw = await servers.find_one({"inviteCode": invite_code})
    if not raw:
        raise HTTPException(status_code=404, detail="Invite code not found.")
    server = ServerDocument(**raw)
    # Expose only safe fields (no inviteCode in the public resolve response)
    return {
        "serverId": server.serverId,
        "slug": server.slug,
        "name": server.name,
        "createdAt": server.createdAt,
    }


@router.post("/invite/{invite_code}/join", status_code=status.HTTP_200_OK)
async def join_server(
    invite_code: str,
    current_user: dict = Depends(get_current_user),
    servers: AsyncIOMotorCollection = Depends(get_servers_collection),
    memberships: AsyncIOMotorCollection = Depends(get_memberships_collection),
):
    """
    Join a server via its invite code. Auth required.
    Idempotent — joining a server you're already a member of is a no-op.
    """
    raw = await servers.find_one({"inviteCode": invite_code})
    if not raw:
        raise HTTPException(status_code=404, detail="Invite code not found.")
    server = ServerDocument(**raw)
    user_id = current_user["userId"]

    already_member = await memberships.find_one({"serverId": server.serverId, "userId": user_id})
    if already_member:
        return {
            "serverId": server.serverId,
            "serverSlug": server.slug,
            "alreadyMember": True,
        }

    now = datetime.now(timezone.utc).isoformat()
    membership = MembershipDocument(serverId=server.serverId, userId=user_id, joinedAt=now)
    await memberships.insert_one(membership.model_dump(mode="json"))

    return {
        "serverId": server.serverId,
        "serverSlug": server.slug,
        "alreadyMember": False,
    }
