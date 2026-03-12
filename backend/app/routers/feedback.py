"""
Feedback router: receive bug reports, feature requests, and general feedback.
Stores each submission in MongoDB and fires an admin email via Resend.
"""
import logging
import uuid
from datetime import datetime, timezone
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorCollection

from app.auth import get_optional_user
from app.config import ADMIN_EMAIL, RESEND_API_KEY, RESEND_FROM_EMAIL
from app.db import get_feedback_collection
from app.models.schemas.feedback import FeedbackBody, FeedbackDocument

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

_TYPE_LABELS = {
    "bug": "Bug Report",
    "feature": "Feature Request",
    "general": "General Feedback",
}


async def _send_email_notification(
    feedback_type: str,
    title: str,
    message: str,
    submitted_by: Optional[str],
) -> None:
    """Send a notification email to the admin via Resend. Silently skips if not configured."""
    if not RESEND_API_KEY:
        logger.warning("Email skipped: RESEND_API_KEY is not set")
        return
    if not ADMIN_EMAIL:
        logger.warning("Email skipped: ADMIN_EMAIL is not set")
        return
    if not RESEND_FROM_EMAIL:
        logger.warning("Email skipped: RESEND_FROM_EMAIL is not set")
        return

    type_label = _TYPE_LABELS.get(feedback_type, feedback_type)
    author = submitted_by or "Anonymous"
    from_domain = f"Botc Codex <{RESEND_FROM_EMAIL}>"
    html_body = f"""
<h2>[BotC Codex] New {type_label}</h2>
<p><strong>From:</strong> {author}</p>
<p><strong>Title:</strong> {title}</p>
<hr />
<p>{message.replace(chr(10), '<br />')}</p>
"""
    payload = {
        "from": from_domain,
        "to": [ADMIN_EMAIL],
        "subject": f"[BotC Codex Feedback] {type_label}: {title}",
        "html": html_body,
    }

    async with httpx.AsyncClient() as client:
        await client.post(
            "https://api.resend.com/emails",
            json=payload,
            headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
            timeout=10.0,
        )


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_feedback(
    body: FeedbackBody,
    current_user: Optional[dict] = Depends(get_optional_user),
    feedback: AsyncIOMotorCollection = Depends(get_feedback_collection),
):
    """
    Submit a piece of feedback. Auth is optional — if logged in, the username
    is attached to the stored document and included in the admin email.
    """
    submitted_by = current_user["username"] if current_user else None
    feedback_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    doc = FeedbackDocument(
        feedbackId=feedback_id,
        type=body.type,
        title=body.title,
        message=body.message,
        submitted_by=submitted_by,
        created_at=now,
    )
    await feedback.insert_one(doc.model_dump(mode="json", exclude_none=True))

    try:
        await _send_email_notification(body.type, body.title, body.message, submitted_by)
    except Exception:
        logger.exception("Unexpected error while sending feedback email notification")

    return {"id": feedback_id, "message": "Feedback submitted"}
