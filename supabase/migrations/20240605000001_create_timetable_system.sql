-- Create comprehensive timetable system based on PDF reference

-- Create attendance_sessions table if it doesn't exist (from initial schema)
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id),
  teacher_id UUID REFERENCES users(id),
  session_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  qr_code TEXT,
  location TEXT,
  geofence_latitude DECIMAL,
  geofence_longitude DECIMAL,
  geofence_radius DECIMAL DEFAULT 5.0,
  is_active BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create attendance_records table if it doesn't exist (from initial schema)
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  class_id UUID REFERENCES classes(id),
  student_id UUID NOT NULL REFERENCES users(id),
  attendance_status TEXT NOT NULL CHECK (attendance_status IN ('present', 'absent', 'proxy_attempt')),
  is_manual BOOLEAN DEFAULT false,
  marked_by UUID REFERENCES users(id),
  location_latitude DECIMAL,
  location_longitude DECIMAL,
  distance_from_geofence DECIMAL,
  recorded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- First, update users table to support case-insensitive emails and new user accounts
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP WITH TIME ZONE;

-- Create function to normalize emails to lowercase
CREATE OR REPLACE FUNCTION normalize_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email = LOWER(NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically normalize emails
DROP TRIGGER IF EXISTS normalize_email_trigger ON users;
CREATE TRIGGER normalize_email_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION normalize_email();

-- Create slots table for time slot definitions
CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_code TEXT NOT NULL UNIQUE, -- A, B, C, D, E, F, G, H, L1, L2, etc.
  slot_type TEXT NOT NULL CHECK (slot_type IN ('theory', 'lab')), -- theory or lab
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 5), -- 1=Monday, 5=Friday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT NOT NULL UNIQUE,
  subject_name TEXT NOT NULL,
  teacher_id UUID REFERENCES users(id),
  subject_type TEXT NOT NULL CHECK (subject_type IN ('theory', 'lab')),
  credits INTEGER DEFAULT 3,
  student_limit INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create slot assignments table (links subjects to time slots)
CREATE TABLE IF NOT EXISTS slot_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  slot_id UUID NOT NULL REFERENCES slots(id),
  academic_year TEXT NOT NULL DEFAULT '2024-25',
  semester TEXT NOT NULL DEFAULT 'Summer',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(subject_id, slot_id, academic_year, semester)
);

-- Create temporary classes/events table
CREATE TABLE IF NOT EXISTS temporary_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  teacher_id UUID REFERENCES users(id),
  start_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  end_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  attendance_credit BOOLEAN DEFAULT false,
  student_limit INTEGER DEFAULT 60,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'weekly', 'daily', etc.
  recurrence_end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create student subject registrations table
CREATE TABLE IF NOT EXISTS student_subject_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  subject_id UUID NOT NULL REFERENCES subjects(id),
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, subject_id)
);

-- Create temporary class registrations table
CREATE TABLE IF NOT EXISTS temporary_class_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id),
  temporary_class_id UUID NOT NULL REFERENCES temporary_classes(id),
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, temporary_class_id)
);

-- Update attendance_sessions to support both regular subjects and temporary classes
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id);
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS temporary_class_id UUID REFERENCES temporary_classes(id);
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS session_type TEXT DEFAULT 'regular' CHECK (session_type IN ('regular', 'temporary'));

-- Update attendance_records to support the new structure
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES subjects(id);
ALTER TABLE attendance_records ADD COLUMN IF NOT EXISTS temporary_class_id UUID REFERENCES temporary_classes(id);

-- Insert time slots based on the PDF reference
INSERT INTO slots (slot_code, slot_type, day_of_week, start_time, end_time) VALUES
-- Monday Theory Slots
('A', 'theory', 1, '09:00', '09:50'),
('F', 'theory', 1, '09:55', '10:45'),
('C', 'theory', 1, '10:50', '11:40'),
('H', 'theory', 1, '11:45', '12:35'),
-- Monday Afternoon Theory Slots
('A', 'theory', 1, '13:15', '14:05'),
('F', 'theory', 1, '14:10', '15:00'),
('C', 'theory', 1, '15:05', '15:55'),
('H', 'theory', 1, '16:00', '16:50'),
-- Monday Lab Slots
('L1', 'lab', 1, '09:00', '10:40'),
('L2', 'lab', 1, '10:50', '12:30'),
('L3', 'lab', 1, '13:15', '14:55'),
('L4', 'lab', 1, '15:05', '16:45'),
('L21', 'lab', 1, '09:00', '10:40'),
('L22', 'lab', 1, '10:50', '12:30'),
('L23', 'lab', 1, '13:15', '14:55'),
('L24', 'lab', 1, '15:05', '16:45'),

-- Tuesday Theory Slots
('B', 'theory', 2, '09:00', '09:50'),
('G', 'theory', 2, '09:55', '10:45'),
('D', 'theory', 2, '10:50', '11:40'),
('A', 'theory', 2, '11:45', '12:35'),
-- Tuesday Afternoon Theory Slots
('B', 'theory', 2, '13:15', '14:05'),
('G', 'theory', 2, '14:10', '15:00'),
('D', 'theory', 2, '15:05', '15:55'),
('A', 'theory', 2, '16:00', '16:50'),
-- Tuesday Lab Slots
('L5', 'lab', 2, '09:00', '10:40'),
('L6', 'lab', 2, '10:50', '12:30'),
('L7', 'lab', 2, '13:15', '14:55'),
('L8', 'lab', 2, '15:05', '16:45'),
('L25', 'lab', 2, '09:00', '10:40'),
('L26', 'lab', 2, '10:50', '12:30'),
('L27', 'lab', 2, '13:15', '14:55'),
('L28', 'lab', 2, '15:05', '16:45'),

-- Wednesday Theory Slots
('C', 'theory', 3, '09:00', '09:50'),
('H', 'theory', 3, '09:55', '10:45'),
('E', 'theory', 3, '10:50', '11:40'),
('B', 'theory', 3, '11:45', '12:35'),
-- Wednesday Afternoon Theory Slots
('C', 'theory', 3, '13:15', '14:05'),
('H', 'theory', 3, '14:10', '15:00'),
('E', 'theory', 3, '15:05', '15:55'),
('B', 'theory', 3, '16:00', '16:50'),
-- Wednesday Lab Slots
('L9', 'lab', 3, '09:00', '10:40'),
('L10', 'lab', 3, '10:50', '12:30'),
('L11', 'lab', 3, '13:15', '14:55'),
('L12', 'lab', 3, '15:05', '16:45'),
('L29', 'lab', 3, '09:00', '10:40'),
('L30', 'lab', 3, '10:50', '12:30'),
('L31', 'lab', 3, '13:15', '14:55'),
('L32', 'lab', 3, '15:05', '16:45'),

-- Thursday Theory Slots
('D', 'theory', 4, '09:00', '09:50'),
('A', 'theory', 4, '09:55', '10:45'),
('F', 'theory', 4, '10:50', '11:40'),
('C', 'theory', 4, '11:45', '12:35'),
-- Thursday Afternoon Theory Slots
('D', 'theory', 4, '13:15', '14:05'),
('A', 'theory', 4, '14:10', '15:00'),
('F', 'theory', 4, '15:05', '15:55'),
('C', 'theory', 4, '16:00', '16:50'),
-- Thursday Lab Slots
('L13', 'lab', 4, '09:00', '10:40'),
('L14', 'lab', 4, '10:50', '12:30'),
('L15', 'lab', 4, '13:15', '14:55'),
('L16', 'lab', 4, '15:05', '16:45'),
('L33', 'lab', 4, '09:00', '10:40'),
('L34', 'lab', 4, '10:50', '12:30'),
('L35', 'lab', 4, '13:15', '14:55'),
('L36', 'lab', 4, '15:05', '16:45'),

-- Friday Theory Slots
('E', 'theory', 5, '09:00', '09:50'),
('B', 'theory', 5, '09:55', '10:45'),
('G', 'theory', 5, '10:50', '11:40'),
('D', 'theory', 5, '11:45', '12:35'),
-- Friday Afternoon Theory Slots
('E', 'theory', 5, '13:15', '14:05'),
('B', 'theory', 5, '14:10', '15:00'),
('G', 'theory', 5, '15:05', '15:55'),
('D', 'theory', 5, '16:00', '16:50'),
-- Friday Lab Slots
('L17', 'lab', 5, '09:00', '10:40'),
('L18', 'lab', 5, '10:50', '12:30'),
('L19', 'lab', 5, '13:15', '14:55'),
('L20', 'lab', 5, '15:05', '16:45'),
('L37', 'lab', 5, '09:00', '10:40'),
('L38', 'lab', 5, '10:50', '12:30'),
('L39', 'lab', 5, '13:15', '14:55'),
('L40', 'lab', 5, '15:05', '16:45')
ON CONFLICT (slot_code) DO NOTHING;

-- Create security logs table for tracking access attempts
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  details JSONB,
  user_agent TEXT,
  ip_address TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

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
  -- CS201 - Wednesday C slot (9:00-9:50)
  (s.course_code = 'CS201' AND sl.slot_code = 'C' AND sl.day_of_week = 3 AND sl.start_time = '09:00')
  OR
  -- CS301 - Thursday D slot (9:00-9:50)
  (s.course_code = 'CS301' AND sl.slot_code = 'D' AND sl.day_of_week = 4 AND sl.start_time = '09:00')
  OR
  -- CS302L - Tuesday L5 slot (9:00-10:40)
  (s.course_code = 'CS302L' AND sl.slot_code = 'L5' AND sl.day_of_week = 2 AND sl.start_time = '09:00')
  OR
  -- CS401 - Friday E slot (9:00-9:50)
  (s.course_code = 'CS401' AND sl.slot_code = 'E' AND sl.day_of_week = 5 AND sl.start_time = '09:00')
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

-- Create engagement monitoring tables
CREATE TABLE IF NOT EXISTS classroom_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  zone_name TEXT NOT NULL, -- 'Zone A', 'Zone B', etc.
  zone_coordinates JSONB, -- Seating map coordinates
  capacity INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create engagement records table for real-time monitoring
CREATE TABLE IF NOT EXISTS engagement_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  zone_id UUID REFERENCES classroom_zones(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  attention_score DECIMAL(3,2) CHECK (attention_score >= 0 AND attention_score <= 1),
  participation_score DECIMAL(3,2) CHECK (participation_score >= 0 AND participation_score <= 1),
  confusion_level DECIMAL(3,2) CHECK (confusion_level >= 0 AND confusion_level <= 1),
  audio_sentiment DECIMAL(3,2) CHECK (audio_sentiment >= -1 AND audio_sentiment <= 1),
  noise_level DECIMAL(3,2) CHECK (noise_level >= 0 AND noise_level <= 1),
  face_presence_count INTEGER DEFAULT 0,
  hand_raise_count INTEGER DEFAULT 0,
  posture_engagement DECIMAL(3,2) CHECK (posture_engagement >= 0 AND posture_engagement <= 1),
  processed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quiz responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  student_id UUID REFERENCES users(id),
  quiz_question TEXT NOT NULL,
  student_response TEXT,
  correct_answer TEXT,
  is_correct BOOLEAN,
  response_time_seconds INTEGER,
  confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create engagement alerts table
CREATE TABLE IF NOT EXISTS engagement_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  zone_id UUID REFERENCES classroom_zones(id),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('disengagement', 'confusion_spike', 'low_participation', 'noise_disruption')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  message TEXT NOT NULL,
  threshold_value DECIMAL(3,2),
  current_value DECIMAL(3,2),
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create session summaries table for LMS export
CREATE TABLE IF NOT EXISTS session_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  total_students INTEGER,
  average_attention DECIMAL(3,2),
  average_participation DECIMAL(3,2),
  confusion_incidents INTEGER,
  intervention_count INTEGER,
  quiz_completion_rate DECIMAL(3,2),
  overall_engagement_score DECIMAL(3,2),
  summary_data JSONB,
  exported_to_lms BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add engagement columns to attendance_sessions
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS engagement_monitoring_enabled BOOLEAN DEFAULT true;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS privacy_consent_required BOOLEAN DEFAULT true;
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS video_processing_mode TEXT DEFAULT 'edge' CHECK (video_processing_mode IN ('edge', 'on_prem', 'cloud'));

-- Enable realtime for new tables
alter publication supabase_realtime add table slots;
alter publication supabase_realtime add table subjects;
alter publication supabase_realtime add table slot_assignments;
alter publication supabase_realtime add table temporary_classes;
alter publication supabase_realtime add table student_subject_registrations;
alter publication supabase_realtime add table temporary_class_registrations;
alter publication supabase_realtime add table security_logs;
alter publication supabase_realtime add table classroom_zones;
alter publication supabase_realtime add table engagement_records;
alter publication supabase_realtime add table quiz_responses;
alter publication supabase_realtime add table engagement_alerts;
alter publication supabase_realtime add table session_summaries;

-- Insert sample classroom zones for testing
INSERT INTO classroom_zones (id, session_id, zone_name, zone_coordinates, capacity) VALUES
('00000000-0000-0000-0000-000000000051', '00000000-0000-0000-0000-000000000031', 'Zone A', '{"x1": 0, "y1": 0, "x2": 50, "y2": 50}', 15),
('00000000-0000-0000-0000-000000000052', '00000000-0000-0000-0000-000000000031', 'Zone B', '{"x1": 50, "y1": 0, "x2": 100, "y2": 50}', 15),
('00000000-0000-0000-0000-000000000053', '00000000-0000-0000-0000-000000000031', 'Zone C', '{"x1": 0, "y1": 50, "x2": 50, "y2": 100}', 15),
('00000000-0000-0000-0000-000000000054', '00000000-0000-0000-0000-000000000031', 'Zone D', '{"x1": 50, "y1": 50, "x2": 100, "y2": 100}', 15)
ON CONFLICT (id) DO UPDATE SET
  zone_name = EXCLUDED.zone_name,
  zone_coordinates = EXCLUDED.zone_coordinates,
  capacity = EXCLUDED.capacity;

-- Insert sample engagement records
INSERT INTO engagement_records (id, session_id, zone_id, attention_score, participation_score, confusion_level, audio_sentiment, noise_level, face_presence_count, hand_raise_count, posture_engagement) VALUES
('00000000-0000-0000-0000-000000000061', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000051', 0.85, 0.75, 0.15, 0.6, 0.3, 12, 2, 0.8),
('00000000-0000-0000-0000-000000000062', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000052', 0.45, 0.35, 0.65, -0.2, 0.7, 8, 0, 0.4),
('00000000-0000-0000-0000-000000000063', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000053', 0.92, 0.88, 0.08, 0.8, 0.2, 14, 4, 0.95),
('00000000-0000-0000-0000-000000000064', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000054', 0.78, 0.65, 0.25, 0.4, 0.4, 11, 1, 0.7)
ON CONFLICT (id) DO UPDATE SET
  attention_score = EXCLUDED.attention_score,
  participation_score = EXCLUDED.participation_score,
  confusion_level = EXCLUDED.confusion_level,
  audio_sentiment = EXCLUDED.audio_sentiment,
  noise_level = EXCLUDED.noise_level,
  face_presence_count = EXCLUDED.face_presence_count,
  hand_raise_count = EXCLUDED.hand_raise_count,
  posture_engagement = EXCLUDED.posture_engagement;

-- Insert sample engagement alerts
INSERT INTO engagement_alerts (id, session_id, zone_id, alert_type, severity, message, threshold_value, current_value) VALUES
('00000000-0000-0000-0000-000000000071', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000052', 'disengagement', 'high', 'Zone B showing low attention and participation levels', 0.6, 0.4),
('00000000-0000-0000-0000-000000000072', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000052', 'confusion_spike', 'medium', 'Confusion levels elevated in Zone B', 0.5, 0.65),
('00000000-0000-0000-0000-000000000073', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000052', 'noise_disruption', 'medium', 'Elevated noise levels detected in Zone B', 0.5, 0.7)
ON CONFLICT (id) DO UPDATE SET
  alert_type = EXCLUDED.alert_type,
  severity = EXCLUDED.severity,
  message = EXCLUDED.message,
  threshold_value = EXCLUDED.threshold_value,
  current_value = EXCLUDED.current_value;

-- Create intervention records table for targeted interventions
CREATE TABLE IF NOT EXISTS intervention_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  zone_id UUID REFERENCES classroom_zones(id),
  intervention_type TEXT NOT NULL CHECK (intervention_type IN ('attention_boost', 'participation_prompt', 'confusion_help', 'gamification')),
  message TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  effectiveness_score DECIMAL(3,2) CHECK (effectiveness_score >= 0 AND effectiveness_score <= 1),
  student_responses JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create gamification records table
CREATE TABLE IF NOT EXISTS gamification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  student_id UUID REFERENCES users(id),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('attention_game', 'quick_poll', 'team_challenge', 'knowledge_race')),
  points_earned INTEGER DEFAULT 0,
  completion_status TEXT DEFAULT 'in_progress' CHECK (completion_status IN ('in_progress', 'completed', 'failed')),
  performance_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create predictive analytics table for AI-driven insights
CREATE TABLE IF NOT EXISTS predictive_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  insight_type TEXT NOT NULL CHECK (insight_type IN ('attention_drop_prediction', 'confusion_forecast', 'optimal_break_time', 'engagement_pattern')),
  prediction_data JSONB NOT NULL,
  confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  recommended_action TEXT,
  is_acted_upon BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create adaptive learning table for personalized interventions
CREATE TABLE IF NOT EXISTS adaptive_learning_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES users(id),
  learning_style TEXT CHECK (learning_style IN ('visual', 'auditory', 'kinesthetic', 'mixed')),
  attention_pattern JSONB, -- Peak attention times, duration patterns
  intervention_preferences JSONB, -- Which interventions work best
  engagement_triggers JSONB, -- What motivates this student
  performance_history JSONB,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create real-time collaboration table for peer learning
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  collaboration_type TEXT NOT NULL CHECK (collaboration_type IN ('peer_tutoring', 'group_discussion', 'collaborative_problem_solving')),
  participants JSONB NOT NULL, -- Array of student IDs
  topic TEXT,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  effectiveness_metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create emotional intelligence tracking table
CREATE TABLE IF NOT EXISTS emotional_intelligence_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  zone_id UUID REFERENCES classroom_zones(id),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  stress_level DECIMAL(3,2) CHECK (stress_level >= 0 AND stress_level <= 1),
  frustration_level DECIMAL(3,2) CHECK (frustration_level >= 0 AND frustration_level <= 1),
  excitement_level DECIMAL(3,2) CHECK (excitement_level >= 0 AND excitement_level <= 1),
  confidence_level DECIMAL(3,2) CHECK (confidence_level >= 0 AND confidence_level <= 1),
  social_engagement DECIMAL(3,2) CHECK (social_engagement >= 0 AND social_engagement <= 1),
  recommended_intervention TEXT
);

-- Enable realtime for new innovative tables
alter publication supabase_realtime add table intervention_records;
alter publication supabase_realtime add table gamification_records;
alter publication supabase_realtime add table predictive_insights;
alter publication supabase_realtime add table adaptive_learning_profiles;
alter publication supabase_realtime add table collaboration_sessions;
alter publication supabase_realtime add table emotional_intelligence_records;

-- Insert sample intervention records
INSERT INTO intervention_records (id, session_id, zone_id, intervention_type, message, effectiveness_score) VALUES
('00000000-0000-0000-0000-000000000081', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000052', 'attention_boost', 'Quick attention check! Can everyone look at the board?', 0.75),
('00000000-0000-0000-0000-000000000082', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000053', 'confusion_help', 'Let\'s clarify this concept with a quick example', 0.85),
('00000000-0000-0000-0000-000000000083', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000051', 'participation_prompt', 'Who can share their thoughts on this topic?', 0.65)
ON CONFLICT (id) DO UPDATE SET
  intervention_type = EXCLUDED.intervention_type,
  message = EXCLUDED.message,
  effectiveness_score = EXCLUDED.effectiveness_score;

-- Insert sample gamification records
INSERT INTO gamification_records (id, session_id, student_id, activity_type, points_earned, completion_status) VALUES
('00000000-0000-0000-0000-000000000091', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000003', 'attention_game', 50, 'completed'),
('00000000-0000-0000-0000-000000000092', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000003', 'quick_poll', 25, 'completed'),
('00000000-0000-0000-0000-000000000093', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000003', 'team_challenge', 75, 'in_progress')
ON CONFLICT (id) DO UPDATE SET
  activity_type = EXCLUDED.activity_type,
  points_earned = EXCLUDED.points_earned,
  completion_status = EXCLUDED.completion_status;

-- Insert sample predictive insights
INSERT INTO predictive_insights (id, session_id, insight_type, prediction_data, confidence_score, recommended_action) VALUES
('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000031', 'attention_drop_prediction', '{"predicted_time": "10:15", "zones_affected": ["Zone B", "Zone C"], "severity": "medium"}', 0.78, 'Schedule interactive activity at 10:10'),
('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000031', 'optimal_break_time', '{"recommended_time": "10:20", "duration": 5, "reason": "cognitive_load_peak"}', 0.85, 'Take 5-minute break for cognitive reset'),
('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000031', 'engagement_pattern', '{"peak_times": ["09:15", "10:45"], "low_times": ["09:45", "11:15"], "pattern": "cyclical"}', 0.92, 'Schedule key concepts during peak engagement times')
ON CONFLICT (id) DO UPDATE SET
  insight_type = EXCLUDED.insight_type,
  prediction_data = EXCLUDED.prediction_data,
  confidence_score = EXCLUDED.confidence_score,
  recommended_action = EXCLUDED.recommended_action;

-- Insert sample adaptive learning profiles
INSERT INTO adaptive_learning_profiles (id, student_id, learning_style, attention_pattern, intervention_preferences) VALUES
('00000000-0000-0000-0000-000000000111', '00000000-0000-0000-0000-000000000003', 'visual', '{"peak_attention": ["09:00-09:30", "10:30-11:00"], "attention_span": 25, "optimal_break_frequency": 20}', '{"preferred_interventions": ["visual_cues", "gamification"], "effective_rewards": ["points", "badges"], "communication_style": "direct"}')
ON CONFLICT (id) DO UPDATE SET
  learning_style = EXCLUDED.learning_style,
  attention_pattern = EXCLUDED.attention_pattern,
  intervention_preferences = EXCLUDED.intervention_preferences;

-- Insert sample emotional intelligence records
INSERT INTO emotional_intelligence_records (id, session_id, zone_id, stress_level, frustration_level, excitement_level, confidence_level, social_engagement, recommended_intervention) VALUES
('00000000-0000-0000-0000-000000000121', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000051', 0.2, 0.1, 0.8, 0.7, 0.9, 'maintain_current_approach'),
('00000000-0000-0000-0000-000000000122', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000052', 0.7, 0.6, 0.2, 0.3, 0.4, 'stress_reduction_break'),
('00000000-0000-0000-0000-000000000123', '00000000-0000-0000-0000-000000000031', '00000000-0000-0000-0000-000000000053', 0.3, 0.4, 0.6, 0.8, 0.7, 'encourage_participation')
ON CONFLICT (id) DO UPDATE SET
  stress_level = EXCLUDED.stress_level,
  frustration_level = EXCLUDED.frustration_level,
  excitement_level = EXCLUDED.excitement_level,
  confidence_level = EXCLUDED.confidence_level,
  social_engagement = EXCLUDED.social_engagement,
  recommended_intervention = EXCLUDED.recommended_intervention;

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
CREATE INDEX IF NOT EXISTS idx_engagement_records_session ON engagement_records(session_id);
CREATE INDEX IF NOT EXISTS idx_engagement_records_timestamp ON engagement_records(timestamp);
CREATE INDEX IF NOT EXISTS idx_engagement_alerts_session ON engagement_alerts(session_id);
CREATE INDEX IF NOT EXISTS idx_engagement_alerts_unresolved ON engagement_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_quiz_responses_session ON quiz_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_classroom_zones_session ON classroom_zones(session_id);
CREATE INDEX IF NOT EXISTS idx_intervention_records_session ON intervention_records(session_id);
CREATE INDEX IF NOT EXISTS idx_intervention_records_zone ON intervention_records(zone_id);
CREATE INDEX IF NOT EXISTS idx_gamification_records_session ON gamification_records(session_id);
CREATE INDEX IF NOT EXISTS idx_gamification_records_student ON gamification_records(student_id);
CREATE INDEX IF NOT EXISTS idx_predictive_insights_session ON predictive_insights(session_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_learning_student ON adaptive_learning_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_sessions_session ON collaboration_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_emotional_intelligence_session ON emotional_intelligence_records(session_id);
CREATE INDEX IF NOT EXISTS idx_emotional_intelligence_timestamp ON emotional_intelligence_records(timestamp);

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
