import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrScanner } from "@/components/student/QrScanner";
import { StudentHeader } from "@/components/student/StudentHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, QrCode, History, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";

const StudentDashboard = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadStudentData();
  }, []);

  const loadStudentData = async () => {
    // Load enrolled classes
    const { data: enrollments } = await supabase.from("class_enrollments")
      .select(`
        classes (id, title, start_time, end_time, room)
      `);

    if (enrollments) {
      setCourses(
        enrollments.map((e) => ({
          name: e.classes.title,
          code: e.classes.id,
          schedule: `${e.classes.start_time} - ${e.classes.end_time}`,
          attendance: "85%", // TODO: Calculate from attendance records
        })),
      );
    }

    // Load attendance history
    const { data: history } = await supabase
      .from("attendance_records")
      .select(
        `
        *,
        classes (title)
      `,
      )
      .order("created_at", { ascending: false });

    if (history) {
      setAttendanceHistory(
        history.map((h) => ({
          class: h.classes.title,
          date: new Date(h.created_at).toLocaleDateString(),
          time: new Date(h.created_at).toLocaleTimeString(),
          status: h.status,
        })),
      );
    }
  };

  const handleQRSuccess = async (data: string) => {
    try {
      const qrData = JSON.parse(data);

      // Record attendance
      const { error } = await supabase.from("attendance_records").insert({
        class_id: qrData.classId,
        student_id: "current_user_id", // TODO: Get from auth context
        status: "present",
        location_lat: qrData.location?.lat,
        location_lng: qrData.location?.lng,
      });

      if (error) throw error;

      // Reload data
      loadStudentData();
      setShowScanner(false);
    } catch (err) {
      console.error("Error recording attendance:", err);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <StudentHeader />

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 h-14">
            <TabsTrigger value="dashboard" className="space-x-2">
              <QrCode className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="courses" className="space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Courses</span>
            </TabsTrigger>
            <TabsTrigger value="calendar" className="space-x-2">
              <CalendarDays className="h-4 w-4" />
              <span>Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="space-x-2">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
              <Button
                size="lg"
                onClick={() => setShowScanner(true)}
                className="w-full md:w-auto"
              >
                Scan Attendance QR Code
              </Button>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Today's Schedule</h2>
              <div className="space-y-4">
                {courses.map((course, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-4 bg-muted rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{course.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {course.schedule}
                      </p>
                    </div>
                    <Badge variant="secondary">{course.code}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="courses" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">My Courses</h2>
              <div className="space-y-4">
                {courses.map((course, index) => (
                  <div
                    key={index}
                    className="p-4 bg-muted rounded-lg space-y-2"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{course.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {course.schedule}
                        </p>
                      </div>
                      <Badge>{course.code}</Badge>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-sm">Attendance Rate</span>
                      <Badge
                        variant={
                          parseInt(course.attendance) >= 80
                            ? "default"
                            : "destructive"
                        }
                      >
                        {course.attendance}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Attendance Calendar</h2>
              <div className="flex flex-col md:flex-row gap-6">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
                <Card className="flex-1 p-4">
                  <h3 className="font-medium mb-2">
                    {date?.toLocaleDateString(undefined, {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <div className="space-y-2">
                    {courses.map((course, index) => (
                      <div
                        key={index}
                        className="p-2 bg-muted rounded-lg flex justify-between items-center"
                      >
                        <span className="text-sm">{course.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {course.schedule}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-4">Attendance History</h2>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4">
                  {attendanceHistory.map((record, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-4 bg-muted rounded-lg"
                    >
                      <div>
                        <h3 className="font-medium">{record.class}</h3>
                        <p className="text-sm text-muted-foreground">
                          {record.date} at {record.time}
                        </p>
                      </div>
                      <Badge
                        variant={
                          record.status === "present"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {record.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <QrScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onSuccess={handleQRSuccess}
      />
    </div>
  );
};

export default StudentDashboard;
