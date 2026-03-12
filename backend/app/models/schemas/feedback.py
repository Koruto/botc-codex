"""
Feedback request/document schemas.
"""
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


class FeedbackBody(BaseModel):
    type: Literal["bug", "feature", "general"]
    title: str = Field(..., min_length=1, max_length=100)
    message: str = Field(..., min_length=1, max_length=1000)


class FeedbackDocument(BaseModel):
    feedbackId: str
    type: Literal["bug", "feature", "general"]
    title: str
    message: str
    submitted_by: Optional[str] = None
    created_at: datetime
