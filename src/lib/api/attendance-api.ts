import { supabase } from "../supabase";

/**
 * Create a new attendance session for a class
 */
export async function createAttendanceSession(classId: string, date?: string) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-create-attendance-session",
      {
        body: { class_id: classId, date },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating attendance session:", error);
    throw error;
  }
}

/**
 * Record attendance for a student
 */
export async function recordAttendance({
  sessionId,
  classId,
  studentId,
  status,
  locationLat,
  locationLng,
  isManual = false,
  markedBy,
}: {
  sessionId?: string;
  classId?: string;
  studentId: string;
  status: "present" | "absent" | "proxy";
  locationLat?: number;
  locationLng?: number;
  isManual?: boolean;
  markedBy?: string;
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-record-attendance",
      {
        body: {
          session_id: sessionId,
          class_id: classId,
          student_id: studentId,
          status,
          location_lat: locationLat,
          location_lng: locationLng,
          is_manual: isManual,
          marked_by: markedBy,
        },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error recording attendance:", error);
    throw error;
  }
}

/**
 * Get students enrolled in a class
 */
export async function getClassStudents(classId: string) {
  try {
    const { data, error } = await supabase
      .from("class_enrollments")
      .select("*, users!class_enrollments_student_id_fkey(*)")
      .eq("class_id", classId);

    if (error) throw error;
    return data.map((enrollment) => enrollment.users);
  } catch (error) {
    console.error("Error getting class students:", error);
    return [];
  }
}

/**
 * Get attendance records for a session
 */
export async function getSessionAttendance(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from("attendance_records")
      .select("*, users!attendance_records_student_id_fkey(*)")
      .eq("session_id", sessionId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting session attendance:", error);
    return [];
  }
}

/**
 * Get attendance sessions for a class
 */
export async function getClassSessions(classId: string) {
  try {
    const { data, error } = await supabase
      .from("attendance_sessions")
      .select("*")
      .eq("class_id", classId)
      .order("date", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting class sessions:", error);
    return [];
  }
}

/**
 * Record engagement data from video/audio processing
 */
export async function recordEngagementData({
  sessionId,
  videoData,
  audioData,
  processingMode = "edge",
}: {
  sessionId: string;
  videoData?: any;
  audioData?: any;
  processingMode?: "edge" | "on_prem" | "cloud";
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-record-engagement",
      {
        body: {
          session_id: sessionId,
          video_data: videoData,
          audio_data: audioData,
          processing_mode: processingMode,
          timestamp: new Date().toISOString(),
        },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error recording engagement data:", error);
    throw error;
  }
}

/**
 * Get current engagement alerts and zone statistics
 */
export async function getEngagementAlerts({
  sessionId,
  includeResolved = false,
  severity,
}: {
  sessionId: string;
  includeResolved?: boolean;
  severity?: "low" | "medium" | "high" | "critical";
}) {
  try {
    const params = new URLSearchParams({
      session_id: sessionId,
      include_resolved: includeResolved.toString(),
    });

    if (severity) {
      params.append("severity", severity);
    }

    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-get-engagement-alerts",
      {
        body: {},
        method: "GET",
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting engagement alerts:", error);
    throw error;
  }
}

/**
 * Record quiz/poll response
 */
export async function recordQuizResponse({
  sessionId,
  studentId,
  quizQuestion,
  studentResponse,
  correctAnswer,
  responseTimeSeconds,
  confidenceLevel,
}: {
  sessionId: string;
  studentId: string;
  quizQuestion: string;
  studentResponse: string;
  correctAnswer: string;
  responseTimeSeconds: number;
  confidenceLevel?: number;
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-record-quiz-response",
      {
        body: {
          session_id: sessionId,
          student_id: studentId,
          quiz_question: quizQuestion,
          student_response: studentResponse,
          correct_answer: correctAnswer,
          response_time_seconds: responseTimeSeconds,
          confidence_level: confidenceLevel,
        },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error recording quiz response:", error);
    throw error;
  }
}

/**
 * Get real-time engagement data for a session
 */
export async function getEngagementData(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from("engagement_records")
      .select(
        `
        *,
        classroom_zones(zone_name, zone_coordinates)
      `,
      )
      .eq("session_id", sessionId)
      .order("timestamp", { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting engagement data:", error);
    return [];
  }
}

/**
 * Get quiz responses for a session
 */
export async function getQuizResponses(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from("quiz_responses")
      .select(
        `
        *,
        users!quiz_responses_student_id_fkey(name, student_id)
      `,
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting quiz responses:", error);
    return [];
  }
}

/**
 * Resolve an engagement alert
 */
export async function resolveEngagementAlert(alertId: string) {
  try {
    const { data, error } = await supabase
      .from("engagement_alerts")
      .update({
        is_resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", alertId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error resolving engagement alert:", error);
    throw error;
  }
}

/**
 * Send targeted intervention to specific zone
 */
export async function sendTargetedIntervention({
  sessionId,
  zoneId,
  interventionType,
  message,
}: {
  sessionId: string;
  zoneId: string;
  interventionType:
    | "attention_boost"
    | "participation_prompt"
    | "confusion_help"
    | "gamification";
  message: string;
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-send-intervention",
      {
        body: {
          session_id: sessionId,
          zone_id: zoneId,
          intervention_type: interventionType,
          message,
        },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error sending intervention:", error);
    throw error;
  }
}

/**
 * Get intervention history for a session
 */
export async function getInterventionHistory(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from("intervention_records")
      .select("*")
      .eq("session_id", sessionId)
      .order("sent_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting intervention history:", error);
    return [];
  }
}

/**
 * Trigger engagement booster activities
 */
export async function triggerEngagementBooster({
  sessionId,
  boosterType,
}: {
  sessionId: string;
  boosterType:
    | "attention_game"
    | "quick_poll"
    | "team_challenge"
    | "knowledge_race";
}) {
  try {
    const { data, error } = await supabase.functions.invoke(
      "supabase-functions-trigger-engagement-booster",
      {
        body: {
          session_id: sessionId,
          booster_type: boosterType,
        },
      },
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error triggering engagement booster:", error);
    throw error;
  }
}

/**
 * Generate session summary for LMS export
 */
export async function generateSessionSummary(sessionId: string) {
  try {
    // Get all engagement data for the session
    const engagementData = await getEngagementData(sessionId);
    const quizData = await getQuizResponses(sessionId);
    const alertsData = await getEngagementAlerts({
      sessionId,
      includeResolved: true,
    });

    if (!engagementData.length) {
      throw new Error("No engagement data found for session");
    }

    // Calculate summary metrics
    const totalRecords = engagementData.length;
    const averageAttention =
      engagementData.reduce((sum, record) => sum + record.attention_score, 0) /
      totalRecords;
    const averageParticipation =
      engagementData.reduce(
        (sum, record) => sum + record.participation_score,
        0,
      ) / totalRecords;
    const confusionIncidents = engagementData.filter(
      (record) => record.confusion_level > 0.6,
    ).length;
    const interventionCount = alertsData.alerts?.length || 0;
    const quizCompletionRate =
      quizData.length > 0
        ? quizData.filter((q: any) => q.student_response).length /
          quizData.length
        : 0;
    const overallEngagementScore =
      (averageAttention + averageParticipation) / 2;

    const summaryData = {
      session_id: sessionId,
      total_students: Math.max(
        ...engagementData.map((record) => record.face_presence_count),
        0,
      ),
      average_attention: Math.round(averageAttention * 100) / 100,
      average_participation: Math.round(averageParticipation * 100) / 100,
      confusion_incidents: confusionIncidents,
      intervention_count: interventionCount,
      quiz_completion_rate: Math.round(quizCompletionRate * 100) / 100,
      overall_engagement_score: Math.round(overallEngagementScore * 100) / 100,
      summary_data: {
        engagement_timeline: engagementData.slice(0, 20), // Last 20 records
        quiz_performance: quizData.slice(0, 10), // Last 10 quiz responses
        alert_summary: alertsData.overall_metrics,
        zone_performance: alertsData.zone_statistics,
      },
    };

    // Store summary in database
    const { data, error } = await supabase
      .from("session_summaries")
      .insert(summaryData)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error generating session summary:", error);
    throw error;
  }
}
