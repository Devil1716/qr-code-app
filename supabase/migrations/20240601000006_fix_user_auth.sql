-- This migration fixes issues with user authentication

-- First, ensure the users table exists
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  department TEXT,
  student_id TEXT UNIQUE,
  teacher_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clear existing users to avoid conflicts
DELETE FROM class_enrollments;
DELETE FROM classes;
DELETE FROM users;

-- Insert users with fixed UUIDs
INSERT INTO users (id, name, email, role, department, student_id, teacher_id)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@example.com', 'admin', 'Administration', NULL, NULL),
  ('00000000-0000-0000-0000-000000000002', 'Dr. Sarah Johnson', 'teacher@example.com', 'teacher', 'Computer Science', NULL, 'T123456'),
  ('00000000-0000-0000-0000-000000000003', 'John Smith', 'student@example.com', 'student', 'Computer Science', 'S12345', NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  student_id = EXCLUDED.student_id,
  teacher_id = EXCLUDED.teacher_id;

-- Insert classes with fixed teacher ID
INSERT INTO classes (id, title, teacher_id, start_time, end_time, room)
VALUES
  ('00000000-0000-0000-0000-000000000011', 'Introduction to Computer Science', '00000000-0000-0000-0000-000000000002', '09:00', '10:30', 'Room 101'),
  ('00000000-0000-0000-0000-000000000012', 'Data Structures', '00000000-0000-0000-0000-000000000002', '11:00', '12:30', 'Room 102'),
  ('00000000-0000-0000-0000-000000000013', 'Advanced Web Development', '00000000-0000-0000-0000-000000000002', '14:00', '15:30', 'Room 103')
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  teacher_id = EXCLUDED.teacher_id,
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  room = EXCLUDED.room;

-- Insert enrollments
INSERT INTO class_enrollments (class_id, student_id)
VALUES
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000012', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000013', '00000000-0000-0000-0000-000000000003')
ON CONFLICT (class_id, student_id) DO NOTHING;