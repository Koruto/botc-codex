#!/usr/bin/env bash
# Render build script.
# Installs the Tesseract OCR system binary (not available via pip) then
# installs Python dependencies.
set -euo pipefail

echo "--- Installing Tesseract OCR ---"
sudo apt-get install -y --no-install-recommends tesseract-ocr

echo "--- Installing Python dependencies ---"
pip install -r requirements.txt
