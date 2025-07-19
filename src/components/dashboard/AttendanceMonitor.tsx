import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Brain,
  Users,
  Volume2,
  Eye,
  Hand,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Send,
  MessageSquare,
  Target,
  Lightbulb,
  Timer,
  Award,
  Gamepad2,
} from "lucide-react";
import {
  getEngagementAlerts,
  getEngagementData,
  resolveEngagementAlert,
  sendTargetedIntervention,
  getInterventionHistory,
  triggerEngagementBooster,
} from "@/lib/api/attendance-api";

interface Student {
  id: string;
  name: string;
  status: "present" | "absent" | "proxy";
  timestamp?: string;
}

interface EngagementAlert {
  id: string;
  alert_type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  zone_id?: string;
  current_value: number;
  threshold_value: number;
  created_at: string;
  is_resolved: boolean;
}

interface ZoneStatistics {
  zone_id: string;
  zone_name: string;
  status: "good" | "warning" | "critical" | "no_data";
  attention_score: number;
  participation_score: number;
  confusion_level: number;
  student_count: number;
  hand_raises: number;
  noise_level: number;
  last_updated: string;
}

interface InterventionRecord {
  id: string;
  zone_id: string;
  intervention_type:
    | "attention_boost"
    | "participation_prompt"
    | "confusion_help"
    | "gamification";
  message: string;
  sent_at: string;
  effectiveness_score?: number;
}

interface EngagementData {
  alerts: EngagementAlert[];
  zone_statistics: ZoneStatistics[];
  interventions: InterventionRecord[];
  gamification_stats: {
    total_points: number;
    active_challenges: number;
    completion_rate: number;
  };
  overall_metrics: {
    total_alerts: number;
    critical_alerts: number;
    high_alerts: number;
    average_attention: number;
    average_participation: number;
    total_students: number;
    active_zones: number;
    problematic_zones: number;
    intervention_success_rate: number;
  };
}

interface AttendanceMonitorProps {
  className?: string;
  students?: Student[];
  sessionId?: string;
  onStatusChange?: (
    studentId: string,
    status: "present" | "absent" | "proxy",
  ) => void;
}

const AttendanceMonitor = ({
  className = "",
  students = [
    { id: "1", name: "John Doe", status: "present", timestamp: "09:00 AM" },
    { id: "2", name: "Jane Smith", status: "absent" },
    { id: "3", name: "Mike Johnson", status: "proxy", timestamp: "09:05 AM" },
    {
      id: "4",
      name: "Sarah Williams",
      status: "present",
      timestamp: "09:02 AM",
    },
    { id: "5", name: "Tom Brown", status: "absent" },
  ],
  sessionId = "00000000-0000-0000-0000-000000000031",
  onStatusChange = () => {},
}: AttendanceMonitorProps) => {
  const [engagementData, setEngagementData] = useState<EngagementData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("attendance");
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [interventionMessage, setInterventionMessage] = useState("");
  const [sendingIntervention, setSendingIntervention] = useState(false);

  const stats = {
    present: students.filter((s) => s.status === "present").length,
    absent: students.filter((s) => s.status === "absent").length,
    proxy: students.filter((s) => s.status === "proxy").length,
  };

  // Load engagement data
  useEffect(() => {
    const loadEngagementData = async () => {
      if (!sessionId) return;

      try {
        setLoading(true);
        const data = await getEngagementAlerts({ sessionId });
        setEngagementData(data);
      } catch (error) {
        console.error("Error loading engagement data:", error);
        // Use mock data for demonstration
        setEngagementData({
          alerts: [
            {
              id: "1",
              alert_type: "disengagement",
              severity: "high",
              message: "Zone B showing low attention and participation levels",
              zone_id: "Zone B",
              current_value: 0.4,
              threshold_value: 0.6,
              created_at: new Date().toISOString(),
              is_resolved: false,
            },
            {
              id: "2",
              alert_type: "confusion_spike",
              severity: "medium",
              message: "Confusion levels elevated in Zone C",
              zone_id: "Zone C",
              current_value: 0.65,
              threshold_value: 0.5,
              created_at: new Date().toISOString(),
              is_resolved: false,
            },
          ],
          interventions: [
            {
              id: "int1",
              zone_id: "Zone B",
              intervention_type: "attention_boost",
              message: "Quick attention check! Can everyone look at the board?",
              sent_at: new Date(Date.now() - 300000).toISOString(),
              effectiveness_score: 0.75,
            },
            {
              id: "int2",
              zone_id: "Zone C",
              intervention_type: "confusion_help",
              message: "Let's clarify this concept with a quick example",
              sent_at: new Date(Date.now() - 600000).toISOString(),
              effectiveness_score: 0.85,
            },
          ],
          gamification_stats: {
            total_points: 1250,
            active_challenges: 3,
            completion_rate: 0.78,
          },
          zone_statistics: [
            {
              zone_id: "zone-a",
              zone_name: "Zone A",
              status: "good",
              attention_score: 0.85,
              participation_score: 0.78,
              confusion_level: 0.15,
              student_count: 12,
              hand_raises: 3,
              noise_level: 0.3,
              last_updated: new Date().toISOString(),
            },
            {
              zone_id: "zone-b",
              zone_name: "Zone B",
              status: "critical",
              attention_score: 0.35,
              participation_score: 0.25,
              confusion_level: 0.65,
              student_count: 8,
              hand_raises: 0,
              noise_level: 0.7,
              last_updated: new Date().toISOString(),
            },
            {
              zone_id: "zone-c",
              zone_name: "Zone C",
              status: "warning",
              attention_score: 0.65,
              participation_score: 0.55,
              confusion_level: 0.45,
              student_count: 10,
              hand_raises: 1,
              noise_level: 0.4,
              last_updated: new Date().toISOString(),
            },
          ],
          overall_metrics: {
            total_alerts: 2,
            critical_alerts: 1,
            high_alerts: 1,
            average_attention: 0.62,
            average_participation: 0.53,
            total_students: 30,
            active_zones: 3,
            problematic_zones: 2,
            intervention_success_rate: 0.8,
          },
        });
      } finally {
        setLoading(false);
      }
    };

    loadEngagementData();

    // Set up real-time updates
    const interval = setInterval(loadEngagementData, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [sessionId]);

  const handleResolveAlert = async (alertId: string) => {
    try {
      await resolveEngagementAlert(alertId);
      // Refresh data
      const data = await getEngagementAlerts({ sessionId });
      setEngagementData(data);
    } catch (error) {
      console.error("Error resolving alert:", error);
    }
  };

  const handleSendIntervention = async (zoneId: string, type: string) => {
    if (!interventionMessage.trim()) return;

    setSendingIntervention(true);
    try {
      await sendTargetedIntervention({
        sessionId,
        zoneId,
        interventionType: type as any,
        message: interventionMessage,
      });
      setInterventionMessage("");
      setSelectedZone(null);
      // Refresh data
      const data = await getEngagementAlerts({ sessionId });
      setEngagementData(data);
    } catch (error) {
      console.error("Error sending intervention:", error);
    } finally {
      setSendingIntervention(false);
    }
  };

  const handleEngagementBooster = async (type: string) => {
    try {
      await triggerEngagementBooster({
        sessionId,
        boosterType: type as any,
      });
      // Refresh data
      const data = await getEngagementAlerts({ sessionId });
      setEngagementData(data);
    } catch (error) {
      console.error("Error triggering engagement booster:", error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  const getZoneStatusColor = (status: string) => {
    switch (status) {
      case "good":
        return "text-green-600 bg-green-50";
      case "warning":
        return "text-yellow-600 bg-yellow-50";
      case "critical":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  if (loading) {
    return (
      <Card className={`w-full md:w-[400px] h-[700px] p-4 ${className}`}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Activity className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading engagement data...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`w-full md:w-[400px] h-[700px] p-4 ${className}`}>
      <div className="space-y-4 h-full">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Live Monitor
          </h2>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Live</span>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="h-full flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-5 text-xs">
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
            <TabsTrigger value="gamification">Gamification</TabsTrigger>
          </TabsList>

          <TabsContent value="attendance" className="flex-1 space-y-4">
            {/* Traditional Attendance Stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
                <p className="text-sm font-medium mt-1">Present</p>
                <p className="text-lg font-bold text-green-600">
                  {stats.present}
                </p>
              </div>
              <div className="p-2 bg-red-50 rounded-lg">
                <XCircle className="w-5 h-5 text-red-600 mx-auto" />
                <p className="text-sm font-medium mt-1">Absent</p>
                <p className="text-lg font-bold text-red-600">{stats.absent}</p>
              </div>
              <div className="p-2 bg-yellow-50 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto" />
                <p className="text-sm font-medium mt-1">Proxy</p>
                <p className="text-lg font-bold text-yellow-600">
                  {stats.proxy}
                </p>
              </div>
            </div>

            <Separator />

            {/* Student List */}
            <ScrollArea className="h-[400px] w-full pr-4">
              <div className="space-y-2">
                {students.map((student) => (
                  <div
                    key={student.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{student.name}</p>
                        {student.timestamp && (
                          <p className="text-sm text-gray-500">
                            {student.timestamp}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={
                          student.status === "present"
                            ? "default"
                            : student.status === "absent"
                              ? "destructive"
                              : "warning"
                        }
                      >
                        {student.status.charAt(0).toUpperCase() +
                          student.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="engagement" className="flex-1 space-y-4">
            {/* Overall Engagement Metrics */}
            {engagementData && (
              <>
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Eye className="w-5 h-5 text-blue-600 mx-auto" />
                    <p className="text-sm font-medium mt-1">Attention</p>
                    <p className="text-lg font-bold text-blue-600">
                      {Math.round(
                        engagementData.overall_metrics.average_attention * 100,
                      )}
                      %
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <Hand className="w-5 h-5 text-purple-600 mx-auto" />
                    <p className="text-sm font-medium mt-1">Participation</p>
                    <p className="text-lg font-bold text-purple-600">
                      {Math.round(
                        engagementData.overall_metrics.average_participation *
                          100,
                      )}
                      %
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Zone Statistics */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Zone Performance
                  </h3>
                  <ScrollArea className="h-[350px] w-full pr-4">
                    <div className="space-y-3">
                      {engagementData.zone_statistics.map((zone) => (
                        <div
                          key={zone.zone_id}
                          className="p-3 border rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{zone.zone_name}</h4>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={getZoneStatusColor(zone.status)}
                              >
                                {zone.status}
                              </Badge>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setSelectedZone(zone.zone_id)}
                                className="h-6 px-2 text-xs"
                              >
                                <Target className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" /> Attention
                              </span>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={zone.attention_score * 100}
                                  className="w-16 h-2"
                                />
                                <span className="text-xs w-8">
                                  {Math.round(zone.attention_score * 100)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1">
                                <Hand className="w-3 h-3" /> Participation
                              </span>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={zone.participation_score * 100}
                                  className="w-16 h-2"
                                />
                                <span className="text-xs w-8">
                                  {Math.round(zone.participation_score * 100)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between items-center">
                              <span className="flex items-center gap-1">
                                <Brain className="w-3 h-3" /> Confusion
                              </span>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={zone.confusion_level * 100}
                                  className="w-16 h-2"
                                  indicatorClassName="bg-red-500"
                                />
                                <span className="text-xs w-8">
                                  {Math.round(zone.confusion_level * 100)}%
                                </span>
                              </div>
                            </div>

                            <div className="flex justify-between text-xs text-muted-foreground pt-1">
                              <span>{zone.student_count} students</span>
                              <span>{zone.hand_raises} hand raises</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="alerts" className="flex-1 space-y-4">
            {/* Alert Summary */}
            {engagementData && (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Zap className="w-5 h-5 text-red-600 mx-auto" />
                    <p className="text-xs font-medium mt-1">Critical</p>
                    <p className="text-lg font-bold text-red-600">
                      {engagementData.overall_metrics.critical_alerts}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-orange-600 mx-auto" />
                    <p className="text-xs font-medium mt-1">High</p>
                    <p className="text-lg font-bold text-orange-600">
                      {engagementData.overall_metrics.high_alerts}
                    </p>
                  </div>
                  <div className="p-2 bg-gray-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-gray-600 mx-auto" />
                    <p className="text-xs font-medium mt-1">Total</p>
                    <p className="text-lg font-bold text-gray-600">
                      {engagementData.overall_metrics.total_alerts}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Active Alerts */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Active Alerts
                  </h3>
                  <ScrollArea className="h-[350px] w-full pr-4">
                    <div className="space-y-3">
                      {engagementData.alerts
                        .filter((alert) => !alert.is_resolved)
                        .map((alert) => (
                          <div
                            key={alert.id}
                            className="p-3 border rounded-lg bg-white"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${getSeverityColor(alert.severity)}`}
                                />
                                <Badge variant="outline" className="text-xs">
                                  {alert.severity.toUpperCase()}
                                </Badge>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleResolveAlert(alert.id)}
                                className="h-6 px-2 text-xs"
                              >
                                Resolve
                              </Button>
                            </div>

                            <p className="text-sm font-medium mb-1">
                              {alert.message}
                            </p>

                            {alert.zone_id && (
                              <p className="text-xs text-muted-foreground mb-2">
                                Zone: {alert.zone_id}
                              </p>
                            )}

                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>
                                Current: {Math.round(alert.current_value * 100)}
                                %
                              </span>
                              <span>
                                Threshold:{" "}
                                {Math.round(alert.threshold_value * 100)}%
                              </span>
                            </div>

                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(alert.created_at).toLocaleTimeString()}
                            </p>
                          </div>
                        ))}

                      {engagementData.alerts.filter(
                        (alert) => !alert.is_resolved,
                      ).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                          <p>No active alerts</p>
                          <p className="text-xs">All zones performing well</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="interventions" className="flex-1 space-y-4">
            {/* Intervention Controls */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Smart Interventions
                </h3>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEngagementBooster("attention_game")}
                    className="h-6 px-2 text-xs"
                  >
                    <Gamepad2 className="h-3 w-3 mr-1" />
                    Game
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEngagementBooster("quick_poll")}
                    className="h-6 px-2 text-xs"
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Poll
                  </Button>
                </div>
              </div>

              {selectedZone && (
                <div className="p-3 border rounded-lg bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">
                      Send to {selectedZone}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedZone(null)}
                      className="h-6 px-2 text-xs"
                    >
                      ×
                    </Button>
                  </div>
                  <textarea
                    value={interventionMessage}
                    onChange={(e) => setInterventionMessage(e.target.value)}
                    placeholder="Type your intervention message..."
                    className="w-full p-2 text-xs border rounded resize-none"
                    rows={2}
                  />
                  <div className="flex gap-1 mt-2">
                    <Button
                      size="sm"
                      onClick={() =>
                        handleSendIntervention(selectedZone, "attention_boost")
                      }
                      disabled={sendingIntervention}
                      className="h-6 px-2 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Attention
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleSendIntervention(
                          selectedZone,
                          "participation_prompt",
                        )
                      }
                      disabled={sendingIntervention}
                      className="h-6 px-2 text-xs"
                    >
                      <Hand className="h-3 w-3 mr-1" />
                      Participate
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        handleSendIntervention(selectedZone, "confusion_help")
                      }
                      disabled={sendingIntervention}
                      className="h-6 px-2 text-xs"
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      Help
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Intervention History */}
            <div className="space-y-2">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <Timer className="w-4 h-4" />
                Recent Interventions
              </h3>
              <ScrollArea className="h-[300px] w-full pr-4">
                <div className="space-y-2">
                  {engagementData?.interventions?.map((intervention) => (
                    <div
                      key={intervention.id}
                      className="p-2 border rounded-lg bg-white"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {intervention.zone_id}
                          </Badge>
                          <Badge
                            variant={
                              intervention.intervention_type ===
                              "attention_boost"
                                ? "default"
                                : intervention.intervention_type ===
                                    "confusion_help"
                                  ? "secondary"
                                  : "outline"
                            }
                            className="text-xs"
                          >
                            {intervention.intervention_type.replace("_", " ")}
                          </Badge>
                        </div>
                        {intervention.effectiveness_score && (
                          <div className="flex items-center gap-1">
                            <Award className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">
                              {Math.round(
                                intervention.effectiveness_score * 100,
                              )}
                              %
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mb-1">
                        {intervention.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(intervention.sent_at).toLocaleTimeString()}
                      </p>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p>No interventions sent yet</p>
                      <p className="text-xs">
                        Click zone targets to send interventions
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </TabsContent>

          <TabsContent value="gamification" className="flex-1 space-y-4">
            {/* Gamification Stats */}
            {engagementData && (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Award className="w-5 h-5 text-purple-600 mx-auto" />
                    <p className="text-sm font-medium mt-1">Points</p>
                    <p className="text-lg font-bold text-purple-600">
                      {engagementData.gamification_stats.total_points}
                    </p>
                  </div>
                  <div className="p-2 bg-green-50 rounded-lg">
                    <Gamepad2 className="w-5 h-5 text-green-600 mx-auto" />
                    <p className="text-sm font-medium mt-1">Challenges</p>
                    <p className="text-lg font-bold text-green-600">
                      {engagementData.gamification_stats.active_challenges}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-600 mx-auto" />
                    <p className="text-sm font-medium mt-1">Completion</p>
                    <p className="text-lg font-bold text-blue-600">
                      {Math.round(
                        engagementData.gamification_stats.completion_rate * 100,
                      )}
                      %
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Engagement Boosters */}
                <div className="space-y-3">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Engagement Boosters
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEngagementBooster("attention_game")}
                      className="h-16 flex flex-col gap-1"
                    >
                      <Gamepad2 className="h-4 w-4" />
                      <span className="text-xs">Attention Game</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEngagementBooster("quick_poll")}
                      className="h-16 flex flex-col gap-1"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="text-xs">Quick Poll</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEngagementBooster("team_challenge")}
                      className="h-16 flex flex-col gap-1"
                    >
                      <Users className="h-4 w-4" />
                      <span className="text-xs">Team Challenge</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEngagementBooster("knowledge_race")}
                      className="h-16 flex flex-col gap-1"
                    >
                      <Zap className="h-4 w-4" />
                      <span className="text-xs">Knowledge Race</span>
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Success Metrics */}
                <div className="space-y-2">
                  <h3 className="font-medium text-sm flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Success Metrics
                  </h3>
                  <div className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm">Intervention Success Rate</span>
                      <span className="text-sm font-medium">
                        {Math.round(
                          engagementData.overall_metrics
                            .intervention_success_rate * 100,
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={
                        engagementData.overall_metrics
                          .intervention_success_rate * 100
                      }
                      className="h-2"
                    />
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
};

export default AttendanceMonitor;
