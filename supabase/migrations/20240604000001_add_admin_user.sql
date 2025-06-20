-- Insert or update the admin user
INSERT INTO users (name, email, role, department)
VALUES ('Admin Sharan', 'SSharan.s@outlook.com', 'admin', 'Administration')
ON CONFLICT (email) 
DO UPDATE SET 
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    department = EXCLUDED.department;
