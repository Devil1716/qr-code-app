-- Insert slot assignments and registrations

-- Insert slot assignments to create a realistic timetable
INSERT INTO slot_assignments (subject_id, slot_id, academic_year, semester) 
SELECT s.id, sl.id, '2024-25', 'Summer'
FROM subjects s, slots sl
WHERE 
  -- CS101 - Monday A slot (9:00-9:50)
  (s.course_code = 'CS101' AND sl.slot_code = 'A' AND sl.day_of_week = 1 AND sl.start_time = '09:00')
  OR
  -- CS102 - Tuesday B slot (9:00-9:50)
  (s.course_code = 'CS102' AND sl.slot_code = 'B' AND sl.day_of_week = 2 AND sl.start_time = '09:00')
  OR
  -- CS103L - Monday L1 slot (9:00-10:40)
  (s.course_code = 'CS103L' AND sl.slot_code = 'L1' AND sl.day_of_week = 1 AND sl.start_time = '09:00')
  OR
  -- CS201 - Wednesday C3 slot (9:00-9:50)
  (s.course_code = 'CS201' AND sl.slot_code = 'C3' AND sl.day_of_week = 3 AND sl.start_time = '09:00')
  OR
  -- CS301 - Thursday D3 slot (9:00-9:50)
  (s.course_code = 'CS301' AND sl.slot_code = 'D3' AND sl.day_of_week = 4 AND sl.start_time = '09:00')
  OR
  -- CS302L - Tuesday L5 slot (9:00-10:40)
  (s.course_code = 'CS302L' AND sl.slot_code = 'L5' AND sl.day_of_week = 2 AND sl.start_time = '09:00')
  OR
  -- CS401 - Friday E3 slot (9:00-9:50)
  (s.course_code = 'CS401' AND sl.slot_code = 'E3' AND sl.day_of_week = 5 AND sl.start_time = '09:00')
  OR
  -- CS402 - Monday F slot (9:55-10:45)
  (s.course_code = 'CS402' AND sl.slot_code = 'F' AND sl.day_of_week = 1 AND sl.start_time = '09:55')
ON CONFLICT (subject_id, slot_id, academic_year, semester) DO NOTHING;

-- Register the student to multiple subjects for testing
INSERT INTO student_subject_registrations (student_id, subject_id) VALUES
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000011'), -- CS101
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000012'), -- CS102
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000013'), -- CS103L
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000014'), -- CS201
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000015'), -- CS301
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000016')  -- CS302L
ON CONFLICT (student_id, subject_id) DO NOTHING;

-- Insert some temporary classes for testing
INSERT INTO temporary_classes (id, title, description, teacher_id, start_datetime, end_datetime, location, attendance_credit, student_limit) VALUES
('00000000-0000-0000-0000-000000000021', 'Special Lecture: AI Ethics', 'Guest lecture on ethical considerations in AI development', '00000000-0000-0000-0000-000000000002', '2024-12-20 14:00:00+00', '2024-12-20 15:30:00+00', 'Auditorium A', true, 100),
('00000000-0000-0000-0000-000000000022', 'Workshop: React Best Practices', 'Hands-on workshop covering modern React development patterns', '00000000-0000-0000-0000-000000000002', '2024-12-21 10:00:00+00', '2024-12-21 12:00:00+00', 'Lab 201', true, 30),
('00000000-0000-0000-0000-000000000023', 'Industry Talk: Career in Tech', 'Industry professionals sharing career insights', '00000000-0000-0000-0000-000000000002', '2024-12-22 16:00:00+00', '2024-12-22 17:00:00+00', 'Conference Room B', false, 50)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  teacher_id = EXCLUDED.teacher_id,
  start_datetime = EXCLUDED.start_datetime,
  end_datetime = EXCLUDED.end_datetime,
  location = EXCLUDED.location,
  attendance_credit = EXCLUDED.attendance_credit,
  student_limit = EXCLUDED.student_limit;

-- Register student for temporary classes
INSERT INTO temporary_class_registrations (student_id, temporary_class_id, approval_status, approved_by, approved_at) VALUES
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000021', 'approved', '00000000-0000-0000-0000-000000000002', now()),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000022', 'approved', '00000000-0000-0000-0000-000000000002', now()),
('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000023', 'pending', NULL, NULL)
ON CONFLICT (student_id, temporary_class_id) DO UPDATE SET
  approval_status = EXCLUDED.approval_status,
  approved_by = EXCLUDED.approved_by,
  approved_at = EXCLUDED.approved_at;
