import { supabase } from "@/lib/supabase";

/**
 * Database service for handling common database operations
 */
export const DatabaseService = {
  /**
   * Initialize the database connection and verify it's working
   */
  async initialize() {
    try {
      // Test the connection by making a simple query
      const { data, error } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true });

      if (error) {
        console.error("Database initialization error:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err: any) {
      console.error("Database initialization error:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get user data by email
   */
  async getUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

      if (error) {
        throw error;
      }

      return { success: true, user: data };
    } catch (err: any) {
      console.error("Error fetching user by email:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Record attendance for a student
   */
  async recordAttendance(params: {
    classId: string;
    studentId: string;
    status: "present" | "absent" | "late";
    locationLat?: number;
    locationLng?: number;
  }) {
    try {
      const { data, error } = await supabase.from("attendance").insert({
        class_id: params.classId,
        user_id: params.studentId,
        status: params.status,
        location_lat: params.locationLat,
        location_lng: params.locationLng,
        timestamp: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err: any) {
      console.error("Error recording attendance:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get attendance records for a class
   */
  async getClassAttendance(classId: string) {
    try {
      const { data, error } = await supabase
        .from("attendance")
        .select(
          `
          id,
          status,
          timestamp,
          location_lat,
          location_lng,
          users:user_id (id, first_name, last_name, email)
        `,
        )
        .eq("class_id", classId)
        .order("timestamp", { ascending: false });

      if (error) {
        throw error;
      }

      return { success: true, data };
    } catch (err: any) {
      console.error("Error fetching class attendance:", err);
      return { success: false, error: err.message };
    }
  },
};
