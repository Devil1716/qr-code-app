import { supabase } from "../supabase";
import { Database } from "@/types/supabase";

type Tables = Database["public"]["Tables"];

export class SupabaseClient {
  // Users
  static async getUsers() {
    return supabase.from("users").select("*");
  }

  static async createUser(user: Partial<Tables["users"]["Insert"]>) {
    return supabase.from("users").insert([user]);
  }

  static async updateUser(
    id: string,
    updates: Partial<Tables["users"]["Update"]>,
  ) {
    return supabase.from("users").update(updates).eq("id", id);
  }

  static async deleteUser(id: string) {
    return supabase.from("users").delete().eq("id", id);
  }

  // Classes
  static async getClasses() {
    return supabase
      .from("classes")
      .select("*, users!classes_teacher_id_fkey(name)");
  }

  static async createClass(classData: Partial<Tables["classes"]["Insert"]>) {
    return supabase.from("classes").insert([classData]);
  }

  static async updateClass(
    id: string,
    updates: Partial<Tables["classes"]["Update"]>,
  ) {
    return supabase.from("classes").update(updates).eq("id", id);
  }

  static async deleteClass(id: string) {
    return supabase.from("classes").delete().eq("id", id);
  }

  // Enrollments
  static async getEnrollments() {
    return supabase.from("class_enrollments").select(`
      *,
      classes(title),
      users!class_enrollments_student_id_fkey(name)
    `);
  }

  static async createEnrollment(
    enrollment: Partial<Tables["class_enrollments"]["Insert"]>,
  ) {
    return supabase.from("class_enrollments").insert([enrollment]);
  }

  static async deleteEnrollment(id: string) {
    return supabase.from("class_enrollments").delete().eq("id", id);
  }

  // Attendance
  static async getAttendanceRecords() {
    return supabase.from("attendance_records").select(`
      *,
      classes(title),
      users!attendance_records_student_id_fkey(name)
    `);
  }

  static async createAttendanceRecord(
    record: Partial<Tables["attendance_records"]["Insert"]>,
  ) {
    return supabase.from("attendance_records").insert([record]);
  }

  static async updateAttendanceRecord(
    id: string,
    updates: Partial<Tables["attendance_records"]["Update"]>,
  ) {
    return supabase.from("attendance_records").update(updates).eq("id", id);
  }

  // Realtime subscriptions
  static subscribeToAttendance(callback: (payload: any) => void) {
    return supabase
      .channel("attendance_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "attendance_records" },
        callback,
      )
      .subscribe();
  }

  static subscribeToClasses(callback: (payload: any) => void) {
    return supabase
      .channel("class_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "classes" },
        callback,
      )
      .subscribe();
  }
}
