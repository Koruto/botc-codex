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

### Build Command

```bash
./build.sh
```

`build.sh` runs `sudo apt-get install tesseract-ocr` **then** `pip install -r requirements.txt`.  
Tesseract must be installed at build time because Render's filesystem is read-only at runtime and `apt-get` is only available during the build phase.

### Start Command

```bash
./start.sh
```

Binds to `0.0.0.0:$PORT` as required by Render. The `PORT` env var is set automatically by Render.

> **Note:** Do not use `run.sh` or a hardcoded port for the start command – Render will report "No open ports detected" and the deploy will fail.

### Filesystem note

Render's filesystem is **read-only at runtime**. The debug pipeline endpoint gracefully skips saving debug images (`detected_tokens/`) when the filesystem is not writable – the JSON trace is still returned in full.

## Scripts

| Script | Purpose |
|---|---|
| `build.sh` | Render build: install Tesseract + Python deps |
| `start.sh` | Render start: production uvicorn on `$PORT` |
| `run.sh` | Local dev: activate venv + uvicorn with `--reload` |

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
