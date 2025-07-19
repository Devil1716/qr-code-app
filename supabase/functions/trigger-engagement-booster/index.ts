import { corsHeaders } from "@shared/cors.ts";

interface EngagementBoosterRequest {
  session_id: string;
  booster_type:
    | "attention_game"
    | "quick_poll"
    | "team_challenge"
    | "knowledge_race";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const boosterData: EngagementBoosterRequest = await req.json();

    // Validate required fields
    if (!boosterData.session_id || !boosterData.booster_type) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: session_id, booster_type",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_KEY")!;

    // Generate booster activity based on type
    const boosterActivity = generateBoosterActivity(boosterData.booster_type);

    // Create gamification record for the session
    const gamificationRecord = {
      session_id: boosterData.session_id,
      activity_type: boosterData.booster_type,
      points_earned: boosterActivity.basePoints,
      completion_status: "in_progress",
      performance_data: boosterActivity.activityData,
    };

    const storeResponse = await fetch(
      `${supabaseUrl}/rest/v1/gamification_records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          apikey: supabaseKey,
        },
        body: JSON.stringify(gamificationRecord),
      },
    );

    if (!storeResponse.ok) {
      throw new Error(
        `Failed to store gamification record: ${storeResponse.statusText}`,
      );
    }

    const storedRecord = await storeResponse.json();

    // Simulate broadcasting the activity to all students in the session
    const broadcastResult = await simulateActivityBroadcast(
      boosterData.session_id,
      boosterData.booster_type,
      boosterActivity,
    );

    // Create predictive insight about the expected engagement boost
    const predictiveInsight = {
      session_id: boosterData.session_id,
      insight_type: "engagement_pattern",
      prediction_data: {
        activity_type: boosterData.booster_type,
        expected_engagement_boost: boosterActivity.expectedBoost,
        duration_minutes: boosterActivity.duration,
        participation_prediction: broadcastResult.expectedParticipation,
      },
      confidence_score: 0.85,
      recommended_action: `Monitor engagement levels during ${boosterData.booster_type} activity`,
    };

    await fetch(`${supabaseUrl}/rest/v1/predictive_insights`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        apikey: supabaseKey,
      },
      body: JSON.stringify(predictiveInsight),
    });

    return new Response(
      JSON.stringify({
        success: true,
        activity_id: storedRecord[0].id,
        activity_details: boosterActivity,
        broadcast_status: broadcastResult.status,
        students_engaged: broadcastResult.studentsEngaged,
        expected_duration: boosterActivity.duration,
        message: `${boosterData.booster_type} activity launched successfully`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error triggering engagement booster:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateBoosterActivity(boosterType: string) {
  const activities = {
    attention_game: {
      name: "Focus Challenge",
      description: "Quick visual attention game - spot the differences!",
      basePoints: 50,
      duration: 3, // minutes
      expectedBoost: 0.3,
      activityData: {
        game_type: "spot_differences",
        difficulty: "medium",
        time_limit: 180,
        questions: generateAttentionQuestions(),
      },
    },
    quick_poll: {
      name: "Lightning Poll",
      description: "Quick poll about today's topic",
      basePoints: 25,
      duration: 2,
      expectedBoost: 0.25,
      activityData: {
        poll_type: "multiple_choice",
        question: "What's the most interesting concept we've covered so far?",
        options: [
          "Data structures and algorithms",
          "Object-oriented programming",
          "Database design",
          "Web development frameworks",
        ],
        anonymous: true,
      },
    },
    team_challenge: {
      name: "Collaborative Problem Solving",
      description: "Work in teams to solve a coding challenge",
      basePoints: 100,
      duration: 10,
      expectedBoost: 0.4,
      activityData: {
        challenge_type: "coding_problem",
        team_size: 3,
        problem: "Implement a function to find the shortest path in a graph",
        hints: [
          "Consider using breadth-first search",
          "Think about the data structure for the graph",
          "Don't forget edge cases",
        ],
      },
    },
    knowledge_race: {
      name: "Speed Knowledge Race",
      description: "Fast-paced Q&A competition",
      basePoints: 75,
      duration: 5,
      expectedBoost: 0.35,
      activityData: {
        race_type: "rapid_fire_qa",
        questions_count: 10,
        time_per_question: 30,
        categories: ["Theory", "Practical", "Best Practices"],
        questions: generateKnowledgeRaceQuestions(),
      },
    },
  };

  return (
    activities[boosterType as keyof typeof activities] || activities.quick_poll
  );
}

function generateAttentionQuestions() {
  return [
    {
      type: "visual_pattern",
      instruction: "Find the pattern that doesn't belong",
      patterns: ["ABC", "DEF", "GHI", "JKM"],
      correct_answer: "JKM",
    },
    {
      type: "color_sequence",
      instruction: "What color comes next in the sequence?",
      sequence: ["red", "blue", "red", "blue", "red"],
      correct_answer: "blue",
    },
  ];
}

function generateKnowledgeRaceQuestions() {
  return [
    {
      question: "What does API stand for?",
      options: [
        "Application Programming Interface",
        "Advanced Programming Integration",
        "Automated Process Interface",
        "Application Process Integration",
      ],
      correct_answer: 0,
      category: "Theory",
    },
    {
      question: "Which data structure uses LIFO principle?",
      options: ["Queue", "Stack", "Array", "Linked List"],
      correct_answer: 1,
      category: "Theory",
    },
    {
      question: "What is the time complexity of binary search?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      correct_answer: 1,
      category: "Practical",
    },
  ];
}

async function simulateActivityBroadcast(
  sessionId: string,
  boosterType: string,
  activity: any,
) {
  // Simulate broadcasting to students
  const totalStudents = Math.floor(Math.random() * 30) + 20; // 20-50 students
  const engagementRate = 0.7 + Math.random() * 0.25; // 70-95% engagement
  const studentsEngaged = Math.floor(totalStudents * engagementRate);

  return {
    status: "broadcast_successful",
    studentsEngaged,
    totalStudents,
    expectedParticipation: engagementRate,
    activityLaunched: true,
  };
}
