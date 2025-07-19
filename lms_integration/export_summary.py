def export_to_lms(summary):
    print('Exporting to LMS:', summary)
    return {"status": "success"}

if __name__ == '__main__':
    test_summary = {"session_id": "abc123", "attendance": 25, "engagement": 0.85}
    export_to_lms(test_summary)