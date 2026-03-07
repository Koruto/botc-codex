"""
Server and membership schemas.
"""
from pydantic import BaseModel


class ServerCreateBody(BaseModel):
    name: str


class ServerRenameBody(BaseModel):
    name: str


class ServerDocument(BaseModel):
    """Stored server document."""
    serverId: str
    name: str
    createdBy: str
    createdAt: str
    inviteCode: str


class MembershipDocument(BaseModel):
    """Stored membership (many-to-many: servers <-> users)."""
    serverId: str
    userId: str
    joinedAt: str
