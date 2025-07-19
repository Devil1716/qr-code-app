-- Fix database schema issues
-- Drop existing tables to recreate with proper structure
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS class_enrollments CASCADE;
DROP TABLE IF EXISTS classes CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table with all required columns
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  password TEXT NOT NULL,
  student_id TEXT UNIQUE,
  teacher_id TEXT UNIQUE,
  department TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create class_enrollments table
CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id)
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'proxy_attempt')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable realtime for all tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE classes;
ALTER PUBLICATION supabase_realtime ADD TABLE class_enrollments;
ALTER PUBLICATION supabase_realtime ADD TABLE attendance_records;

-- Insert mock data using proper UUID generation
DO $$
DECLARE
    admin_uuid UUID := gen_random_uuid();
    teacher1_uuid UUID := gen_random_uuid();
    teacher2_uuid UUID := gen_random_uuid();
    teacher3_uuid UUID := gen_random_uuid();
    student1_uuid UUID := gen_random_uuid();
    student2_uuid UUID := gen_random_uuid();
    student3_uuid UUID := gen_random_uuid();
    student4_uuid UUID := gen_random_uuid();
    student5_uuid UUID := gen_random_uuid();
    class1_uuid UUID := gen_random_uuid();
    class2_uuid UUID := gen_random_uuid();
    class3_uuid UUID := gen_random_uuid();
    class4_uuid UUID := gen_random_uuid();
    class5_uuid UUID := gen_random_uuid();
BEGIN
    -- Insert admin user
    INSERT INTO users (id, name, email, role, password, image_url) VALUES
    (admin_uuid, 'Admin User', 'admin@example.com', 'admin', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin');

    -- Insert mock teachers
    INSERT INTO users (id, name, email, role, teacher_id, department, password, image_url) VALUES
    (teacher1_uuid, 'Dr. Sarah Johnson', 'sarah.johnson@university.edu', 'teacher', 'T001', 'Computer Science', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1'),
    (teacher2_uuid, 'Prof. Michael Chen', 'michael.chen@university.edu', 'teacher', 'T002', 'Mathematics', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher2'),
    (teacher3_uuid, 'Dr. Emily Davis', 'emily.davis@university.edu', 'teacher', 'T003', 'Physics', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=teacher3');

    -- Insert mock students
    INSERT INTO users (id, name, email, role, student_id, department, password, image_url) VALUES
    (student1_uuid, 'Alice Smith', 'alice.smith@student.edu', 'student', 'S001', 'Computer Science', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1'),
    (student2_uuid, 'Bob Wilson', 'bob.wilson@student.edu', 'student', 'S002', 'Computer Science', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student2'),
    (student3_uuid, 'Carol Brown', 'carol.brown@student.edu', 'student', 'S003', 'Mathematics', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student3'),
    (student4_uuid, 'David Lee', 'david.lee@student.edu', 'student', 'S004', 'Physics', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student4'),
    (student5_uuid, 'Eva Martinez', 'eva.martinez@student.edu', 'student', 'S005', 'Computer Science', 'Sharan17#', 'https://api.dicebear.com/7.x/avataaars/svg?seed=student5');

    -- Insert mock classes
    INSERT INTO classes (id, title, teacher_id, room, start_time, end_time, capacity) VALUES
    (class1_uuid, 'Introduction to Programming', teacher1_uuid, 'Room 101', '09:00:00', '10:30:00', 50),
    (class2_uuid, 'Data Structures', teacher1_uuid, 'Room 102', '11:00:00', '12:30:00', 40),
    (class3_uuid, 'Calculus I', teacher2_uuid, 'Room 201', '14:00:00', '15:30:00', 60),
    (class4_uuid, 'Physics Fundamentals', teacher3_uuid, 'Room 301', '10:00:00', '11:30:00', 45),
    (class5_uuid, 'Advanced Programming', teacher1_uuid, 'Lab 101', '16:00:00', '17:30:00', 25);

    -- Insert class enrollments
    INSERT INTO class_enrollments (student_id, class_id) VALUES
    (student1_uuid, class1_uuid),
    (student1_uuid, class2_uuid),
    (student2_uuid, class1_uuid),
    (student2_uuid, class5_uuid),
    (student3_uuid, class3_uuid),
    (student4_uuid, class4_uuid),
    (student5_uuid, class1_uuid),
    (student5_uuid, class2_uuid);

    -- Insert sample attendance records
    INSERT INTO attendance_records (student_id, class_id, status, location_lat, location_lng) VALUES
    (student1_uuid, class1_uuid, 'present', 12.9716, 77.5946),
    (student1_uuid, class2_uuid, 'present', 12.9716, 77.5946),
    (student2_uuid, class1_uuid, 'absent', NULL, NULL),
    (student2_uuid, class5_uuid, 'present', 12.9716, 77.5946),
    (student5_uuid, class1_uuid, 'present', 12.9716, 77.5946),
    (student3_uuid, class3_uuid, 'proxy_attempt', 12.9800, 77.6000);
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_teacher_id ON users(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON attendance_records(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance_records(created_at);