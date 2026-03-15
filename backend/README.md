# Backend – BotC Grimoire Parser API

FastAPI backend for parsing Blood on the Clocktower grimoire images.

## Prerequisites

- Python 3.11+
- **Tesseract OCR** system binary (required for player-name extraction)
  - **Windows**: download the installer from [UB-Mannheim/tesseract](https://github.com/UB-Mannheim/tesseract/wiki) and add it to `PATH`, or just install it – the app auto-detects `C:\Program Files\Tesseract-OCR\tesseract.exe`.
  - **Linux/Mac**: `sudo apt install tesseract-ocr` / `brew install tesseract`

## Local Development

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`.  
Swagger UI: `http://localhost:8000/docs`

## Production (Render)

Deploy as a **Docker** service (not a Python service). Render's Python build environment has a read-only `/var/lib/apt`, so `apt-get` cannot be used there. A Dockerfile is the correct way to install Tesseract.

### Render dashboard settings

| Field | Value |
|---|---|
| **Environment** | Docker |
| **Dockerfile Path** | `./backend/Dockerfile` (or `./Dockerfile` if root is `backend/`) |
| **Docker Context** | `./backend` |

Render will build the image, install Tesseract + Python deps inside it, and start the container automatically. No Build Command or Start Command fields needed — the `CMD` in the Dockerfile handles it.

### Filesystem note

Render's filesystem is **read-only at runtime**. The debug pipeline endpoint gracefully skips saving debug images (`detected_tokens/`) when the filesystem is not writable – the JSON trace is still returned in full.

## Scripts

| Script | Purpose |
|---|---|
| `run.sh` | Local dev: activate venv + uvicorn with `--reload` |
| `start.sh` | Fallback production start (non-Docker): uvicorn on `$PORT` |
| `Dockerfile` | Production image for Render Docker deploys |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Root – confirms API is running |
| GET | `/api/health` | Health check |
| POST | `/api/grimoire/process` | Full grimoire image pipeline |
| POST | `/api/debug/pipeline` | Step-by-step pipeline trace (no auth) |

## Tech notes

- **OpenCV**: `opencv-python-headless` (no GUI libs, keeps deploy under 512 MB).
- **OCR**: `pytesseract` wraps the Tesseract binary – no heavy model downloads, fast startup.
- **Image preprocessing**: bilateral filter + Otsu threshold before OCR to maximise accuracy on varied grimoire lighting.
