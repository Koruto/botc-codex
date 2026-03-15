#!/bin/bash
# Production start: bind to PORT (required on Render) and 0.0.0.0.
# Use run.sh for local dev (reload, port 8000).

PORT="${PORT:-8000}"
exec uvicorn app.main:app --host 0.0.0.0 --port "$PORT"
