import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced Supabase client with security features
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "X-Client-Info": "attendance-system",
    },
  },
});

// Security utilities
export const securityUtils = {
  // Log security events
  logSecurityEvent: async (event: string, details: any) => {
    try {
      await supabase.from("security_logs").insert({
        event_type: event,
        details: JSON.stringify(details),
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        ip_address: await getClientIP(),
      });
    } catch (error) {
      console.warn("Failed to log security event:", error);
    }
  },

  // Validate session integrity
  validateSession: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, role, last_login")
        .eq("id", userId)
        .single();

      if (error || !data) {
        throw new Error("Invalid session");
      }

      return data;
    } catch (error) {
      throw new Error("Session validation failed");
    }
  },
};

// Get client IP (best effort)
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch("https://api.ipify.org?format=json");
    const data = await response.json();
    return data.ip || "unknown";
  } catch {
    return "unknown";
  }
}
