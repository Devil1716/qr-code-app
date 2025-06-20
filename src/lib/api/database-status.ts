import { supabase } from "@/lib/supabase";

/**
 * Check if the Supabase connection is working
 * @returns Promise with connection status
 */
export async function checkDatabaseConnection() {
  try {
    // Test the connection by making a simple query
    const { data, error } = await supabase
      .from("users")
      .select("count", { count: "exact", head: true });

    if (error) {
      console.error("Database connection error:", error);
      return { connected: false, error: error.message };
    }

    return { connected: true };
  } catch (err: any) {
    console.error("Database connection error:", err);
    return { connected: false, error: err.message || "Unknown error" };
  }
}

/**
 * Get database tables and their row counts
 * @returns Promise with table statistics
 */
export async function getDatabaseStats() {
  try {
    // Get list of tables
    const tables = ["users", "classes", "attendance", "enrollments"];
    const stats = [];

    // Get row count for each table
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: true });

        stats.push({
          table,
          count: count || 0,
          error: error ? error.message : null,
        });
      } catch (tableErr) {
        stats.push({
          table,
          count: 0,
          error: "Failed to query table",
        });
      }
    }

    return { success: true, stats };
  } catch (err: any) {
    console.error("Error getting database stats:", err);
    return { success: false, error: err.message };
  }
}
