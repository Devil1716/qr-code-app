-- Create comprehensive timetable system - Part 1: Tables and Functions

-- First, update users table to support case-insensitive emails and new user accounts
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

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
