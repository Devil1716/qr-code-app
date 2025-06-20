import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Create a Supabase client with the service role key for admin operations
// This should only be used in secure contexts (like edge functions)
const supabaseAdmin = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.SUPABASE_SERVICE_KEY || "",
  {
    auth: {
      persistSession: false,
    },
  },
);

export { supabaseAdmin };
