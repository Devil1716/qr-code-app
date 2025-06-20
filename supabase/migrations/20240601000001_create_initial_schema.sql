-- Create tables if they don't exist
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

CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  teacher_id UUID NOT NULL REFERENCES users(id),
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  room TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id),
  student_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (class_id, student_id)
);

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES classes(id),
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (class_id, date)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES attendance_sessions(id),
  class_id UUID REFERENCES classes(id),
  student_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'proxy')),
  is_manual BOOLEAN DEFAULT false,
  marked_by UUID REFERENCES users(id),
  location_lat DECIMAL,
  location_lng DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable realtime for all tables
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table classes;
alter publication supabase_realtime add table class_enrollments;
alter publication supabase_realtime add table attendance_sessions;
alter publication supabase_realtime add table attendance_records;