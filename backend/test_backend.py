from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_event_ingest():
    event = {
        "timestamp": 1234567890,
        "zone": "A",
        "face_present": 3,
        "hand_raised": 1,
        "disengaged": 0,
        "liveness_score": 0.9,
        "audio_level": 0.1
    }
    response = client.post("/api/events", json=event)
    assert response.status_code == 200
    assert response.json()["status"] == "ok"