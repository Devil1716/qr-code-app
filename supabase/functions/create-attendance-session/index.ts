import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { class_id, date } = await req.json();

    if (!class_id) {
      throw new Error("class_id is required");
    }

    // Use the provided date or default to today
    const sessionDate = date ? new Date(date) : new Date();
    const formattedDate = sessionDate.toISOString().split("T")[0];

    // Create a Supabase client with the project URL and service key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if a session already exists for this class and date
    const { data: existingSession, error: checkError } = await supabase
      .from("attendance_sessions")
      .select("id")
      .eq("class_id", class_id)
      .eq("date", formattedDate)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is the error code for no rows returned
      throw checkError;
    }

    if (existingSession) {
      return new Response(
        JSON.stringify({
          id: existingSession.id,
          message: "Session already exists",
          exists: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    // Create a new attendance session
    const { data, error } = await supabase
      .from("attendance_sessions")
      .insert({
        class_id,
        date: formattedDate,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(
      JSON.stringify({
        id: data.id,
        message: "Attendance session created successfully",
        exists: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 201,
      },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
