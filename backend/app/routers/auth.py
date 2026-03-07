"""
Auth router: signup, login, token refresh, logout, current-user.

Tokens are stored in HTTP-only cookies:
  - access_token  (short-lived, ACCESS_TOKEN_EXPIRE_MINUTES)
  - refresh_token (long-lived, REFRESH_TOKEN_EXPIRE_DAYS)
"""
import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from motor.motor_asyncio import AsyncIOMotorCollection

from app.auth import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.config import COOKIE_SAMESITE, COOKIE_SECURE, REFRESH_TOKEN_EXPIRE_DAYS
from app.db import get_users_collection
from app.models.schemas import LoginBody, SignupBody, UserDocument, UserPublicResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])

# ---------------------------------------------------------------------------
# Cookie helpers
# ---------------------------------------------------------------------------

_ACCESS_COOKIE = "access_token"
_REFRESH_COOKIE = "refresh_token"
_ACCESS_MAX_AGE = 15 * 60  # 15 minutes in seconds
_REFRESH_MAX_AGE = REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60


def _set_auth_cookies(response: Response, user_id: str, username: str) -> None:
    """Write access + refresh tokens as HTTP-only cookies onto response."""
    access = create_access_token(user_id, username)
    refresh = create_refresh_token(user_id)
    response.set_cookie(
        key=_ACCESS_COOKIE,
        value=access,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=_ACCESS_MAX_AGE,
    )
    response.set_cookie(
        key=_REFRESH_COOKIE,
        value=refresh,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=_REFRESH_MAX_AGE,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(key=_ACCESS_COOKIE)
    response.delete_cookie(key=_REFRESH_COOKIE)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/signup", response_model=UserPublicResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    body: SignupBody,
    response: Response,
    users: AsyncIOMotorCollection = Depends(get_users_collection),
):
    """
    Create a new account with username + password.
    On success, sets auth cookies and returns the public user profile.
    """
    username = body.username.strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username cannot be empty.")
    if len(username) < 3 or len(username) > 32:
        raise HTTPException(status_code=400, detail="Username must be 3–32 characters.")
    if not username.replace("_", "").replace("-", "").isalnum():
        raise HTTPException(
            status_code=400,
            detail="Username may only contain letters, digits, hyphens, and underscores.",
        )
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    existing = await users.find_one({"username": username})
    if existing:
        raise HTTPException(status_code=409, detail="Username already taken.")

    user_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()
    doc = UserDocument(
        userId=user_id,
        username=username,
        passwordHash=hash_password(body.password),
        createdAt=now,
    )
    # Omit email when None so sparse unique index allows multiple users without email
    await users.insert_one(doc.model_dump(mode="json", exclude_none=True))

    _set_auth_cookies(response, user_id, username)
    return UserPublicResponse(userId=user_id, username=username, createdAt=now)


@router.post("/login", response_model=UserPublicResponse)
async def login(
    body: LoginBody,
    response: Response,
    users: AsyncIOMotorCollection = Depends(get_users_collection),
):
    """
    Authenticate with username + password.
    On success, sets auth cookies and returns the public user profile.
    """
    raw = await users.find_one({"username": body.username})
    if not raw:
        raise HTTPException(status_code=401, detail="Invalid username or password.")
    doc = UserDocument(**raw)
    if not verify_password(body.password, doc.passwordHash):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    _set_auth_cookies(response, doc.userId, doc.username)
    return UserPublicResponse(userId=doc.userId, username=doc.username, createdAt=doc.createdAt)


@router.post("/refresh", response_model=UserPublicResponse)
async def refresh_token(
    response: Response,
    refresh_token: Optional[str] = Cookie(None),
    users: AsyncIOMotorCollection = Depends(get_users_collection),
):
    """
    Exchange a valid refresh token for a new access token.
    The refresh cookie must be present. Issues a fresh access token cookie.
    """
    if not refresh_token:
        raise HTTPException(status_code=401, detail="No refresh token.")
    payload = decode_token(refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid token type.")

    raw = await users.find_one({"userId": payload["sub"]})
    if not raw:
        raise HTTPException(status_code=401, detail="User not found.")
    doc = UserDocument(**raw)

    _set_auth_cookies(response, doc.userId, doc.username)
    return UserPublicResponse(userId=doc.userId, username=doc.username, createdAt=doc.createdAt)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(response: Response):
    """Clear auth cookies (client-side logout)."""
    _clear_auth_cookies(response)


@router.get("/me", response_model=UserPublicResponse)
async def me(
    current_user: dict = Depends(get_current_user),
    users: AsyncIOMotorCollection = Depends(get_users_collection),
):
    """Return the currently authenticated user's public profile."""
    raw = await users.find_one({"userId": current_user["userId"]})
    if not raw:
        raise HTTPException(status_code=404, detail="User not found.")
    doc = UserDocument(**raw)
    return UserPublicResponse(userId=doc.userId, username=doc.username, createdAt=doc.createdAt)
