import requests
import time
from video_capture import get_video_frame
from audio_capture import get_audio_sample
from face_liveness import detect_faces_and_liveness
from gesture_recognition import detect_gestures

BACKEND_URL = 'http://localhost:8000/api/events'

while True:
    frame = get_video_frame()
    audio = get_audio_sample(duration=1)
    face_data = detect_faces_and_liveness(frame)
    gesture_data = detect_gestures(frame)
    event = {
        'timestamp': time.time(),
        'zone': 'A',
        **face_data,
        **gesture_data,
        'audio_level': float(abs(audio).mean()),
    }
    print('Sending event:', event)
    try:
        requests.post(BACKEND_URL, json=event, timeout=2)
    except Exception as e:
        print('Failed to send event:', e)
    time.sleep(2)