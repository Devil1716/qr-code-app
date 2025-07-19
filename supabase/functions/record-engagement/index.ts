import { corsHeaders } from "@shared/cors.ts";

interface EngagementData {
  session_id: string;
  zone_id?: string;
  attention_score: number;
  participation_score: number;
  confusion_level: number;
  audio_sentiment: number;
  noise_level: number;
  face_presence_count: number;
  hand_raise_count: number;
  posture_engagement: number;
}

interface VideoAnalysisResult {
  faces: Array<{
    bbox: number[];
    confidence: number;
    liveness_score: number;
    attention_vector: number[];
  }>;
  gestures: Array<{
    type: string;
    confidence: number;
    bbox: number[];
  }>;
  posture_analysis: {
    engagement_score: number;
    posture_type: string;
  };
}

interface AudioAnalysisResult {
  sentiment_score: number;
  noise_level: number;
  speaker_segments: Array<{
    start: number;
    end: number;
    speaker_id: string;
  }>;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      session_id,
      zone_id,
      video_data,
      audio_data,
      processing_mode = "edge",
    } = await req.json();

    if (!session_id) {
      return new Response(JSON.stringify({ error: "Session ID is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Simulate edge video processing (in real implementation, this would use ML models)
    const videoAnalysis: VideoAnalysisResult = await processVideoData(
      video_data,
      processing_mode,
    );
    const audioAnalysis: AudioAnalysisResult = await processAudioData(
      audio_data,
      processing_mode,
    );

    // Calculate engagement metrics
    const engagementData: EngagementData = {
      session_id,
      zone_id,
      attention_score: calculateAttentionScore(videoAnalysis),
      participation_score: calculateParticipationScore(
        videoAnalysis,
        audioAnalysis,
      ),
      confusion_level: calculateConfusionLevel(videoAnalysis),
      audio_sentiment: audioAnalysis.sentiment_score,
      noise_level: audioAnalysis.noise_level,
      face_presence_count: videoAnalysis.faces.length,
      hand_raise_count: videoAnalysis.gestures.filter(
        (g) => g.type === "hand_raise",
      ).length,
      posture_engagement: videoAnalysis.posture_analysis.engagement_score,
    };

    // Store engagement record in database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;

    const response = await fetch(`${supabaseUrl}/rest/v1/engagement_records`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        apikey: supabaseKey,
      },
      body: JSON.stringify(engagementData),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to store engagement data: ${response.statusText}`,
      );
    }

    // Check for alerts
    const alerts = await generateAlerts(engagementData);

    // Store alerts if any
    if (alerts.length > 0) {
      await fetch(`${supabaseUrl}/rest/v1/engagement_alerts`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          apikey: supabaseKey,
        },
        body: JSON.stringify(alerts),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        engagement_data: engagementData,
        alerts: alerts.length,
        processing_latency:
          Date.now() -
          new Date(req.headers.get("timestamp") || Date.now()).getTime(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error processing engagement data:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Simulated ML processing functions (in real implementation, these would use actual ML models)
async function processVideoData(
  videoData: any,
  mode: string,
): Promise<VideoAnalysisResult> {
  // Simulate processing delay based on mode
  const delay = mode === "edge" ? 100 : mode === "on_prem" ? 200 : 500;
  await new Promise((resolve) => setTimeout(resolve, delay));

  // Mock video analysis results
  return {
    faces: Array.from(
      { length: Math.floor(Math.random() * 15) + 5 },
      (_, i) => ({
        bbox: [Math.random() * 100, Math.random() * 100, 50, 50],
        confidence: 0.8 + Math.random() * 0.2,
        liveness_score: 0.7 + Math.random() * 0.3,
        attention_vector: [Math.random(), Math.random(), Math.random()],
      }),
    ),
    gestures: Array.from({ length: Math.floor(Math.random() * 5) }, () => ({
      type: Math.random() > 0.7 ? "hand_raise" : "pointing",
      confidence: 0.6 + Math.random() * 0.4,
      bbox: [Math.random() * 100, Math.random() * 100, 30, 30],
    })),
    posture_analysis: {
      engagement_score: 0.3 + Math.random() * 0.7,
      posture_type: Math.random() > 0.5 ? "engaged" : "slouching",
    },
  };
}

async function processAudioData(
  audioData: any,
  mode: string,
): Promise<AudioAnalysisResult> {
  const delay = mode === "edge" ? 50 : mode === "on_prem" ? 100 : 300;
  await new Promise((resolve) => setTimeout(resolve, delay));

  return {
    sentiment_score: -1 + Math.random() * 2, // -1 to 1
    noise_level: Math.random(),
    speaker_segments: Array.from(
      { length: Math.floor(Math.random() * 3) + 1 },
      (_, i) => ({
        start: i * 10,
        end: (i + 1) * 10,
        speaker_id: `speaker_${i}`,
      }),
    ),
  };
}

function calculateAttentionScore(videoAnalysis: VideoAnalysisResult): number {
  const avgLiveness =
    videoAnalysis.faces.reduce((sum, face) => sum + face.liveness_score, 0) /
      videoAnalysis.faces.length || 0;
  const postureWeight = videoAnalysis.posture_analysis.engagement_score;
  return Math.min(1, avgLiveness * 0.7 + postureWeight * 0.3);
}

function calculateParticipationScore(
  videoAnalysis: VideoAnalysisResult,
  audioAnalysis: AudioAnalysisResult,
): number {
  const handRaises = videoAnalysis.gestures.filter(
    (g) => g.type === "hand_raise",
  ).length;
  const speakerActivity = audioAnalysis.speaker_segments.length;
  const baseScore = Math.min(1, handRaises * 0.3 + speakerActivity * 0.2);
  return Math.min(1, baseScore + (audioAnalysis.sentiment_score > 0 ? 0.2 : 0));
}

function calculateConfusionLevel(videoAnalysis: VideoAnalysisResult): number {
  // Simulate confusion detection based on facial expressions and posture
  const confusedPosture =
    videoAnalysis.posture_analysis.posture_type === "slouching" ? 0.3 : 0;
  const lowAttention =
    videoAnalysis.faces.filter((f) => f.liveness_score < 0.5).length /
    videoAnalysis.faces.length;
  return Math.min(1, confusedPosture + lowAttention * 0.5);
}

async function generateAlerts(data: EngagementData): Promise<any[]> {
  const alerts = [];

  // Disengagement alert
  if (data.attention_score < 0.5 && data.participation_score < 0.4) {
    alerts.push({
      session_id: data.session_id,
      zone_id: data.zone_id,
      alert_type: "disengagement",
      severity: data.attention_score < 0.3 ? "critical" : "high",
      message: `${data.zone_id ? data.zone_id : "Classroom"} showing low engagement levels`,
      threshold_value: 0.5,
      current_value: (data.attention_score + data.participation_score) / 2,
    });
  }

  // Confusion spike alert
  if (data.confusion_level > 0.6) {
    alerts.push({
      session_id: data.session_id,
      zone_id: data.zone_id,
      alert_type: "confusion_spike",
      severity: data.confusion_level > 0.8 ? "high" : "medium",
      message: `Elevated confusion levels detected in ${data.zone_id || "classroom"}`,
      threshold_value: 0.6,
      current_value: data.confusion_level,
    });
  }

  // Noise disruption alert
  if (data.noise_level > 0.7) {
    alerts.push({
      session_id: data.session_id,
      zone_id: data.zone_id,
      alert_type: "noise_disruption",
      severity: data.noise_level > 0.9 ? "high" : "medium",
      message: `Disruptive noise levels in ${data.zone_id || "classroom"}`,
      threshold_value: 0.7,
      current_value: data.noise_level,
    });
  }

  // Low participation alert
  if (data.participation_score < 0.3 && data.hand_raise_count === 0) {
    alerts.push({
      session_id: data.session_id,
      zone_id: data.zone_id,
      alert_type: "low_participation",
      severity: "medium",
      message: `Very low participation in ${data.zone_id || "classroom"}`,
      threshold_value: 0.3,
      current_value: data.participation_score,
    });
  }

  return alerts;
}
