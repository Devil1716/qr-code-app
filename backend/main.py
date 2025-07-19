from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import asyncio

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

@app.post("/api/events")
async def ingest_event(request: Request):
    event = await request.json()
    EVENTS.append(event)
    # Broadcast to all connected WebSocket clients
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