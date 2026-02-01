# BotC Grimoire Parser - Development Roadmap

## Project Overview

A FastAPI-based service that extracts Blood on the Clocktower game state from physical grimoire photographs using computer vision and OCR.

---

## Processing Methods

### Method 1: Easy Processing (Baseline)

**Goal**: Quick implementation with basic OCR accuracy

**Approach**:
- Simple image preprocessing (grayscale, basic contrast)
- Direct OCR on full image or basic region detection
- Simple text matching against character database
- Minimal post-processing

**Use Cases**:
- Proof of concept
- Testing pipeline structure
- Baseline performance metrics
- Development iteration

**Expected Performance**:
- OCR accuracy: 60-70% on good images
- Processing time: 1-2 seconds
- Works best with: High-quality images, good lighting, clear text

---

### Method 2: Better Processing (Advanced)

**Goal**: Production-ready accuracy with robust handling

**Approach**:
- Advanced preprocessing (noise reduction, adaptive thresholding, perspective correction)
- Precise circle/board detection and geometric correction
- Token-level segmentation with position mapping
- Multi-pass OCR with confidence scoring
- Fuzzy matching with character database
- Reminder token detection and classification
- Life/death state detection via visual cues

**Use Cases**:
- Production deployment
- Handling varied image quality
- Complex game states (many players, tokens, reminders)

**Expected Performance**:
- OCR accuracy: 85-95% on good images, 70-80% on challenging images
- Processing time: 3-5 seconds
- Works with: Varied lighting, angles, blur, different camera qualities

---

## Testing Strategy

### Test Image Collection

Create a comprehensive test suite with various scenarios:

```
test_images/
├── ideal/
│   ├── grimoire_7_player_ideal.jpg      # Perfect conditions
│   ├── grimoire_15_player_ideal.jpg     # Large game, good quality
│   └── grimoire_9_player_ideal.jpg      # Medium game
├── lighting/
│   ├── grimoire_shadow.jpg              # Shadow interference
│   ├── grimoire_bright.jpg               # Overexposed
│   └── grimoire_dim.jpg                  # Low light
├── quality/
│   ├── grimoire_blurry.jpg               # Motion blur
│   ├── grimoire_noisy.jpg                # High noise
│   └── grimoire_compressed.jpg           # Low resolution
├── perspective/
│   ├── grimoire_angled.jpg               # Off-angle shot
│   ├── grimoire_rotated.jpg              # Rotation needed
│   └── grimoire_closeup.jpg              # Close-up view
└── edge_cases/
    ├── grimoire_partial.jpg              # Partial board visible
    ├── grimoire_many_reminders.jpg       # Complex token states
    └── grimoire_custom_script.jpg        # Non-standard characters
```

### Testing Workflow

#### 1. Unit Tests
- Image preprocessing functions
- OCR service wrapper
- Character matching logic
- Data validation

#### 2. Integration Tests
- Full pipeline with test images
- Compare Method 1 vs Method 2 results
- Performance benchmarking
- Error handling scenarios

#### 3. Validation Tests
- Manual verification of extracted data
- Accuracy metrics per test image
- Processing time measurements
- Memory usage monitoring

### Test Endpoint Usage

**Endpoint**: `GET /api/grimoire/test/{filename}`

**Purpose**: Process images from `test_images/` folder without file upload

**Testing Flow**:
1. Place test image in `test_images/` directory
2. Start server: `uvicorn app.main:app --reload`
3. Navigate to `http://localhost:8000/docs`
4. Use `/api/grimoire/test/{filename}` endpoint
5. Compare results between Method 1 and Method 2
6. Iterate on improvements

**Response Schema**:
```json
{
  "status": "success",
  "processing_method": "easy" | "better",
  "processing_time_ms": 1234,
  "image_info": {
    "filename": "grimoire_sample.jpg",
    "dimensions": [1920, 1080],
    "file_size_kb": 456
  },
  "extracted_data": {
    "players": [
      {
        "position": 1,
        "character": "Empath",
        "character_type": "Townsfolk",
        "is_alive": true,
        "reminders": ["Poisoned"],
        "ocr_confidence": 0.87
      }
    ],
    "metadata": {
      "detected_player_count": 7,
      "script_detected": "Trouble Brewing",
      "tokens_detected": 7,
      "tokens_recognized": 5
    }
  },
  "debug_info": {
    "preprocessing_applied": ["grayscale", "contrast_enhancement", "noise_reduction"],
    "circle_detection_confidence": 0.92,
    "ocr_raw_results": ["Empath", "Fornue Teler", "..."]
  }
}
```

---

## Development Phases

### Phase 1: Basic Infrastructure & Method 1
- [x] FastAPI setup with Swagger UI
- [x] Test endpoint (`/api/grimoire/test/{filename}`)
- [ ] **Method 1 Implementation**
  - Basic image loading
  - Simple preprocessing
  - Direct OCR integration
  - Basic character matching
- [ ] Initial test suite with 3-5 sample images

### Phase 2: Method 1 Testing & Validation
- [ ] Create comprehensive test image collection
- [ ] Run Method 1 on all test images
- [ ] Document accuracy metrics
- [ ] Identify failure cases
- [ ] Establish baseline performance

### Phase 3: Method 2 Implementation
- [ ] Advanced preprocessing pipeline
- [ ] Circle/board detection
- [ ] Token segmentation
- [ ] Multi-pass OCR
- [ ] Enhanced character matching
- [ ] Reminder detection
- [ ] Life/death state detection

### Phase 4: Method 2 Testing & Comparison
- [ ] Run Method 2 on all test images
- [ ] Compare Method 1 vs Method 2 results
- [ ] Performance benchmarking
- [ ] Accuracy improvement analysis
- [ ] Edge case handling validation

### Phase 5: Production Readiness
- [ ] Error handling refinement
- [ ] Input validation
- [ ] Performance optimization
- [ ] Comprehensive logging
- [ ] Documentation

---

## Project Structure

```
botc-grimoire-parser/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entry point
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   └── grimoire.py            # Upload & OCR endpoints
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── image_processor.py     # OpenCV preprocessing
│   │   │   ├── ocr_service.py         # EasyOCR/PaddleOCR wrapper
│   │   │   └── processing_methods.py  # Method 1 & Method 2 implementations
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── schemas.py             # Pydantic response models
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── character_matcher.py   # Fuzzy match OCR to known characters
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_method1.py
│   │   ├── test_method2.py
│   │   ├── test_comparison.py
│   │   └── fixtures/
│   ├── test_images/                   # Test image collection
│   ├── uploads/                       # Runtime upload directory
│   ├── requirements.txt
│   ├── .env
│   └── README.md
└── frontend/                          # (Future - React app)
```

---

## Dependencies

**requirements.txt**:
```
fastapi==0.104.1
uvicorn[standard]==0.24.0
python-multipart==0.0.6
pillow==10.1.0
opencv-python==4.8.1.78
easyocr==1.7.0
numpy==1.24.3
pydantic==2.5.0
pytest==7.4.3
pytest-asyncio==0.21.1
```

**Environment Variables (.env)**:
```
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=10
ALLOWED_EXTENSIONS=jpg,jpeg,png
DEBUG=True
PROCESSING_METHOD=better  # or "easy" for baseline
```

---

## Success Metrics

### Method 1 (Easy)
- OCR accuracy: > 60% on good quality images
- Processing time: < 2 seconds per image
- Handle 7-15 player games
- Basic error handling

### Method 2 (Better)
- OCR accuracy: > 85% on good quality images, > 70% on challenging images
- Processing time: < 5 seconds per image
- Handle 7-15 player games with complex states
- Robust error handling and graceful degradation
- Reminder token detection accuracy: > 80%
- Life/death state detection accuracy: > 90%

---

## Processing Pipeline

### Method 1 Flow
```
Image Load → Basic Preprocessing → OCR → Simple Matching → Response
```

### Method 2 Flow
```
Image Load → Validation → Advanced Preprocessing → 
Board Detection → Geometric Correction → Token Segmentation → 
Multi-pass OCR → Confidence Scoring → Fuzzy Matching → 
Reminder Detection → Life/Death Detection → Response
```

---

## Next Steps

1. **Implement Method 1** - Get baseline working
2. **Build test image collection** - Gather diverse test cases
3. **Test Method 1 thoroughly** - Establish baseline metrics
4. **Implement Method 2** - Build advanced processing
5. **Compare methods** - Validate improvements
6. **Iterate on testing** - Refine based on results
