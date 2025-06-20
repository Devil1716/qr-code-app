-- Add Sharan user to the users table
INSERT INTO users (id, name, email, role, department, student_id)
VALUES (
  gen_random_uuid(), -- Generate a random UUID for the user
  'Sharan',
  'Sharan@s.amity.edu',
  'student',
  'Computer Science',
  'S67890'
);
