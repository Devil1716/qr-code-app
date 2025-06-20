import { supabase } from "../supabase";

/**
 * Create a new attendance session for a class
 */
export async function createAttendanceSession(classId: string, date?: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-create-attendance-session",
      {
        body: { class_id: classId, date },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating attendance session:", error);
    throw error;
  }
}

/**
 * Record attendance for a student
 */
export async function recordAttendance({
  sessionId,
  classId,
  studentId,
  status,
  locationLat,
  locationLng,
  isManual = false,
  markedBy,
}: {
  sessionId?: string;
  classId?: string;
  studentId: string;
  status: "present" | "absent" | "proxy";
  locationLat?: number;
  locationLng?: number;
  isManual?: boolean;
  markedBy?: string;
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-record-attendance",
      {
        body: {
          session_id: sessionId,
          class_id: classId,
          student_id: studentId,
          status,
          location_lat: locationLat,
          location_lng: locationLng,
          is_manual: isManual,
          marked_by: markedBy,
        },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error recording attendance:", error);
    throw error;
  }
}

/**
 * Get students enrolled in a class
 */
export async function getClassStudents(classId: string) {
  try {
    const { data, error } = await supabase
      .from("class_enrollments")
      .select("*, users!class_enrollments_student_id_fkey(*)")
      .eq("class_id", classId);

    if (error) throw error;
    return data.map((enrollment) => enrollment.users);
  } catch (error) {
    console.error("Error getting class students:", error);
    return [];
  }
}

/**
 * Get attendance records for a session
 */
export async function getSessionAttendance(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*, users!attendance_records_student_id_fkey(*)")
      .eq("session_id", sessionId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting session attendance:", error);
    return [];
  }
}

/**
 * Get attendance sessions for a class
 */
export async function getClassSessions(classId: string) {
  try {
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("class_id", classId)
      .order("date", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting class sessions:", error);
    return [];
  }
}
