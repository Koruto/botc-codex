from pydantic import BaseModel, Field
from typing import Annotated, Any, Dict, List, Literal, Optional, Union


class PlayerData(BaseModel):
    position: Optional[int] = None
    player_name: Optional[str] = None
    character: Optional[str] = None
    character_type: Optional[str] = None
    is_alive: Optional[bool] = None
    reminders: List[str] = []
    match_confidence: Optional[float] = None


class ExtractedData(BaseModel):
    players: List[PlayerData] = []
    metadata: Dict[str, Any] = {}


class ImageInfo(BaseModel):
    filename: str
    dimensions: List[int]
    file_size_kb: float


class DebugInfo(BaseModel):
    """Processing metadata for extract-tokens responses (preprocessing and pipeline steps)."""
    preprocessing_applied: List[str] = []
    processing_steps: List[str] = []


DEAD_SUFFIX = "-dead"


class TokenMatch(BaseModel):
    """Token-to-character match from ORB feature matching. is_dead is True when the best match is a -dead reference."""
    token: int
    character: Optional[str] = None
    character_type: Optional[str] = None
    confidence: float
    is_dead: Optional[bool] = None


class MatchTokensResponse(BaseModel):
    """Response for /api/match-tokens: ORB-matched tokens against ref-images."""
    matches: List[TokenMatch]


class ParsedToken(BaseModel):
    """Parsed token: position, player name (OCR), character (ORB match), and dead state from -dead ref images."""
    token: int
    player_name: Optional[str] = None
    character: Optional[str] = None
    character_type: Optional[str] = None
    confidence: float
    is_dead: Optional[bool] = None


class ParseGrimoireResponse(BaseModel):
    """Response for /api/grimoire/parse: extract + match combined, correct character name per token."""
    tokens: List[ParsedToken]


class TownSquarePlayer(BaseModel):
    """Player entry for Town Square Load State JSON."""
    name: str = ""
    id: str = ""
    role: str = ""  # optional on input; default for pasted JSON that omits it
    reminders: List[str] = []
    isVoteless: bool = False
    isDead: bool = False
    pronouns: str = ""


class TownSquareGameState(BaseModel):
    """Game state payload for Town Square Load State (bluffs, edition, players with role and isDead)."""
    bluffs: List[str] = []
    edition: Dict[str, str] = {"id": "bmr"}
    roles: str = ""
    fabled: List[Dict[str, object]] = []  # fabled list items; shape varies by edition
    players: List[TownSquarePlayer] = []


# ----- Game meta (matches client GameMeta) -----
class GameMeta(BaseModel):
    playedOn: str = ""
    edition: str = "bmr"
    playerCount: int = 0
    storyteller: str = ""
    coStorytellers: Optional[List[str]] = None


# ----- Game events (discriminated union; matches client event.types) -----
class NarrativeEvent(BaseModel):
    type: Literal["narrative"] = "narrative"
    label: str = ""
    body: str = ""


class DeathEvent(BaseModel):
    type: Literal["death"] = "death"
    playerId: str = ""
    cause: Literal["night_kill", "ability", "execution", "other"] = "night_kill"
    sourcePlayerId: Optional[str] = None
    sourceRoleId: Optional[str] = None
    reason: Optional[str] = None


class AbilityEvent(BaseModel):
    type: Literal["ability"] = "ability"
    playerId: str = ""
    roleId: str = ""
    targets: Optional[List[str]] = None
    isPublic: bool = False
    result: Optional[str] = None


class NominationEvent(BaseModel):
    type: Literal["nomination"] = "nomination"
    nominatorId: str = ""
    nomineeId: str = ""
    votesFor: List[str] = []
    votesAgainst: List[str] = []
    passed: bool = False
    tiebreak: Optional[bool] = None


class ExecutionEvent(BaseModel):
    type: Literal["execution"] = "execution"
    playerId: str = ""
    prevented: Optional[bool] = None
    reason: Optional[str] = None


class PrivateRoomEvent(BaseModel):
    type: Literal["private_room"] = "private_room"
    players: List[str] = []
    highlights: str = ""


class GhostVoteEvent(BaseModel):
    type: Literal["ghost_vote"] = "ghost_vote"
    playerId: str = ""


class GhostVoteRestoredEvent(BaseModel):
    type: Literal["ghost_vote_restored"] = "ghost_vote_restored"
    playerId: str = ""
    sourceRoleId: Optional[str] = None


class TravellerJoinEvent(BaseModel):
    type: Literal["traveller_join"] = "traveller_join"
    playerId: str = ""


class TravellerLeaveEvent(BaseModel):
    type: Literal["traveller_leave"] = "traveller_leave"
    playerId: str = ""
    reason: Optional[str] = None


class RoleChangeEvent(BaseModel):
    type: Literal["role_change"] = "role_change"
    playerId: str = ""
    oldRoleId: str = ""
    newRoleId: str = ""
    reason: Optional[str] = None


GameEvent = Annotated[
    Union[
        NarrativeEvent,
        DeathEvent,
        AbilityEvent,
        NominationEvent,
        ExecutionEvent,
        PrivateRoomEvent,
        GhostVoteEvent,
        GhostVoteRestoredEvent,
        TravellerJoinEvent,
        TravellerLeaveEvent,
        RoleChangeEvent,
    ],
    Field(discriminator="type"),
]


class GamePhase(BaseModel):
    """Single phase (pregame, day, night, etc.) with events. Matches client GamePhase."""
    type: str = "pregame"  # pregame | day | night | grimoire_reveal
    phaseNumber: Optional[int] = None
    title: str = ""
    subtitle: str = ""
    events: List[GameEvent] = []


class GrimoireResponse(BaseModel):
    status: str
    processing_method: str
    processing_time_ms: float
    image_info: ImageInfo
    extracted_data: ExtractedData
    debug_info: DebugInfo


class GameCreateBody(BaseModel):
    """Body for creating a draft game. JSON shape matches client create body."""
    name: Optional[str] = None  # identifier/slug for listing and URLs
    townSquare: Optional[TownSquareGameState] = None
    meta: Optional[GameMeta] = None
    phases: Optional[List[GamePhase]] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None


class GameUpdateBody(BaseModel):
    """Body for partial update of a draft game. JSON shape matches client."""
    name: Optional[str] = None
    townSquare: Optional[TownSquareGameState] = None
    meta: Optional[GameMeta] = None
    phases: Optional[List[GamePhase]] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    winner: Optional[str] = None
    status: Optional[str] = None  # "draft" | "published"


class GameDocument(BaseModel):
    """Stored game (draft or published). JSON shape matches client GameDocument."""
    gameId: str
    serverId: str
    status: str = "draft"  # "draft" | "published"
    updatedAt: str  # ISO datetime
    name: Optional[str] = None  # identifier for listing
    townSquare: Optional[TownSquareGameState] = None
    meta: Optional[GameMeta] = None
    phases: Optional[List[GamePhase]] = None
    title: Optional[str] = None
    subtitle: Optional[str] = None
    winner: Optional[str] = None
