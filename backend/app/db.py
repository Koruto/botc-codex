"""
MongoDB connection and database access.
Uses Motor (async driver). Connect/disconnect via app lifespan.
"""
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
import pymongo

from app.config import (
    FEEDBACK_COLLECTION,
    GAMES_COLLECTION,
    MEMBERSHIPS_COLLECTION,
    MONGODB_DB_NAME,
    MONGODB_URI,
    SERVERS_COLLECTION,
    USERS_COLLECTION,
)

_client: AsyncIOMotorClient | None = None


async def connect_db() -> None:
    """Connect to MongoDB and ensure all required indexes exist."""
    global _client
    _client = AsyncIOMotorClient(MONGODB_URI)
    db = _client[MONGODB_DB_NAME]

    # --- Games ---
    await db[GAMES_COLLECTION].create_index(
        [("serverId", pymongo.ASCENDING), ("gameId", pymongo.ASCENDING)], unique=True
    )
    await db[GAMES_COLLECTION].create_index("updatedAt")
    await db[GAMES_COLLECTION].create_index("createdBy")
    await db[GAMES_COLLECTION].create_index("visibility")

    # --- Users ---
    await db[USERS_COLLECTION].create_index("userId", unique=True)
    await db[USERS_COLLECTION].create_index("username", unique=True)
    # Email is optional; sparse unique index allows multiple docs with no email.
    await db[USERS_COLLECTION].create_index(
        "email", unique=True, sparse=True
    )

    # --- Servers ---
    await db[SERVERS_COLLECTION].create_index("serverId", unique=True)
    await db[SERVERS_COLLECTION].create_index("inviteCode", unique=True)
    await db[SERVERS_COLLECTION].create_index("createdBy")

    # --- Memberships ---
    await db[MEMBERSHIPS_COLLECTION].create_index(
        [("serverId", pymongo.ASCENDING), ("userId", pymongo.ASCENDING)], unique=True
    )
    await db[MEMBERSHIPS_COLLECTION].create_index("userId")

    # --- Feedback ---
    await db[FEEDBACK_COLLECTION].create_index("feedbackId", unique=True)
    await db[FEEDBACK_COLLECTION].create_index("created_at")


async def disconnect_db() -> None:
    """Close MongoDB connection. Call once at app shutdown."""
    global _client
    if _client is not None:
        _client.close()
        _client = None


def get_db():
    """Return the application database. Raises if not connected."""
    if _client is None:
        raise RuntimeError("MongoDB not connected; connect_db() must run at startup.")
    return _client[MONGODB_DB_NAME]


def get_games_collection() -> AsyncIOMotorCollection:
    return get_db()[GAMES_COLLECTION]


def get_users_collection() -> AsyncIOMotorCollection:
    return get_db()[USERS_COLLECTION]


def get_servers_collection() -> AsyncIOMotorCollection:
    return get_db()[SERVERS_COLLECTION]


def get_memberships_collection() -> AsyncIOMotorCollection:
    return get_db()[MEMBERSHIPS_COLLECTION]


def get_feedback_collection() -> AsyncIOMotorCollection:
    return get_db()[FEEDBACK_COLLECTION]
