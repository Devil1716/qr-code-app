-- Create indexes, views and enable realtime

-- Enable realtime for new tables
alter publication supabase_realtime add table slots;
alter publication supabase_realtime add table subjects;
alter publication supabase_realtime add table slot_assignments;
alter publication supabase_realtime add table temporary_classes;
alter publication supabase_realtime add table student_subject_registrations;
alter publication supabase_realtime add table temporary_class_registrations;
alter publication supabase_realtime add table security_logs;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_slots_day_time ON slots(day_of_week, start_time);
CREATE INDEX IF NOT EXISTS idx_slot_assignments_subject ON slot_assignments(subject_id);
CREATE INDEX IF NOT EXISTS idx_slot_assignments_slot ON slot_assignments(slot_id);
CREATE INDEX IF NOT EXISTS idx_student_registrations_student ON student_subject_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_student_registrations_subject ON student_subject_registrations(subject_id);
CREATE INDEX IF NOT EXISTS idx_temp_class_registrations_student ON temporary_class_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_temp_class_registrations_class ON temporary_class_registrations(temporary_class_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Create view for student timetables
CREATE OR REPLACE VIEW student_timetables AS
SELECT 
  ssr.student_id,
  u.name as student_name,
  s.id as subject_id,
  s.course_code,
  s.subject_name,
  s.subject_type,
  s.credits,
  t.name as teacher_name,
  sl.slot_code,
  sl.day_of_week,
  sl.start_time,
  sl.end_time,
  CASE sl.day_of_week
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
  END as day_name
FROM student_subject_registrations ssr
JOIN subjects s ON ssr.subject_id = s.id
JOIN users u ON ssr.student_id = u.id
JOIN users t ON s.teacher_id = t.id
JOIN slot_assignments sa ON s.id = sa.subject_id
JOIN slots sl ON sa.slot_id = sl.id
WHERE ssr.is_active = true
  AND s.is_active = true
  AND sa.is_active = true
  AND sl.is_active = true
ORDER BY ssr.student_id, sl.day_of_week, sl.start_time;

-- Create view for teacher timetables
CREATE OR REPLACE VIEW teacher_timetables AS
SELECT 
  s.teacher_id,
  t.name as teacher_name,
  s.id as subject_id,
  s.course_code,
  s.subject_name,
  s.subject_type,
  s.credits,
  s.student_limit,
  COUNT(ssr.student_id) as enrolled_students,
  sl.slot_code,
  sl.day_of_week,
  sl.start_time,
  sl.end_time,
  CASE sl.day_of_week
    WHEN 1 THEN 'Monday'
    WHEN 2 THEN 'Tuesday'
    WHEN 3 THEN 'Wednesday'
    WHEN 4 THEN 'Thursday'
    WHEN 5 THEN 'Friday'
  END as day_name
FROM subjects s
JOIN users t ON s.teacher_id = t.id
JOIN slot_assignments sa ON s.id = sa.subject_id
JOIN slots sl ON sa.slot_id = sl.id
LEFT JOIN student_subject_registrations ssr ON s.id = ssr.subject_id AND ssr.is_active = true
WHERE s.is_active = true
  AND sa.is_active = true
  AND sl.is_active = true
GROUP BY s.teacher_id, t.name, s.id, s.course_code, s.subject_name, s.subject_type, s.credits, s.student_limit, sl.slot_code, sl.day_of_week, sl.start_time, sl.end_time
ORDER BY s.teacher_id, sl.day_of_week, sl.start_time;
