-- Create view for attendance percentage
CREATE OR REPLACE VIEW attendance_percentage AS
SELECT 
  e.student_id,
  e.class_id,
  c.title as class_title,
  u.name as student_name,
  COUNT(DISTINCT s.id) as total_sessions,
  COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN s.id END) as attended_sessions,
  CASE 
    WHEN COUNT(DISTINCT s.id) = 0 THEN 0
    ELSE ROUND((COUNT(DISTINCT CASE WHEN ar.status = 'present' THEN s.id END)::numeric / COUNT(DISTINCT s.id)::numeric) * 100, 2)
  END as attendance_percentage
FROM 
  class_enrollments e
JOIN 
  classes c ON e.class_id = c.id
JOIN 
  users u ON e.student_id = u.id
LEFT JOIN 
  attendance_sessions s ON s.class_id = e.class_id
LEFT JOIN 
  attendance_records ar ON ar.session_id = s.id AND ar.student_id = e.student_id
GROUP BY 
  e.student_id, e.class_id, c.title, u.name;