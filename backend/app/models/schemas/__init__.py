"""
Schema package: re-exports all schemas so existing imports still work.

Usage: from app.models.schemas import GameDocument, GameMeta, ...
"""
# Grimoire (pipeline + Town Square)
from app.models.schemas.grimoire import (
    DEAD_SUFFIX,
    DebugInfo,
    ExtractedData,
    GrimoireResponse,
    ImageInfo,
    MatchTokensResponse,
    ParseGrimoireResponse,
    ParsedToken,
    PlayerData,
    TokenMatch,
    TownSquareGameState,
    TownSquarePlayer,
)

# Events + phases
from app.models.schemas.events import (
    AbilityEvent,
    DeathEvent,
    ExecutionEvent,
    GameEvent,
    GamePhase,
    GhostVoteEvent,
    GhostVoteRestoredEvent,
    NarrativeEvent,
    NominationEvent,
    PrivateRoomEvent,
    RoleChangeEvent,
    TravellerJoinEvent,
    TravellerLeaveEvent,
)

# Script (custom edition roles)
from app.models.schemas.script import (
    CustomScript,
    RoleInfo,
    ScriptMeta,
)

# Game meta
from app.models.schemas.game_meta import GameMeta

# Game CRUD
from app.models.schemas.game import (
    CopyGameBody,
    GameCreateBody,
    GameDocument,
    GameUpdateBody,
)

# User
from app.models.schemas.user import (
    LoginBody,
    SignupBody,
    UserDocument,
    UserPublicResponse,
)

# Server
from app.models.schemas.server import (
    MembershipDocument,
    ServerCreateBody,
    ServerDocument,
    ServerRenameBody,
)

__all__ = [
    "DEAD_SUFFIX",
    "DebugInfo",
    "ExtractedData",
    "GrimoireResponse",
    "ImageInfo",
    "MatchTokensResponse",
    "ParseGrimoireResponse",
    "ParsedToken",
    "PlayerData",
    "TokenMatch",
    "TownSquareGameState",
    "TownSquarePlayer",
    "AbilityEvent",
    "DeathEvent",
    "ExecutionEvent",
    "GameEvent",
    "GamePhase",
    "GhostVoteEvent",
    "GhostVoteRestoredEvent",
    "NarrativeEvent",
    "NominationEvent",
    "PrivateRoomEvent",
    "RoleChangeEvent",
    "TravellerJoinEvent",
    "TravellerLeaveEvent",
    "CustomScript",
    "RoleInfo",
    "ScriptMeta",
    "GameMeta",
    "CopyGameBody",
    "GameCreateBody",
    "GameDocument",
    "GameUpdateBody",
    "LoginBody",
    "SignupBody",
    "UserDocument",
    "UserPublicResponse",
    "MembershipDocument",
    "ServerCreateBody",
    "ServerDocument",
    "ServerRenameBody",
]
