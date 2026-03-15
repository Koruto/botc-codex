# Base image: Python 3.13 on Debian slim (small, no extra OS cruft).
FROM python:3.13-slim

# Install Tesseract OCR (system binary). pytesseract in Python only wraps it.
# -qq = quiet; --no-install-recommends = fewer packages; rm apt lists = smaller image.
RUN apt-get update -qq \
    && apt-get install -y --no-install-recommends tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*

# All following commands run from /app inside the container.
WORKDIR /app

# Install deps first so this layer is cached when only app code changes.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the app (app/, config, etc.).
COPY . .

# Default port; Render overrides PORT at runtime.
ENV PORT=8000
# JSON form = proper signal handling. exec makes uvicorn PID 1 so it gets SIGTERM.
# ${PORT:-8000} = use PORT if set, else 8000.
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
