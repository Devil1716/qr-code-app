-- Insert test users
INSERT INTO users (id, name, email, role, department, student_id, teacher_id)
VALUES
  -- Admin
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@example.com', 'admin', 'Administration', NULL, NULL),
  
  -- Teachers
  ('00000000-0000-0000-0000-000000000002', 'Dr. Sarah Johnson', 'teacher@example.com', 'teacher', 'Computer Science', NULL, 'T123456'),
  ('00000000-0000-0000-0000-000000000003', 'Prof. Michael Brown', 'michael.brown@example.com', 'teacher', 'Mathematics', NULL, 'T789012'),
  ('00000000-0000-0000-0000-000000000004', 'Dr. Emily Davis', 'emily.davis@example.com', 'teacher', 'Physics', NULL, 'T345678'),
  
  -- Students
  ('00000000-0000-0000-0000-000000000005', 'John Smith', 'student@example.com', 'student', 'Computer Science', 'S12345', NULL),
  ('00000000-0000-0000-0000-000000000006', 'Emma Wilson', 'emma.wilson@example.com', 'student', 'Computer Science', 'S23456', NULL),
  ('00000000-0000-0000-0000-000000000007', 'James Taylor', 'james.taylor@example.com', 'student', 'Mathematics', 'S34567', NULL),
  ('00000000-0000-0000-0000-000000000008', 'Sophia Martinez', 'sophia.martinez@example.com', 'student', 'Physics', 'S45678', NULL),
  ('00000000-0000-0000-0000-000000000009', 'Daniel Johnson', 'daniel.johnson@example.com', 'student', 'Computer Science', 'S56789', NULL),
  ('00000000-0000-0000-0000-000000000010', 'Olivia Brown', 'olivia.brown@example.com', 'student', 'Mathematics', 'S67890', NULL)
ON CONFLICT (email) DO NOTHING;

-- Insert test classes
INSERT INTO classes (id, title, teacher_id, start_time, end_time, room)
VALUES
  ('00000000-0000-0000-0000-000000000011', 'Introduction to Computer Science', '00000000-0000-0000-0000-000000000002', '09:00', '10:30', 'Room 101'),
  ('00000000-0000-0000-0000-000000000012', 'Data Structures', '00000000-0000-0000-0000-000000000002', '11:00', '12:30', 'Room 102'),
  ('00000000-0000-0000-0000-000000000013', 'Advanced Web Development', '00000000-0000-0000-0000-000000000002', '14:00', '15:30', 'Room 103'),
  ('00000000-0000-0000-0000-000000000014', 'Calculus I', '00000000-0000-0000-0000-000000000003', '09:00', '10:30', 'Room 201'),
  ('00000000-0000-0000-0000-000000000015', 'Physics 101', '00000000-0000-0000-0000-000000000004', '13:00', '14:30', 'Room 301')
ON CONFLICT DO NOTHING;

-- Insert class enrollments
INSERT INTO class_enrollments (class_id, student_id)
VALUES
  -- John Smith's classes
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000005'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000005'),
  
  -- Emma Wilson's classes
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000006'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000006'),
  
  -- James Taylor's classes
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000007'),
  
  -- Sophia Martinez's classes
  ('00000000-0000-0000-0000-000000000015', '00000000-0000-0000-0000-000000000008'),
  
  -- Daniel Johnson's classes
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000009'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000009'),
  
  -- Olivia Brown's classes
  ('00000000-0000-0000-0000-000000000014', '00000000-0000-0000-0000-000000000010')
ON CONFLICT DO NOTHING;