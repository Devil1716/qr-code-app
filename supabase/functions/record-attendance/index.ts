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
    const {
      session_id,
      class_id,
      student_id,
      status,
      location_lat,
      location_lng,
      is_manual,
      marked_by,
    } = await req.json();

    if (!student_id) {
      throw new Error("student_id is required");
    }

    if (!status) {
      throw new Error("status is required");
    }

    if (!session_id && !class_id) {
      throw new Error("Either session_id or class_id is required");
    }

    // Create a Supabase client with the project URL and service key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If session_id is not provided but class_id is, try to find the most recent session
    let finalSessionId = session_id;
    if (!finalSessionId && class_id) {
      const { data: sessionData, error: sessionError } = await supabase
        .from("attendance_sessions")
        .select("id")
        .eq("class_id", class_id)
        .order("date", { ascending: false })
        .limit(1)
        .single();

      if (sessionError) {
        throw new Error(
          `No active session found for class: ${sessionError.message}`,
        );
      }

      finalSessionId = sessionData.id;
    }

    // Check if attendance record already exists for this student and session
    const { data: existingRecord, error: checkError } = await supabase
      .from("attendance_records")
      .select("id, status")
      .eq("session_id", finalSessionId)
      .eq("student_id", student_id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is the error code for no rows returned
      throw checkError;
    }

    let result;
    if (existingRecord) {
      // Update existing record
      const { data, error } = await supabase
        .from("attendance_records")
        .update({
          status,
          is_manual: is_manual || false,
          marked_by: marked_by || null,
          location_lat: location_lat || null,
          location_lng: location_lng || null,
        })
        .eq("id", existingRecord.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      result = {
        id: data.id,
        message: "Attendance record updated successfully",
        previous_status: existingRecord.status,
        updated: true,
      };
    } else {
      // Create new record
      const { data, error } = await supabase
        .from("attendance_records")
        .insert({
          session_id: finalSessionId,
          class_id,
          student_id,
          status,
          is_manual: is_manual || false,
          marked_by: marked_by || null,
          location_lat: location_lat || null,
          location_lng: location_lng || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      result = {
        id: data.id,
        message: "Attendance record created successfully",
        updated: false,
      };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
