"""Root and health routes."""
from fastapi import APIRouter

router = APIRouter(tags=["root"])


@router.get("/")
async def root():
    """Return API status and link to OpenAPI docs."""
    return {
        "status": "success",
        "message": "BotC Grimoire Parser API is running.",
        "docs": "/docs",
    }


@router.get("/api/health")
async def health_check():
    """Health check for load balancers and monitoring."""
    return {"status": "healthy", "service": "botc-grimoire-parser"}
