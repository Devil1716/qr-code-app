import cv2

def get_video_frame():
    cap = cv2.VideoCapture(0)
    ret, frame = cap.read()
    cap.release()
    if not ret:
        raise RuntimeError('Failed to capture video frame')
    return frame

if __name__ == '__main__':
    frame = get_video_frame()
    cv2.imshow('Frame', frame)
    cv2.waitKey(0)
    cv2.destroyAllWindows()