"""
Feedback router: receive bug reports, feature requests, and general feedback.
Stores each submission in MongoDB and sends an admin notification via Gmail SMTP.
"""
import asyncio
import logging
import smtplib
import uuid
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, status
from motor.motor_asyncio import AsyncIOMotorCollection

from app.auth import get_optional_user
from app.config import ADMIN_EMAIL, GMAIL_APP_PASSWORD, GMAIL_USER
from app.db import get_feedback_collection
from app.models.schemas.feedback import FeedbackBody, FeedbackDocument

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

_TYPE_LABELS = {
    "bug": "Bug Report",
    "feature": "Feature Request",
    "general": "General Feedback",
}


def _send_email_sync(
    gmail_user: str,
    gmail_app_password: str,
    to_email: str,
    subject: str,
    html_body: str,
) -> None:
    """Send an email via Gmail SMTP (blocking)."""
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"Botc Codex <{gmail_user}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))
    with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
        smtp.starttls()
        smtp.login(gmail_user, gmail_app_password)
        smtp.sendmail(gmail_user, to_email, msg.as_string())


async def _send_email_notification(
    feedback_type: str,
    title: str,
    message: str,
    submitted_by: Optional[str],
) -> None:
    """Send a notification email to the admin via Gmail SMTP. Silently skips if not configured."""
    if not GMAIL_USER or not GMAIL_APP_PASSWORD:
        logger.warning("Email skipped: GMAIL_USER or GMAIL_APP_PASSWORD is not set")
        return
    if not ADMIN_EMAIL:
        logger.warning("Email skipped: ADMIN_EMAIL is not set")
        return

    type_label = _TYPE_LABELS.get(feedback_type, feedback_type)
    author = submitted_by or "Anonymous"
    html_body = f"""
<h2>[BotC Codex] New {type_label}</h2>
<p><strong>From:</strong> {author}</p>
<p><strong>Title:</strong> {title}</p>
<hr />
<p>{message.replace(chr(10), '<br />')}</p>
"""
    subject = f"[BotC Codex Feedback] {type_label}: {title}"
    await asyncio.to_thread(
        _send_email_sync,
        GMAIL_USER,
        GMAIL_APP_PASSWORD,
        ADMIN_EMAIL,
        subject,
        html_body,
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
