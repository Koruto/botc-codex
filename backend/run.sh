#!/bin/bash
# Simple script to run the FastAPI server

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/Scripts/activate 2>/dev/null || source venv/bin/activate
fi

# Run the server
uvicorn app.main:app --reload
