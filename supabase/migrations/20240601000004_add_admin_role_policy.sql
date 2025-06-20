-- Add policies to allow admin to manage all data
-- Users table policies
DROP POLICY IF EXISTS "Admins can do anything" ON users;
CREATE POLICY "Admins can do anything"
  ON users
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Classes table policies
DROP POLICY IF EXISTS "Admins can do anything" ON classes;
CREATE POLICY "Admins can do anything"
  ON classes
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Class enrollments table policies
DROP POLICY IF EXISTS "Admins can do anything" ON class_enrollments;
CREATE POLICY "Admins can do anything"
  ON class_enrollments
  USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'))
  WITH CHECK (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Attendance sessions table policies
DROP POLICY IF EXISTS "Admins can do anything" ON attendance_sessions;
CREATE POLICY "Admins can do anything"
  ON attendance_sessions