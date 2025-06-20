import { supabase } from "../supabase";
import { Database } from "@/types/supabase";

// User types
type User = Database["public"]["Tables"]["users"]["Row"];
type Class = Database["public"]["Tables"]["classes"]["Row"];
type Enrollment = Database["public"]["Tables"]["class_enrollments"]["Row"];
type AttendanceRecord =
  Database["public"]["Tables"]["attendance_records"]["Row"];
type AttendanceSession =
  Database["public"]["Tables"]["attendance_sessions"]["Row"];

// User functions
export async function getUsers() {
  const { data, error } = await supabase.from("users").select("*");
  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return data || [];
}

export async function getUserById(id: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error(`Error fetching user ${id}:`, error);
    return null;
  }
  return data;
}

export async function getUserByEmail(email: string) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();
  if (error) {
    console.error(`Error fetching user with email ${email}:`, error);
    return null;
  }
  return data;
}

// Class functions
export async function getClasses() {
  const { data, error } = await supabase.from("classes").select("*");
  if (error) {
    console.error("Error fetching classes:", error);
    return [];
  }
  return data || [];
}

export async function getClassById(id: string) {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("id", id)
    .single();
  if (error) {
    console.error(`Error fetching class ${id}:`, error);
    return null;
  }
  return data;
}

export async function getClassesByTeacherId(teacherId: string) {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacherId);
  if (error) {
    console.error(`Error fetching classes for teacher ${teacherId}:`, error);
    return [];
  }
  return data || [];
}

// Enrollment functions
export async function getEnrollments() {
  const { data, error } = await supabase.from("class_enrollments").select("*");
  if (error) {
    console.error("Error fetching enrollments:", error);
    return [];
  }
  return data || [];
}

export async function getEnrollmentsByClassId(classId: string) {
  const { data, error } = await supabase
    .from("class_enrollments")
    .select("*, users!class_enrollments_student_id_fkey(*)")
    .eq("class_id", classId);
  if (error) {
    console.error(`Error fetching enrollments for class ${classId}:`, error);
    return [];
  }
  return data || [];
}

export async function getEnrollmentsByStudentId(studentId: string) {
  const { data, error } = await supabase
    .from("class_enrollments")
    .select("*, classes(*)")
    .eq("student_id", studentId);
  if (error) {
    console.error(
      `Error fetching enrollments for student ${studentId}:`,
      error,
    );
    return [];
  }
  return data || [];
}

// Attendance functions
export async function getAttendanceSessions() {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*");
  if (error) {
    console.error("Error fetching attendance sessions:", error);
    return [];
  }
  return data || [];
}

export async function getAttendanceSessionsByClassId(classId: string) {
  const { data, error } = await supabase
    .from("attendance_sessions")
    .select("*")
    .eq("class_id", classId);
  if (error) {
    console.error(
      `Error fetching attendance sessions for class ${classId}:`,
      error,
    );
    return [];
  }
  return data || [];
}

export async function getAttendanceRecords() {
  const { data, error } = await supabase.from("attendance_records").select("*");
  if (error) {
    console.error("Error fetching attendance records:", error);
    return [];
  }
  return data || [];
}

export async function getAttendanceRecordsBySessionId(sessionId: string) {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*, users!attendance_records_student_id_fkey(*)")
    .eq("session_id", sessionId);
  if (error) {
    console.error(
      `Error fetching attendance records for session ${sessionId}:`,
      error,
    );
    return [];
  }
  return data || [];
}

export async function getAttendanceRecordsByStudentId(studentId: string) {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*, classes(*), attendance_sessions(*)")
    .eq("student_id", studentId);
  if (error) {
    console.error(
      `Error fetching attendance records for student ${studentId}:`,
      error,
    );
    return [];
  }
  return data || [];
}

export async function getAttendanceRecordsByClassId(classId: string) {
  const { data, error } = await supabase
    .from("attendance_records")
    .select("*, users!attendance_records_student_id_fkey(*)")
    .eq("class_id", classId);
  if (error) {
    console.error(
      `Error fetching attendance records for class ${classId}:`,
      error,
    );
    return [];
  }
  return data || [];
}

// Function to get classes taught by a teacher
export async function getTeacherClasses(teacherId: string) {
  const { data, error } = await supabase
    .from("classes")
    .select("*")
    .eq("teacher_id", teacherId);
  if (error) {
    console.error(`Error fetching classes for teacher ${teacherId}:`, error);
    return [];
  }
  return data || [];
}

// Function to get enrollments for a specific class with student details
export async function getClassEnrollments(classId: string) {
  const { data, error } = await supabase
    .from("class_enrollments")
    .select("*, users!class_enrollments_student_id_fkey(*)")
    .eq("class_id", classId);
  if (error) {
    console.error(`Error fetching enrollments for class ${classId}:`, error);
    return [];
  }
  return data || [];
}

// Function to get available courses for student registration
export async function getAvailableCourses() {
  try {
    // Get all classes with their teacher information
    const { data: courses, error: coursesError } = await supabase
      .from("classes")
      .select("*, users!classes_teacher_id_fkey(name, image_url)")
      .order("title");

    if (coursesError) throw coursesError;

    // Get enrollment counts for each class
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from("class_enrollments")
      .select("class_id");

    if (enrollmentsError) throw enrollmentsError;

    // Count enrollments per class
    const enrollmentCounts = enrollments.reduce(
      (counts: Record<string, number>, enrollment) => {
        const classId = enrollment.class_id;
        counts[classId] = (counts[classId] || 0) + 1;
        return counts;
      },
      {},
    );

    // Combine the data
    const coursesWithEnrollment = courses.map((course) => ({
      ...course,
      enrolled: enrollmentCounts[course.id] || 0,
      teacher: course.users,
    }));

    return coursesWithEnrollment;
  } catch (error) {
    console.error("Error fetching available courses:", error);
    return [];
  }
}

// Function to register a student for a course
export async function registerForCourse(studentId: string, courseId: string) {
  try {
    // Check if already enrolled
    const { data: existingEnrollment, error: checkError } = await supabase
      .from("class_enrollments")
      .select("*")
      .eq("student_id", studentId)
      .eq("class_id", courseId)
      .maybeSingle();

    if (checkError && checkError.code !== "PGRST116") {
      throw checkError;
    }

    if (existingEnrollment) {
      throw new Error("You are already enrolled in this course");
    }

    // Check class capacity
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("capacity")
      .eq("id", courseId)
      .single();

    if (classError) throw classError;

    // Get current enrollment count
    const { count: currentEnrollment, error: countError } = await supabase
      .from("class_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("class_id", courseId);

    if (countError) throw countError;

    const capacity = classData.capacity || 60;
    if (currentEnrollment && currentEnrollment >= capacity) {
      throw new Error("This course is at full capacity");
    }

    // Create the enrollment
    const { error: enrollError } = await supabase
      .from("class_enrollments")
      .insert([
        {
          student_id: studentId,
          class_id: courseId,
        },
      ]);

    if (enrollError) throw enrollError;

    return { success: true };
  } catch (error: any) {
    console.error("Error registering for course:", error);
    throw error;
  }
}

// Function to get courses a student is enrolled in
export async function getStudentEnrolledCourses(studentId: string) {
  try {
    const { data, error } = await supabase
      .from("class_enrollments")
      .select(
        "*, classes(*, users!classes_teacher_id_fkey(id, name, email, image_url))",
      )
      .eq("student_id", studentId);

    if (error) throw error;

    // Transform the data to make it easier to work with
    const enrolledCourses = data.map((enrollment) => ({
      ...enrollment.classes,
      teacher: enrollment.classes?.users,
    }));

    return enrolledCourses;
  } catch (error) {
    console.error(
      `Error fetching enrolled courses for student ${studentId}:`,
      error,
    );
    return [];
  }
}

// Insert test data if needed
export async function insertTestData() {
  // Check if data already exists
  const { count } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true });

  if (count && count > 0) {
    console.log("Data already exists, skipping test data insertion");
    return;
  }

  // Insert users
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
    console.error("Error inserting test users:", usersError);
    return;
  }

  // Insert classes
  const { error: classesError } = await supabase.from("classes").insert([
    {
      id: "00000000-0000-0000-0000-000000000011",
      title: "Introduction to Computer Science",
      teacher_id: "00000000-0000-0000-0000-000000000002",
      start_time: "09:00",
      end_time: "10:30",
      room: "Room 101",
    },
    {
      id: "00000000-0000-0000-0000-000000000012",
      title: "Data Structures",
      teacher_id: "00000000-0000-0000-0000-000000000002",
      start_time: "11:00",
      end_time: "12:30",
      room: "Room 102",
    },
    {
      id: "00000000-0000-0000-0000-000000000013",
      title: "Advanced Web Development",
      teacher_id: "00000000-0000-0000-0000-000000000002",
      start_time: "14:00",
      end_time: "15:30",
      room: "Room 103",
    },
  ]);

  if (classesError) {
    console.error("Error inserting test classes:", classesError);
    return;
  }

  // Insert enrollments
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
    console.error("Error inserting test enrollments:", enrollmentsError);
  }

  console.log("Test data inserted successfully");
}

// Function to update class capacity
export async function updateClassCapacity(classId: string, capacity: number) {
  const { data, error } = await supabase
    .from("classes")
    .update({ capacity })
    .eq("id", classId)
    .select();

  if (error) {
    console.error(`Error updating capacity for class ${classId}:`, error);
    throw error;
  }

  return data;
}
