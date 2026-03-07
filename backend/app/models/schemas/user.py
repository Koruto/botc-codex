"""
User and auth request/response schemas.
"""
from typing import Optional

from pydantic import BaseModel


class SignupBody(BaseModel):
    username: str
    password: str


class LoginBody(BaseModel):
    username: str
    password: str


class UserDocument(BaseModel):
    """Full stored user document. Never expose passwordHash in API responses."""
    userId: str
    username: str
    passwordHash: str
    email: Optional[str] = None
    createdAt: str


class UserPublicResponse(BaseModel):
    """Safe user representation returned by auth endpoints."""
    userId: str
    username: str
    createdAt: str
