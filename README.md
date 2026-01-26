# BotC Grimoire Parser

A FastAPI-based service that extracts Blood on the Clocktower game state from physical grimoire photographs using computer vision and OCR.

## Project Overview

This project aims to automate the process of reading and parsing Blood on the Clocktower grimoire boards from photographs. The system will:

- Accept grimoire images (photos of the physical game board)
- Process images using computer vision techniques
- Extract text and game state information using OCR
- Return structured JSON data representing the current game state

## Features (Planned)

- **Image Processing**: Preprocessing and enhancement of grimoire photographs
- **OCR Integration**: Text extraction from player tokens and game elements
- **Character Recognition**: Fuzzy matching of OCR results to known BotC characters
- **Game State Extraction**: Detection of player positions, life/death states, and reminders
- **RESTful API**: Easy-to-use endpoints for integration with other applications

## Project Structure

```
botc-codex/
├── backend/          # FastAPI backend service
│   ├── app/         # Application code
│   └── README.md    # Backend-specific documentation
├── frontend/         # (Future) React frontend application
└── Doc.md           # Detailed project documentation
```

## Getting Started

See the [backend README](backend/README.md) for instructions on how to run the API server.

## Development Phases

1. **Phase 1**: Basic infrastructure and API setup
2. **Phase 2**: Image preprocessing with OpenCV
3. **Phase 3**: OCR integration (EasyOCR/PaddleOCR)
4. **Phase 4**: Data processing and character matching
5. **Phase 5**: Polish, optimization, and error handling

