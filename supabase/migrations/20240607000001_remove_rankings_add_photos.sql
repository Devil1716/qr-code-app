-- Remove student rankings table and related functions/triggers
DROP TRIGGER IF EXISTS update_rankings_after_change ON student_rankings;
DROP TRIGGER IF EXISTS update_student_ranking_score ON student_rankings;
DROP FUNCTION IF EXISTS update_all_rankings();
DROP FUNCTION IF EXISTS update_ranking_score();
DROP TABLE IF EXISTS student_rankings;

-- Add image_url column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update existing users with default avatar images
UPDATE users 
SET image_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || id
WHERE image_url IS NULL;

-- Insert mock data for testing
-- Insert mock teachers
INSERT INTO users (id, name, email, role, teacher_id, department, password, image_url) VALUES
('teacher-1', 'Dr. Sarah Johnson', 'sarah.johnson@university.edu', 'teacher', 'T001', 'Computer Science', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1'),
('teacher-2', 'Prof. Michael Chen', 'michael.chen@university.edu', 'teacher', 'T002', 'Mathematics', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher2'),
('teacher-3', 'Dr. Emily Davis', 'emily.davis@university.edu', 'teacher', 'T003', 'Physics', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher3')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  teacher_id = EXCLUDED.teacher_id,
  department = EXCLUDED.department,
  image_url = EXCLUDED.image_url;

-- Insert mock students
INSERT INTO users (id, name, email, role, student_id, department, password, image_url) VALUES
('student-1', 'Alice Smith', 'alice.smith@student.edu', 'student', 'S001', 'Computer Science', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1'),
('student-2', 'Bob Wilson', 'bob.wilson@student.edu', 'student', 'S002', 'Computer Science', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2'),
('student-3', 'Carol Brown', 'carol.brown@student.edu', 'student', 'S003', 'Mathematics', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student3'),
('student-4', 'David Lee', 'david.lee@student.edu', 'student', 'S004', 'Physics', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student4'),
('student-5', 'Eva Martinez', 'eva.martinez@student.edu', 'student', 'S005', 'Computer Science', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student5')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  student_id = EXCLUDED.student_id,
  department = EXCLUDED.department,
  image_url = EXCLUDED.image_url;

-- Insert mock subjects
INSERT INTO subjects (id, course_code, subject_name, subject_type, credits, department, teacher_id, student_limit, is_active) VALUES
('subject-1', 'CS101', 'Introduction to Programming', 'theory', 3, 'Computer Science', 'teacher-1', 50, true),
('subject-2', 'CS102', 'Data Structures', 'theory', 4, 'Computer Science', 'teacher-1', 40, true),
('subject-3', 'CS103', 'Programming Lab', 'lab', 2, 'Computer Science', 'teacher-1', 25, true),
('subject-4', 'MATH201', 'Calculus I', 'theory', 4, 'Mathematics', 'teacher-2', 60, true),
('subject-5', 'PHY101', 'Physics Fundamentals', 'theory', 3, 'Physics', 'teacher-3', 45, true)
ON CONFLICT (id) DO UPDATE SET
  course_code = EXCLUDED.course_code,
  subject_name = EXCLUDED.subject_name,
  subject_type = EXCLUDED.subject_type,
  credits = EXCLUDED.credits,
  department = EXCLUDED.department,
  teacher_id = EXCLUDED.teacher_id,
  student_limit = EXCLUDED.student_limit,
  is_active = EXCLUDED.is_active;

-- Insert slot assignments for subjects
INSERT INTO slot_assignments (id, subject_id, slot_id, is_active) VALUES
('assignment-1', 'subject-1', (SELECT id FROM slots WHERE slot_code = 'A1' LIMIT 1), true),
('assignment-2', 'subject-2', (SELECT id FROM slots WHERE slot_code = 'B2' LIMIT 1), true),
('assignment-3', 'subject-3', (SELECT id FROM slots WHERE slot_code = 'C3' LIMIT 1), true),
('assignment-4', 'subject-4', (SELECT id FROM slots WHERE slot_code = 'D4' LIMIT 1), true),
('assignment-5', 'subject-5', (SELECT id FROM slots WHERE slot_code = 'E5' LIMIT 1), true)
ON CONFLICT (id) DO UPDATE SET
  subject_id = EXCLUDED.subject_id,
  slot_id = EXCLUDED.slot_id,
  is_active = EXCLUDED.is_active;

-- Insert student subject registrations
INSERT INTO student_subject_registrations (id, student_id, subject_id, registration_date, is_active) VALUES
('reg-1', 'student-1', 'subject-1', NOW(), true),
('reg-2', 'student-1', 'subject-2', NOW(), true),
('reg-3', 'student-1', 'subject-3', NOW(), true),
('reg-4', 'student-2', 'subject-1', NOW(), true),
('reg-5', 'student-2', 'subject-3', NOW(), true),
('reg-6', 'student-3', 'subject-4', NOW(), true),
('reg-7', 'student-4', 'subject-5', NOW(), true),
('reg-8', 'student-5', 'subject-1', NOW(), true),
('reg-9', 'student-5', 'subject-2', NOW(), true)
ON CONFLICT (id) DO UPDATE SET
  student_id = EXCLUDED.student_id,
  subject_id = EXCLUDED.subject_id,
  registration_date = EXCLUDED.registration_date,
  is_active = EXCLUDED.is_active;

-- Insert some sample attendance records
INSERT INTO attendance_records (id, student_id, subject_id, status, created_at) VALUES
('att-1', 'student-1', 'subject-1', 'present', NOW() - INTERVAL '1 day'),
('att-2', 'student-1', 'subject-2', 'present', NOW() - INTERVAL '1 day'),
('att-3', 'student-2', 'subject-1', 'absent', NOW() - INTERVAL '1 day'),
('att-4', 'student-2', 'subject-3', 'present', NOW() - INTERVAL '2 days'),
('att-5', 'student-5', 'subject-1', 'present', NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO UPDATE SET
  student_id = EXCLUDED.student_id,
  subject_id = EXCLUDED.subject_id,
  status = EXCLUDED.status,
  created_at = EXCLUDED.created_at;

-- Insert temporary classes for events
INSERT INTO temporary_classes (id, title, description, start_datetime, end_datetime, location, student_limit, teacher_id, department, is_active) VALUES
('temp-1', 'AI Workshop', 'Introduction to Artificial Intelligence and Machine Learning', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day' + INTERVAL '2 hours', 'Lab 101', 25, 'teacher-1', 'Computer Science', true),
('temp-2', 'Web Development Seminar', 'Modern web development techniques and frameworks', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days' + INTERVAL '3 hours', 'Auditorium', 100, 'teacher-1', 'Computer Science', true),
('temp-3', 'Mathematics Competition', 'Annual mathematics problem-solving competition', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days' + INTERVAL '4 hours', 'Main Hall', 50, 'teacher-2', 'Mathematics', true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  start_datetime = EXCLUDED.start_datetime,
  end_datetime = EXCLUDED.end_datetime,
  location = EXCLUDED.location,
  student_limit = EXCLUDED.student_limit,
  teacher_id = EXCLUDED.teacher_id,
  department = EXCLUDED.department,
  is_active = EXCLUDED.is_active;

-- Insert temporary class registrations
INSERT INTO temporary_class_registrations (id, student_id, temporary_class_id, registration_date, approval_status) VALUES
('temp-reg-1', 'student-1', 'temp-1', NOW(), 'approved'),
('temp-reg-2', 'student-2', 'temp-1', NOW(), 'approved'),
('temp-reg-3', 'student-5', 'temp-2', NOW(), 'approved'),
('temp-reg-4', 'student-3', 'temp-3', NOW(), 'approved')
ON CONFLICT (id) DO UPDATE SET
  student_id = EXCLUDED.student_id,
  temporary_class_id = EXCLUDED.temporary_class_id,
  registration_date = EXCLUDED.registration_date,
  approval_status = EXCLUDED.approval_status;