"""
Game event types and phases. Matches client event.types / game.types.
"""
from typing import Annotated, List, Literal, Optional, Union

from pydantic import BaseModel, Field


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
    chainedToIndex: Optional[int] = None


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
    chainedToIndex: Optional[int] = None


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
    type: str = "pregame"
    phaseNumber: Optional[int] = None
    title: str = ""
    subtitle: str = ""
    events: List[GameEvent] = []
