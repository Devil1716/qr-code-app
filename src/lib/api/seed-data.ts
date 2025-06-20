import { supabase } from "../supabase";

/**
 * Utility function to check if the database has been seeded
 * This prevents duplicate data when the app is reloaded
 */
export async function checkIfDatabaseSeeded() {
  try {
    // Check if we have any users
    const { count, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    if (usersError) {
      console.error("Error checking users:", usersError);
      return false;
    }

    // If we have users, the database has been seeded
    return count > 0;
  } catch (error) {
    console.error("Error checking if database is seeded:", error);
    return false;
  }
}

/**
 * Function to seed the database with initial data
 */
export async function seedDatabase() {
  try {
    // Force check if database is already seeded with a direct query
    const { data: existingUsers, error } = await supabase
      .from("users")
      .select("id");

    if (error) throw error;

    if (existingUsers && existingUsers.length > 0) {
      console.log("Database already seeded");
      return true;
    }

    console.log("Seeding database...");

    // Insert users with fixed IDs to ensure consistency
    const { error: usersError } = await supabase.from("users").insert([
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "Admin User",
        email: "admin@example.com",
        role: "admin",
        department: "Administration",
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        name: "Dr. Sarah Johnson",
        email: "teacher@example.com",
        role: "teacher",
        department: "Computer Science",
        teacher_id: "T123456",
      },
      {
        id: "00000000-0000-0000-0000-000000000003",
        name: "John Smith",
        email: "student@example.com",
        role: "student",
        department: "Computer Science",
        student_id: "S12345",
      },
    ]);

    if (usersError) {
      console.error("Error inserting users:", usersError);
      return false;
    }

    // Insert classes with fixed teacher ID
    const { error: classesError } = await supabase.from("classes").insert([
      {
        id: "00000000-0000-0000-0000-000000000011",
        title: "Introduction to Computer Science",
        teacher_id: "00000000-0000-0000-0000-000000000002", // Fixed teacher ID
        start_time: "09:00",
        end_time: "10:30",
        room: "Room 101",
      },
      {
        id: "00000000-0000-0000-0000-000000000012",
        title: "Data Structures",
        teacher_id: "00000000-0000-0000-0000-000000000002", // Fixed teacher ID
        start_time: "11:00",
        end_time: "12:30",
        room: "Room 102",
      },
      {
        id: "00000000-0000-0000-0000-000000000013",
        title: "Advanced Web Development",
        teacher_id: "00000000-0000-0000-0000-000000000002", // Fixed teacher ID
        start_time: "14:00",
        end_time: "15:30",
        room: "Room 103",
      },
    ]);

    if (classesError) {
      console.error("Error inserting classes:", classesError);
      return false;
    }

    // Insert enrollments with fixed IDs
    const { error: enrollmentsError } = await supabase
      .from("class_enrollments")
      .insert([
        {
          class_id: "00000000-0000-0000-0000-000000000011",
          student_id: "00000000-0000-0000-0000-000000000003",
        },
        {
          class_id: "00000000-0000-0000-0000-000000000012",
          student_id: "00000000-0000-0000-0000-000000000003",
        },
        {
          class_id: "00000000-0000-0000-0000-000000000013",
          student_id: "00000000-0000-0000-0000-000000000003",
        },
      ]);

    if (enrollmentsError) {
      console.error("Error inserting enrollments:", enrollmentsError);
      return false;
    }

    console.log("Database seeded successfully");
    return true;
  } catch (error) {
    console.error("Error seeding database:", error);
    return false;
  }
}

/**
 * Function to get current user based on email
 * This is a mock function since we don't have real authentication
 */
export async function getCurrentUser(email: string) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      console.error("Error getting current user:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Function to get classes for a teacher
 */
export async function getTeacherClasses(teacherId: string) {
  try {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", teacherId);

    if (error) {
      console.error("Error getting teacher classes:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error getting teacher classes:", error);
    return [];
  }
}

/**
 * Function to get classes for a student
 */
export async function getStudentClasses(studentId: string) {
  try {
    const { data, error } = await supabase
      .from("class_enrollments")
      .select("*, classes(*)")
      .eq("student_id", studentId);

    if (error) {
      console.error("Error getting student classes:", error);
      return [];
    }

    return data?.map((enrollment) => enrollment.classes) || [];
  } catch (error) {
    console.error("Error getting student classes:", error);
    return [];
  }
}

/**
 * Function to get attendance records for a class
 */
export async function getClassAttendance(classId: string) {
  try {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*, users!attendance_records_student_id_fkey(name)")
      .eq("class_id", classId);

    if (error) {
      console.error("Error getting class attendance:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error getting class attendance:", error);
    return [];
  }
}

/**
 * Function to get attendance percentage for a student
 */
export async function getStudentAttendancePercentage(studentId: string) {
  try {
    const { data, error } = await supabase
      .from("attendance_percentage")
      .select("*")
      .eq("student_id", studentId);

    if (error) {
      console.error("Error getting student attendance percentage:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error getting student attendance percentage:", error);
    return [];
  }
}
