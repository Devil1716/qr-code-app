import unittest
from face_liveness import detect_faces_and_liveness
from gesture_recognition import detect_gestures
from audio_capture import get_audio_sample
import numpy as np

class TestEdgePipeline(unittest.TestCase):
    def test_face_detection(self):
        dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        faces = detect_faces_and_liveness(dummy_frame)
        self.assertIn('face_present', faces)
        self.assertIn('liveness_score', faces)

    def test_gesture_detection(self):
        dummy_frame = np.zeros((480, 640, 3), dtype=np.uint8)
        gestures = detect_gestures(dummy_frame)
        self.assertIn('hand_raised', gestures)
        self.assertIn('disengaged', gestures)

    def test_audio_capture(self):
        audio = get_audio_sample(duration=0.1)
        self.assertIsInstance(audio, np.ndarray)
        self.assertGreater(audio.size, 0)

if __name__ == '__main__':
    unittest.main()