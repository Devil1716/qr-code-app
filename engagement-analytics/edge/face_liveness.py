import cv2

# Load OpenCV's pre-trained Haar cascade for face detection
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

def detect_faces_and_liveness(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)
    face_present = len(faces) > 0
    # Placeholder liveness score (real model would go here)
    liveness_score = 0.95 if face_present else 0.0
    return {
        'face_present': int(face_present),
        'liveness_score': liveness_score
    }

if __name__ == '__main__':
    import video_capture
    frame = video_capture.get_video_frame()
    result = detect_faces_and_liveness(frame)
    print(result)
    cv2.imshow('Frame', frame)
    cv2.waitKey(0)
    cv2.destroyAllWindows()