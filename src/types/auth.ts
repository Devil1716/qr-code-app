export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "teacher" | "student";
  studentId?: string;
  teacherId?: string;
}

// Mock data - in a real app this would come from your backend
export const MOCK_USERS: User[] = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
  },
  {
    id: "2",
    email: "teacher@example.com",
    name: "Dr. Sarah Johnson",
    role: "teacher",
    teacherId: "T123456",
  },
  {
    id: "3",
    email: "student@example.com",
    name: "John Smith",
    role: "student",
    studentId: "S12345",
  },
];
