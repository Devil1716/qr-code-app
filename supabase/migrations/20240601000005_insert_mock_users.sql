-- Insert mock users from auth.ts into the users table
INSERT INTO users (id, email, name, role, student_id, teacher_id)
VALUES 
  ('1', 'admin@example.com', 'Admin User', 'admin', NULL, NULL),
  ('2', 'teacher@example.com', 'Dr. Sarah Johnson', 'teacher', NULL, 'T123456'),
  ('3', 'student@example.com', 'John Smith', 'student', 'S12345', NULL)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  student_id = EXCLUDED.student_id,
  teacher_id = EXCLUDED.teacher_id;

-- Make sure the auth.users table has corresponding entries
INSERT INTO auth.users (id, email, email_confirmed_at)
VALUES 
  ('1', 'admin@example.com', now()),
  ('2', 'teacher@example.com', now()),
  ('3', 'student@example.com', now())
ON CONFLICT (id) DO NOTHING;
