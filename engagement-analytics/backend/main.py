from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import time

app = FastAPI()

origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory event store and WebSocket clients
EVENTS = []
WS_CLIENTS = set()
ZONE_STATS = {}
ALERTS = []

ALERT_THRESHOLDS = {
    'disengaged': 1,  # If disengaged flag is set
    'face_present': 0,  # If no face present
}

@app.post("/api/events")
async def ingest_event(request: Request):
    event = await request.json()
    EVENTS.append(event)
    zone = event.get('zone', 'A')
    # Aggregate stats by zone
    if zone not in ZONE_STATS:
        ZONE_STATS[zone] = {'face_present': 0, 'disengaged': 0, 'count': 0}
    ZONE_STATS[zone]['face_present'] += event.get('face_present', 0)
    ZONE_STATS[zone]['disengaged'] += event.get('disengaged', 0)
    ZONE_STATS[zone]['count'] += 1
    # Simple alert logic
    alert = None
    if event.get('disengaged', 0) >= ALERT_THRESHOLDS['disengaged']:
        alert = {'type': 'disengagement', 'zone': zone, 'timestamp': time.time(), 'msg': f'Zone {zone} disengaged!'}
    elif event.get('face_present', 1) <= ALERT_THRESHOLDS['face_present']:
        alert = {'type': 'no_face', 'zone': zone, 'timestamp': time.time(), 'msg': f'No face detected in Zone {zone}!'}
    if alert:
        ALERTS.append(alert)
        # Broadcast alert to all WebSocket clients
        for ws in WS_CLIENTS:
            try:
                await ws.send_json({'alert': alert})
            except Exception:
                pass
    # Broadcast event to all WebSocket clients
    for ws in WS_CLIENTS:
        try:
            await ws.send_json(event)
        except Exception:
            pass
    return JSONResponse({"status": "ok"})

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    WS_CLIENTS.add(websocket)
    try:
        while True:
            await asyncio.sleep(1)
    except Exception:
        pass
    finally:
        WS_CLIENTS.remove(websocket)