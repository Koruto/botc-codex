"""
BotC Codex Parser API – FastAPI app.
Routes are split into: root, grimoire (processing), auth, servers, games, users.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import CORS_ORIGINS
from app.db import connect_db, disconnect_db
from app.routers import games, grimoire, root
from app.routers import auth, debug, feedback, servers, users

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


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

app.include_router(root.router)
app.include_router(grimoire.router)
app.include_router(debug.router)
app.include_router(auth.router)
app.include_router(servers.router)
app.include_router(games.router)
app.include_router(users.router)
app.include_router(feedback.router)
