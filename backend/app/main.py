"""
BotC Codex Parser API – FastAPI app.
Routes are split into: root, grimoire (processing), auth, servers, games, users.
"""
import logging
from contextlib import asynccontextmanager
from time import perf_counter

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.auth import _resolve_token, decode_token
from app.config import CORS_ORIGINS
from app.db import connect_db, disconnect_db
from app.routers import games, grimoire, root
from app.routers import auth, debug, feedback, servers, users

logging.basicConfig(
    level=logging.INFO,
    format="%(levelname)s: %(asctime)s: %(name)s: %(message)s",
)
request_logger = logging.getLogger("app.request")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await disconnect_db()


app = FastAPI(
    title="BotC Codex Parser API",
    description="API for extracting Blood on the Clocktower game state from grimoire photographs",
    version="1.0.0",
    lifespan=lifespan,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = perf_counter()
    username = "-"
    try:
        token = _resolve_token(
            request.cookies.get("access_token"),
            request.headers.get("Authorization"),
        )
        if token:
            payload = decode_token(token)
            if payload.get("type") == "access":
                username = str(payload.get("username") or "-")
    except Exception:
        pass

    response = await call_next(request)
    duration_ms = (perf_counter() - start) * 1000.0

    request_logger.info(
        '%s "%s %s" %s user=%s time=%.2fms',
        request.method,
        request.url.path,
        request.url.query or "",
        response.status_code,
        username,
        duration_ms,
    )

    return response


app.include_router(root.router)
app.include_router(grimoire.router)
app.include_router(debug.router)
app.include_router(auth.router)
app.include_router(servers.router)
app.include_router(games.router)
app.include_router(users.router)
app.include_router(feedback.router)
