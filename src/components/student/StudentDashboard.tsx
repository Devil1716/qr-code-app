import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { StudentHeader } from "./StudentHeader";
import { QrScanner } from "./QrScanner";
import { CourseRegistration } from "./CourseRegistration";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Clock,
  MapPin,
  QrCode,
  BookOpen,
  CalendarDays,
  User,
  Users,
} from "lucide-react";
import { Badge } from "../ui/badge";

function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [enrolledSubjects, setEnrolledSubjects] = useState<any[]>([]);
  const [enrolledEvents, setEnrolledEvents] = useState<any[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    // Check if user is logged in and has the student role
    const checkAuth = async () => {
      try {
        console.log("StudentDashboard: Checking authentication...");
        // Get user info from localStorage
        const userId = localStorage.getItem("userId");
        const userEmail = localStorage.getItem("userEmail");
        const userRole = localStorage.getItem("userRole");

        console.log("StudentDashboard: Auth data:", {
          userId,
          userEmail,
          userRole,
        });

        if (!userId || !userEmail || userRole !== "student") {
          console.log(
            "StudentDashboard: Invalid auth data, redirecting to login",
          );
          navigate("/");
          return;
        }

        // Try to get user details from database first
        try {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

          if (!userError && userData) {
            console.log("StudentDashboard: Database user found:", userData);
            setUser(userData);
            loadEnrolledData(userData.id);
            return;
          } else {
            console.log(
              "StudentDashboard: Database user not found, using mock data",
            );
          }
        } catch (dbError) {
          console.log(
            "StudentDashboard: Database error, using mock data:",
            dbError,
          );
        }

        // Fallback to mock user data
        const mockUser = {
          id: userId,
          email: userEmail,
          name: userEmail.split("@")[0],
          role: userRole,
          student_id: "S67890",
          department: "Computer Science",
          image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
        };

        console.log("StudentDashboard: Using mock user:", mockUser);
        setUser(mockUser);
        loadEnrolledData(mockUser.id);
      } catch (error) {
        console.error("StudentDashboard: Error checking auth:", error);
        setLoading(false);
        navigate("/");
      }
    };

    checkAuth();
  }, [navigate]);

  const loadEnrolledData = async (studentId: string) => {
    try {
      setLoading(true);

      // Load enrolled subjects
      const { data: subjectData, error: subjectError } = await supabase
        .from("student_subject_registrations")
        .select(
          `
          *,
          subjects!student_subject_registrations_subject_id_fkey(
            *,
            users!subjects_teacher_id_fkey(name, teacher_id),
            slot_assignments!inner(
              slots(
                slot_code,
                day_of_week,
                start_time,
                end_time
              )
            )
          )
        `,
        )
        .eq("student_id", studentId)
        .eq("is_active", true);

      if (subjectError) {
        console.error("Error loading enrolled subjects:", subjectError);
      } else {
        const dayNames = {
          1: "Monday",
          2: "Tuesday",
          3: "Wednesday",
          4: "Thursday",
          5: "Friday",
        };

        const processedSubjects = (subjectData || []).map((registration) => {
          const subject = registration.subjects;
          const slotInfo = subject?.slot_assignments?.[0]?.slots;

          return {
            ...subject,
            teacher: subject?.users,
            slot_info: slotInfo
              ? {
                  slot_code: slotInfo.slot_code,
                  day_name:
                    dayNames[slotInfo.day_of_week as keyof typeof dayNames] ||
                    "Unknown",
                  start_time: slotInfo.start_time,
                  end_time: slotInfo.end_time,
                }
              : null,
          };
        });

        setEnrolledSubjects(processedSubjects);
      }

      // Load enrolled temporary classes/events
      const { data: eventData, error: eventError } = await supabase
        .from("temporary_class_registrations")
        .select(
          `
          *,
          temporary_classes!temporary_class_registrations_temporary_class_id_fkey(
            *,
            users!temporary_classes_teacher_id_fkey(name, teacher_id)
          )
        `,
        )
        .eq("student_id", studentId)
        .eq("approval_status", "approved");

      if (eventError) {
        console.error("Error loading enrolled events:", eventError);
      } else {
        const processedEvents = (eventData || []).map((registration) => ({
          ...registration.temporary_classes,
          teacher: registration.temporary_classes?.users,
        }));

        setEnrolledEvents(processedEvents);
      }
    } catch (error) {
      console.error("Error loading enrolled data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanClick = () => {
    setShowScanner(true);
  };

  const handleCloseScanner = () => {
    setShowScanner(false);
  };

  const handleRegistrationComplete = () => {
    // Reload enrolled data after registration
    if (user) {
      loadEnrolledData(user.id);
      setActiveTab("classes");
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader
        studentName={user.name}
        studentId={user.student_id}
        avatarUrl={user.image_url}
      />

      <main className="container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <Button onClick={handleScanClick} className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Scan Attendance QR
          </Button>
        </div>

        {showScanner && (
          <QrScanner
            open={showScanner}
            onClose={handleCloseScanner}
            studentId={user.id}
          />
        )}

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4 h-14">
            <TabsTrigger value="profile" className="space-x-2">
              <User className="h-4 w-4" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>My Classes</span>
            </TabsTrigger>
            <TabsTrigger value="registration" className="space-x-2">
              <CalendarDays className="h-4 w-4" />
              <span>Registration</span>
            </TabsTrigger>
            <TabsTrigger value="scanner" className="space-x-2">
              <QrCode className="h-4 w-4" />
              <span>QR Scanner</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Student Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={user.image_url} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || "S"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-muted-foreground">
                      Student ID: {user.student_id}
                    </p>
                    <p className="text-muted-foreground">Email: {user.email}</p>
                    <p className="text-muted-foreground">
                      Department: {user.department}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {enrolledSubjects.length}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Enrolled Subjects
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-primary">
                          {enrolledEvents.length}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Registered Events
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="classes" className="space-y-6">
            <div className="space-y-6">
              {/* Enrolled Subjects */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2" />
                    My Enrolled Subjects
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <p>Loading your subjects...</p>
                  ) : enrolledSubjects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>You are not enrolled in any subjects yet.</p>
                      <p className="text-sm mt-2">
                        Go to the Registration tab to enroll in subjects.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {enrolledSubjects.map((subject) => (
                        <Card
                          key={subject.id}
                          className="border-l-4 border-l-primary"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <CardTitle className="text-lg">
                                  {subject.course_code}
                                </CardTitle>
                                <CardDescription>
                                  {subject.subject_name}
                                </CardDescription>
                              </div>
                              <Badge
                                variant={
                                  subject.subject_type === "lab"
                                    ? "secondary"
                                    : "default"
                                }
                              >
                                {subject.subject_type}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={subject.teacher?.image_url} />
                                <AvatarFallback>
                                  {subject.teacher?.name?.charAt(0) || "T"}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium">
                                  {subject.teacher?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {subject.teacher?.teacher_id}
                                </p>
                              </div>
                            </div>

                            {subject.slot_info && (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="h-4 w-4" />
                                  <span>{subject.slot_info.day_name}</span>
                                  <span>
                                    {subject.slot_info.start_time} -{" "}
                                    {subject.slot_info.end_time}
                                  </span>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  Slot {subject.slot_info.slot_code}
                                </Badge>
                              </div>
                            )}

                            <div className="text-sm text-muted-foreground">
                              Credits: {subject.credits}
                            </div>
                          </CardContent>
                          <CardFooter>
                            <Button
                              variant="outline"
                              onClick={handleScanClick}
                              className="w-full"
                            >
                              <QrCode className="h-4 w-4 mr-2" />
                              Mark Attendance
                            </Button>
                          </CardFooter>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Enrolled Events */}
              {enrolledEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CalendarDays className="h-5 w-5 mr-2" />
                      My Registered Events
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {enrolledEvents.map((event) => (
                        <Card
                          key={event.id}
                          className="border-l-4 border-l-secondary"
                        >
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium">{event.title}</h4>
                                {event.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {event.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>
                                      {formatDateTime(event.start_datetime)}
                                    </span>
                                  </div>
                                  {event.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      <span>{event.location}</span>
                                    </div>
                                  )}
                                </div>
                                {event.teacher && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarImage
                                        src={event.teacher.image_url}
                                      />
                                      <AvatarFallback>
                                        {event.teacher.name?.charAt(0) || "T"}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">
                                      {event.teacher.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                {event.attendance_credit && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Credit
                                  </Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={handleScanClick}
                                >
                                  <QrCode className="h-4 w-4 mr-1" />
                                  Attend
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="registration">
            <CourseRegistration
              onRegistrationComplete={handleRegistrationComplete}
            />
          </TabsContent>

          <TabsContent value="scanner">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <QrCode className="h-5 w-5 mr-2" />
                  QR Code Scanner
                </CardTitle>
                <CardDescription>
                  Scan QR codes to mark your attendance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Button onClick={handleScanClick} size="lg">
                    <QrCode className="h-5 w-5 mr-2" />
                    Open QR Scanner
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export { StudentDashboard };
export default StudentDashboard;
