from fastapi import FastAPI

app = FastAPI(
    title="BotC Codex Parser API",
    description="API for extracting Blood on the Clocktower game state from grimoire photographs",
    version="1.0.0"
)


@app.get("/")
async def root():
    """Root endpoint to test if the API is working"""
    return {
        "status": "success",
        "message": "BotC Grimoire Parser API is running!",
        "docs": "/docs"
    }


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "botc-grimoire-parser"
    }
