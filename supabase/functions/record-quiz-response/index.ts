import { corsHeaders } from "@shared/cors.ts";

interface QuizResponse {
  session_id: string;
  student_id: string;
  quiz_question: string;
  student_response: string;
  correct_answer: string;
  response_time_seconds: number;
  confidence_level?: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const quizData: QuizResponse = await req.json();

    // Validate required fields
    if (
      !quizData.session_id ||
      !quizData.student_id ||
      !quizData.quiz_question
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: session_id, student_id, quiz_question",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;

    // Determine if answer is correct
    const isCorrect =
      quizData.student_response.toLowerCase().trim() ===
      quizData.correct_answer.toLowerCase().trim();

    // Calculate confidence level if not provided
    let confidenceLevel = quizData.confidence_level;
    if (!confidenceLevel) {
      // Estimate confidence based on response time and correctness
      const baseConfidence = isCorrect ? 0.7 : 0.3;
      const timeBonus = Math.max(
        0,
        ((30 - quizData.response_time_seconds) / 30) * 0.3,
      );
      confidenceLevel = Math.min(1, baseConfidence + timeBonus);
    }

    // Store quiz response
    const responseData = {
      ...quizData,
      is_correct: isCorrect,
      confidence_level: confidenceLevel,
    };

    const storeResponse = await fetch(`${supabaseUrl}/rest/v1/quiz_responses`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        apikey: supabaseKey,
      },
      body: JSON.stringify(responseData),
    });

    if (!storeResponse.ok) {
      throw new Error(
        `Failed to store quiz response: ${storeResponse.statusText}`,
      );
    }

    const storedResponse = await storeResponse.json();

    // Update engagement score based on quiz performance
    await updateEngagementFromQuiz(
      quizData.session_id,
      quizData.student_id,
      isCorrect,
      confidenceLevel,
      quizData.response_time_seconds,
    );

    // Check if this creates any new alerts
    const alerts = await checkQuizAlerts(
      quizData.session_id,
      isCorrect,
      quizData.response_time_seconds,
    );

    return new Response(
      JSON.stringify({
        success: true,
        quiz_response: storedResponse,
        is_correct: isCorrect,
        confidence_level: confidenceLevel,
        alerts_generated: alerts.length,
        engagement_updated: true,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error recording quiz response:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function updateEngagementFromQuiz(
  sessionId: string,
  studentId: string,
  isCorrect: boolean,
  confidence: number,
  responseTime: number,
) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;

  // Get the student's zone (simplified - in real implementation, this would be tracked)
  const zonesResponse = await fetch(
    `${supabaseUrl}/rest/v1/classroom_zones?session_id=eq.${sessionId}&limit=1`,
    {
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
      },
    },
  );

  const zones = await zonesResponse.json();
  const zoneId = zones.length > 0 ? zones[0].id : null;

  // Calculate engagement boost from quiz performance
  const participationBoost = isCorrect ? 0.2 : 0.1;
  const attentionBoost = confidence * 0.15;
  const confusionReduction = isCorrect ? -0.1 : 0.05; // Reduce confusion if correct, slight increase if wrong

  // Create an engagement record reflecting the quiz interaction
  const engagementData = {
    session_id: sessionId,
    zone_id: zoneId,
    attention_score: Math.min(1, 0.7 + attentionBoost), // Base attention + quiz boost
    participation_score: Math.min(1, 0.6 + participationBoost), // Base participation + quiz boost
    confusion_level: Math.max(0, 0.3 + confusionReduction), // Adjust confusion based on correctness
    audio_sentiment: isCorrect ? 0.3 : -0.1, // Positive sentiment for correct answers
    noise_level: 0.2, // Low noise during quiz
    face_presence_count: 1, // Student is present for quiz
    hand_raise_count: 0,
    posture_engagement: confidence, // Use confidence as posture engagement proxy
  };

  await fetch(`${supabaseUrl}/rest/v1/engagement_records`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      apikey: supabaseKey,
    },
    body: JSON.stringify(engagementData),
  });
}

async function checkQuizAlerts(
  sessionId: string,
  isCorrect: boolean,
  responseTime: number,
): Promise<any[]> {
  const alerts = [];
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;

  // Get recent quiz responses for this session to check patterns
  const recentQuizzesResponse = await fetch(
    `${supabaseUrl}/rest/v1/quiz_responses?session_id=eq.${sessionId}&order=created_at.desc&limit=10`,
    {
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
      },
    },
  );

  if (recentQuizzesResponse.ok) {
    const recentQuizzes = await recentQuizzesResponse.json();

    // Check for concerning patterns
    const correctRate =
      recentQuizzes.filter((q: any) => q.is_correct).length /
      recentQuizzes.length;
    const avgResponseTime =
      recentQuizzes.reduce(
        (sum: number, q: any) => sum + q.response_time_seconds,
        0,
      ) / recentQuizzes.length;

    // Alert if quiz performance is poor
    if (correctRate < 0.4 && recentQuizzes.length >= 3) {
      alerts.push({
        session_id: sessionId,
        alert_type: "low_quiz_performance",
        severity: "high",
        message: `Low quiz performance detected - ${Math.round(correctRate * 100)}% correct rate`,
        threshold_value: 0.4,
        current_value: correctRate,
      });
    }

    // Alert if response times are consistently slow
    if (avgResponseTime > 45 && recentQuizzes.length >= 3) {
      alerts.push({
        session_id: sessionId,
        alert_type: "slow_quiz_responses",
        severity: "medium",
        message: `Students taking longer than expected to respond to quizzes`,
        threshold_value: 30,
        current_value: avgResponseTime,
      });
    }

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
  }

  return alerts;
}
