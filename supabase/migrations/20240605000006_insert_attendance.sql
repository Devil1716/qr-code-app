-- Insert sample attendance sessions and records

-- Insert sample attendance sessions for testing
INSERT INTO attendance_sessions (id, subject_id, teacher_id, session_date, start_time, end_time, qr_code, location, geofence_latitude, geofence_longitude, geofence_radius, is_active, session_type) VALUES
('00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000002', CURRENT_DATE, '09:00', '09:50', 'QR_CS101_' || EXTRACT(EPOCH FROM NOW())::TEXT, 'Room 101', 28.5355, 77.3910, 5.0, true, 'regular'),
('00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000002', CURRENT_DATE, '09:00', '09:50', 'QR_CS102_' || EXTRACT(EPOCH FROM NOW())::TEXT, 'Room 102', 28.5355, 77.3910, 5.0, false, 'regular'),
('00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000002', CURRENT_DATE, '09:00', '10:40', 'QR_CS103L_' || EXTRACT(EPOCH FROM NOW())::TEXT, 'Lab 103', 28.5355, 77.3910, 5.0, false, 'regular')
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  teacher_id = EXCLUDED.teacher_id,
  session_date = EXCLUDED.session_date,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  qr_code = EXCLUDED.qr_code,
  location = EXCLUDED.location,
  geofence_latitude = EXCLUDED.geofence_latitude,
  geofence_longitude = EXCLUDED.geofence_longitude,
  geofence_radius = EXCLUDED.geofence_radius,
  is_active = EXCLUDED.is_active,
  session_type = EXCLUDED.session_type;

-- Insert sample attendance records
INSERT INTO attendance_records (id, session_id, student_id, subject_id, attendance_status, recorded_at, location_latitude, location_longitude, distance_from_geofence) VALUES
('00000000-0000-0000-0000-000000000041', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011', 'present', now() - interval '1 hour', 28.5355, 77.3910, 2.5),
('00000000-0000-0000-0000-000000000042', '00000000-0000-0000-0000-000000000032', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000012', 'absent', NULL, NULL, NULL, NULL),
('00000000-0000-0000-0000-000000000043', '00000000-0000-0000-0000-000000000033', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000013', 'proxy_attempt', now() - interval '30 minutes', 28.5400, 77.3950, 15.2)
ON CONFLICT (id) DO UPDATE SET
  session_id = EXCLUDED.session_id,
  student_id = EXCLUDED.student_id,
  subject_id = EXCLUDED.subject_id,
  attendance_status = EXCLUDED.attendance_status,
  recorded_at = EXCLUDED.recorded_at,
  location_latitude = EXCLUDED.location_latitude,
  location_longitude = EXCLUDED.location_longitude,
  distance_from_geofence = EXCLUDED.distance_from_geofence;
