"""
One-time script to backfill slug for existing games that don't have one.
Run from backend dir: python -m scripts.backfill_game_slugs
Requires MONGODB_URI and MONGODB_DB_NAME in env (or .env).
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from motor.motor_asyncio import AsyncIOMotorClient

from app.config import GAMES_COLLECTION, MONGODB_DB_NAME, MONGODB_URI


def _title_to_slug(title: str) -> str:
    s = (title or "").strip().lower().replace(" ", "-")
    s = "".join(c for c in s if c in "abcdefghijklmnopqrstuvwxyz0123456789-")
    return s.strip("-") or "game"


async def main() -> None:
    client = AsyncIOMotorClient(MONGODB_URI)
    db = client[MONGODB_DB_NAME]
    games = db[GAMES_COLLECTION]

    used_slugs: set[str] = set()
    async for doc in games.find({}):
        s = doc.get("slug")
        if s:
            used_slugs.add(s)

    async for doc in games.find(
        {"$or": [{"slug": None}, {"slug": ""}, {"slug": {"$exists": False}}]}
    ):
        game_id = doc.get("gameId")
        title = doc.get("title") or "Untitled"
        base = _title_to_slug(title)
        slug = base
        n = 2
        while slug in used_slugs:
            slug = f"{base}-{n}"
            n += 1
        used_slugs.add(slug)
        await games.update_one({"gameId": game_id}, {"$set": {"slug": slug}})
        print(f"  {game_id} {title!r} -> slug={slug}")

    client.close()
    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
