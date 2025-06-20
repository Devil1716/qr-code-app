export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "teacher" | "student";
  studentId?: string;
  teacherId?: string;
}

// Authorized users only - production configuration
export const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "SSharan.s@outlook.com",
    name: "Admin Sharan",
    role: "admin",
  },
  {
    id: "2",
    email: "sharan071718@gmail.com",
    name: "Teacher Sharan",
    role: "teacher",
    teacherId: "T123456",
  },
  {
    id: "3",
    email: "sharan@s.amity.edu",
    name: "Student Sharan",
    role: "student",
    studentId: "S67890",
  },
];

// Security configuration
export const SECURITY_CONFIG = {
  ALLOWED_PASSWORDS: ["Sharan17#"],
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
  MAX_LOGIN_ATTEMPTS: 3,
  PROXY_DETECTION_ENABLED: true,
};

// Proxy detection patterns
export const PROXY_INDICATORS = [
  "proxy",
  "vpn",
  "tor",
  "anonymous",
  "hide",
  "mask",
  "tunnel",
  "shield",
];
