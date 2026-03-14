"""
Server and membership schemas.
"""
from typing import Optional

from pydantic import BaseModel


class ServerCreateBody(BaseModel):
    name: str


class ServerRenameBody(BaseModel):
    name: str


class ServerDocument(BaseModel):
    """Stored server document. slug is set on create/rename; backfill for existing docs."""
    serverId: str
    name: str
    slug: Optional[str] = None
    createdBy: str
    createdAt: str
    inviteCode: str


class MembershipDocument(BaseModel):
    """Stored membership (many-to-many: servers <-> users)."""
    serverId: str
    userId: str
    joinedAt: str
