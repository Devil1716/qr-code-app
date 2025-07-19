from export_summary import export_to_lms

def test_export_format():
    summary = {
        "session_id": "abc123",
        "attendance": 25,
        "engagement": 0.85
    }
    result = export_to_lms(summary)
    assert result["status"] == "success"