# Real-Time Classroom Engagement & Attendance System

## Overview
This project is a modular, privacy-first classroom analytics platform that extends a QR code attendance app with real-time video/audio engagement monitoring, a live dashboard, and LMS integration.

## Structure
- `edge/`: Edge/on-prem processing (video/audio capture, event emission)
- `backend/`: FastAPI backend for event ingestion and WebSocket streaming
- `dashboard/`: React web dashboard for real-time visualization
- `lms_integration/`: LMS export stub

## Quickstart

### 1. Edge Module
```bash
cd edge
pip install -r requirements.txt
python test_edge_pipeline.py  # Run tests
python event_emitter.py       # Start sending events (requires backend running)
```

### 2. Backend
```bash
cd backend
pip install -r requirements.txt
pytest test_backend.py        # Run tests
uvicorn main:app --reload     # Start backend (default: http://localhost:8000)
```

### 3. Dashboard
```bash
cd dashboard
npm install
npm start                     # Open http://localhost:3000
```

### 4. LMS Integration
```bash
cd lms_integration
pip install -r requirements.txt
python test_lms_export.py     # Run test
```

## Notes
- All video/audio is processed locally; only anonymized event data is sent to backend.
- No persistent storage of raw video/audio or un-hashed IDs.
- The dashboard updates in real time via WebSocket.
- Extend stubs in `edge/` for real models, and in `backend/` for alert/session logic.
