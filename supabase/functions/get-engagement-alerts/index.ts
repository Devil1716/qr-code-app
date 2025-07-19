import { corsHeaders } from "@shared/cors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const sessionId = url.searchParams.get("session_id");
    const includeResolved = url.searchParams.get("include_resolved") === "true";
    const severity = url.searchParams.get("severity");

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;

    // Build query parameters
    let query = `session_id=eq.${sessionId}`;
    if (!includeResolved) {
      query += "&is_resolved=eq.false";
    }
    if (severity) {
      query += `&severity=eq.${severity}`;
    }

    // Get current alerts
    const alertsResponse = await fetch(
      `${supabaseUrl}/rest/v1/engagement_alerts?${query}&order=created_at.desc`,
      {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
        },
      },
    );

    if (!alertsResponse.ok) {
      throw new Error(`Failed to fetch alerts: ${alertsResponse.statusText}`);
    }

    const alerts = await alertsResponse.json();

    // Get latest engagement data for each zone
    const engagementResponse = await fetch(
      `${supabaseUrl}/rest/v1/engagement_records?session_id=eq.${sessionId}&order=timestamp.desc&limit=20`,
      {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
        },
      },
    );

    if (!engagementResponse.ok) {
      throw new Error(
        `Failed to fetch engagement data: ${engagementResponse.statusText}`,
      );
    }

    const engagementData = await engagementResponse.json();

    // Get zone information
    const zonesResponse = await fetch(
      `${supabaseUrl}/rest/v1/classroom_zones?session_id=eq.${sessionId}`,
      {
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          apikey: supabaseKey,
        },
      },
    );

    const zones = zonesResponse.ok ? await zonesResponse.json() : [];

    // Calculate zone statistics
    const zoneStats = zones.map((zone: any) => {
      const zoneEngagement = engagementData.filter(
        (record: any) => record.zone_id === zone.id,
      );
      const latestRecord = zoneEngagement[0];

      if (!latestRecord) {
        return {
          zone_id: zone.id,
          zone_name: zone.zone_name,
          status: "no_data",
          attention_score: 0,
          participation_score: 0,
          confusion_level: 0,
          student_count: 0,
          last_updated: null,
        };
      }

      // Determine zone status based on latest metrics
      let status = "good";
      if (
        latestRecord.attention_score < 0.4 ||
        latestRecord.participation_score < 0.3
      ) {
        status = "critical";
      } else if (
        latestRecord.attention_score < 0.6 ||
        latestRecord.confusion_level > 0.5
      ) {
        status = "warning";
      }

      return {
        zone_id: zone.id,
        zone_name: zone.zone_name,
        status,
        attention_score: latestRecord.attention_score,
        participation_score: latestRecord.participation_score,
        confusion_level: latestRecord.confusion_level,
        student_count: latestRecord.face_presence_count,
        hand_raises: latestRecord.hand_raise_count,
        noise_level: latestRecord.noise_level,
        last_updated: latestRecord.timestamp,
      };
    });

    // Calculate overall session metrics
    const overallMetrics = {
      total_alerts: alerts.length,
      critical_alerts: alerts.filter((a: any) => a.severity === "critical")
        .length,
      high_alerts: alerts.filter((a: any) => a.severity === "high").length,
      average_attention:
        engagementData.length > 0
          ? engagementData.reduce(
              (sum: number, record: any) => sum + record.attention_score,
              0,
            ) / engagementData.length
          : 0,
      average_participation:
        engagementData.length > 0
          ? engagementData.reduce(
              (sum: number, record: any) => sum + record.participation_score,
              0,
            ) / engagementData.length
          : 0,
      total_students: Math.max(
        ...engagementData.map((record: any) => record.face_presence_count),
        0,
      ),
      active_zones: zoneStats.filter((zone) => zone.status !== "no_data")
        .length,
      problematic_zones: zoneStats.filter(
        (zone) => zone.status === "critical" || zone.status === "warning",
      ).length,
    };

    return new Response(
      JSON.stringify({
        alerts,
        zone_statistics: zoneStats,
        overall_metrics: overallMetrics,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error fetching engagement alerts:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
