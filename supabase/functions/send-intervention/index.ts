import { corsHeaders } from "@shared/cors.ts";

interface InterventionRequest {
  session_id: string;
  zone_id: string;
  intervention_type:
    | "attention_boost"
    | "participation_prompt"
    | "confusion_help"
    | "gamification";
  message: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const interventionData: InterventionRequest = await req.json();

    // Validate required fields
    if (
      !interventionData.session_id ||
      !interventionData.zone_id ||
      !interventionData.intervention_type ||
      !interventionData.message
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: session_id, zone_id, intervention_type, message",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;

    // Store intervention record
    const interventionRecord = {
      session_id: interventionData.session_id,
      zone_id: interventionData.zone_id,
      intervention_type: interventionData.intervention_type,
      message: interventionData.message,
      sent_at: new Date().toISOString(),
    };

    const storeResponse = await fetch(
      `${supabaseUrl}/rest/v1/intervention_records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          apikey: supabaseKey,
        },
        body: JSON.stringify(interventionRecord),
      },
    );

    if (!storeResponse.ok) {
      throw new Error(
        `Failed to store intervention record: ${storeResponse.statusText}`,
      );
    }

    const storedIntervention = await storeResponse.json();

    // Simulate sending intervention to students in the zone
    // In a real implementation, this would:
    // 1. Get students in the specified zone
    // 2. Send push notifications or display messages on their devices
    // 3. Track delivery and response rates

    const deliveryResult = await simulateInterventionDelivery(
      interventionData.zone_id,
      interventionData.intervention_type,
      interventionData.message,
    );

    // Calculate initial effectiveness score based on intervention type and message content
    const effectivenessScore = calculateInitialEffectiveness(
      interventionData.intervention_type,
      interventionData.message,
    );

    // Update the intervention record with effectiveness score
    await fetch(
      `${supabaseUrl}/rest/v1/intervention_records?id=eq.${storedIntervention[0].id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          apikey: supabaseKey,
        },
        body: JSON.stringify({
          effectiveness_score: effectivenessScore,
          student_responses: deliveryResult.responses,
        }),
      },
    );

    return new Response(
      JSON.stringify({
        success: true,
        intervention_id: storedIntervention[0].id,
        delivery_status: deliveryResult.status,
        students_reached: deliveryResult.studentsReached,
        estimated_effectiveness: effectivenessScore,
        message: "Intervention sent successfully",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error sending intervention:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function simulateInterventionDelivery(
  zoneId: string,
  interventionType: string,
  message: string,
) {
  // Simulate delivery to students in the zone
  const studentsInZone = Math.floor(Math.random() * 15) + 5; // 5-20 students
  const deliverySuccess = Math.random() > 0.1; // 90% delivery success rate

  const responses = {
    delivered: studentsInZone,
    acknowledged: Math.floor(studentsInZone * (0.7 + Math.random() * 0.2)), // 70-90% acknowledgment
    positive_response: Math.floor(studentsInZone * (0.5 + Math.random() * 0.3)), // 50-80% positive response
  };

  return {
    status: deliverySuccess ? "delivered" : "partial_delivery",
    studentsReached: studentsInZone,
    responses,
  };
}

function calculateInitialEffectiveness(
  interventionType: string,
  message: string,
): number {
  let baseScore = 0.6; // Base effectiveness

  // Adjust based on intervention type
  switch (interventionType) {
    case "attention_boost":
      baseScore += 0.1;
      break;
    case "participation_prompt":
      baseScore += 0.15;
      break;
    case "confusion_help":
      baseScore += 0.2;
      break;
    case "gamification":
      baseScore += 0.25;
      break;
  }

  // Adjust based on message characteristics
  if (message.includes("?")) baseScore += 0.05; // Questions are more engaging
  if (message.length > 50 && message.length < 150) baseScore += 0.05; // Optimal length
  if (
    message.toLowerCase().includes("quick") ||
    message.toLowerCase().includes("fun")
  ) {
    baseScore += 0.05; // Positive language
  }

  return Math.min(1, baseScore + (Math.random() * 0.1 - 0.05)); // Add small random variation
}
