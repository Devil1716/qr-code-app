-- Clear existing data and insert authorized users and subjects

-- Clear existing users and insert authorized users only
DELETE FROM student_subject_registrations;
DELETE FROM temporary_class_registrations;
DELETE FROM attendance_records;
DELETE FROM attendance_sessions;
DELETE FROM slot_assignments;
DELETE FROM subjects;
DELETE FROM temporary_classes;
DELETE FROM users;

-- Insert only authorized users with secure credentials
INSERT INTO users (id, name, email, role, department, student_id, teacher_id, image_url, password, last_login) VALUES
-- Admin
('00000000-0000-0000-0000-000000000001', 'Admin Sharan', 'ssharan.s@outlook.com', 'admin', 'Administration', NULL, NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin1', 'Sharan17#', now()),

-- Teacher
('00000000-0000-0000-0000-000000000002', 'Teacher Sharan', 'sharan071718@gmail.com', 'teacher', 'Computer Science', NULL, 'T123456', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1', 'Sharan17#', now()),

-- Student
('00000000-0000-0000-0000-000000000003', 'Student Sharan', 'sharan@s.amity.edu', 'student', 'Computer Science', 'S67890', NULL, 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1', 'Sharan17#', now())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  student_id = EXCLUDED.student_id,
  teacher_id = EXCLUDED.teacher_id,
  image_url = EXCLUDED.image_url,
  password = EXCLUDED.password,
  last_login = EXCLUDED.last_login;

-- Insert sample subjects
INSERT INTO subjects (id, course_code, subject_name, teacher_id, subject_type, credits, student_limit) VALUES
('00000000-0000-0000-0000-000000000011', 'CS101', 'Introduction to Computer Science', '00000000-0000-0000-0000-000000000002', 'theory', 3, 60),
('00000000-0000-0000-0000-000000000012', 'CS102', 'Data Structures', '00000000-0000-0000-0000-000000000002', 'theory', 3, 60),
('00000000-0000-0000-0000-000000000013', 'CS103L', 'Programming Lab', '00000000-0000-0000-0000-000000000002', 'lab', 2, 30),
('00000000-0000-0000-0000-000000000014', 'CS201', 'Advanced Web Development', '00000000-0000-0000-0000-000000000002', 'theory', 4, 45),
('00000000-0000-0000-0000-000000000015', 'CS301', 'Database Management Systems', '00000000-0000-0000-0000-000000000002', 'theory', 3, 50),
('00000000-0000-0000-0000-000000000016', 'CS302L', 'Database Lab', '00000000-0000-0000-0000-000000000002', 'lab', 2, 25),
('00000000-0000-0000-0000-000000000017', 'CS401', 'Software Engineering', '00000000-0000-0000-0000-000000000002', 'theory', 4, 40),
('00000000-0000-0000-0000-000000000018', 'CS402', 'Machine Learning', '00000000-0000-0000-0000-000000000002', 'theory', 3, 35)
ON CONFLICT (id) DO UPDATE SET
  course_code = EXCLUDED.course_code,
  subject_name = EXCLUDED.subject_name,
  teacher_id = EXCLUDED.teacher_id,
  subject_type = EXCLUDED.subject_type,
  credits = EXCLUDED.credits,
  student_limit = EXCLUDED.student_limit;
