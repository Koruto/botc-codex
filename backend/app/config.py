"""
App config: paths and constants shared by routers and services.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).parent.parent
load_dotenv(BASE_DIR / ".env")
GRIMOIRE_IMAGES_DIR = BASE_DIR / "test_images"
REF_IMAGES_DIR = BASE_DIR / "ref-images"
DETECTED_TOKENS_DIR = BASE_DIR / "detected_tokens"
GAMES_DIR = BASE_DIR / "games"

MAX_UPLOAD_MB = 10
ALLOWED_IMAGE_TYPES = ("image/jpeg", "image/png", "image/jpg")

INCLUDE_TRACEBACK_IN_ERROR = os.getenv("DEBUG", "false").lower() == "true"

# ----- MongoDB -----
# ENV: "development" | "production" – used for default DB name when MONGODB_DB_NAME is not set.
ENV = os.getenv("ENV", "development").lower()
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME") or (
    "botc_codex_dev" if ENV == "development" else "botc_codex"
)
GAMES_COLLECTION = "games"
USERS_COLLECTION = "users"
SERVERS_COLLECTION = "servers"
MEMBERSHIPS_COLLECTION = "memberships"
FEEDBACK_COLLECTION = "feedback"

# ----- Auth / JWT -----
JWT_SECRET = os.getenv("JWT_SECRET", "change-me-in-production-use-a-strong-random-secret")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# ----- Gmail SMTP (feedback email notifications) -----
# Gmail address used to send feedback notifications (no custom domain required).
GMAIL_USER = os.getenv("GMAIL_USER", "")
# App password from Google Account → Security → 2-Step Verification → App passwords.
GMAIL_APP_PASSWORD = os.getenv("GMAIL_APP_PASSWORD", "")
# Email address that receives feedback notifications.
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "")

# ----- Cookies -----
# In development (Vite proxy or same-site), keep COOKIE_SECURE=false and COOKIE_SAMESITE=lax.
# In production (HTTPS, cross-origin), set COOKIE_SECURE=true and COOKIE_SAMESITE=none.
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
