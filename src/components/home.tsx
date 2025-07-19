import React, { useState, useEffect } from "react";
import TeacherHeader from "./dashboard/TeacherHeader";
import PersonalInfoCard from "./dashboard/PersonalInfoCard";
import ClassScheduleGrid from "./dashboard/ClassScheduleGrid";
import AttendanceMonitor from "./dashboard/AttendanceMonitor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalStudents, setTotalStudents] = useState(0);

  // For capacity update dialog
  const [isCapacityDialogOpen, setIsCapacityDialogOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [newCapacity, setNewCapacity] = useState(60);

  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        console.log("TeacherDashboard: Loading teacher data...");
        // Get user info from localStorage
        const userId = localStorage.getItem("userId");
        const userEmail = localStorage.getItem("userEmail");
        const userRole = localStorage.getItem("userRole");

        console.log("TeacherDashboard: Auth data:", {
          userId,
          userEmail,
          userRole,
        });

        if (!userId || !userEmail || userRole !== "teacher") {
          console.log(
            "TeacherDashboard: Invalid auth data, redirecting to login",
          );
          navigate("/");
          return;
        }

        let teacherData = null;

        // Try to get user details from database first
        try {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

          if (!userError && userData) {
            console.log("TeacherDashboard: Database user found:", userData);
            teacherData = userData;
          } else {
            console.log(
              "TeacherDashboard: Database user not found, using mock data",
            );
          }
        } catch (dbError) {
          console.log(
            "TeacherDashboard: Database error, using mock data:",
            dbError,
          );
        }

        // Fallback to mock user data if database fails
        if (!teacherData) {
          teacherData = {
            id: userId,
            email: userEmail,
            name: "Dr. " + userEmail.split("@")[0],
            role: userRole,
            teacher_id: "T123456",
            department: "Computer Science",
            phone: "+1 (555) 123-4567",
            image_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`,
          };
          console.log("TeacherDashboard: Using mock teacher:", teacherData);
        }

        setTeacher(teacherData);

        // Load teacher's subjects from the new timetable system
        const { data: teacherSubjects, error: subjectsError } = await supabase
          .from("subjects")
          .select(
            `
            *,
            slot_assignments!inner(
              slots(
                slot_code,
                day_of_week,
                start_time,
                end_time
              )
            )
          `,
          )
          .eq("teacher_id", userData.id)
          .eq("is_active", true)
          .eq("slot_assignments.is_active", true);

        if (subjectsError) {
          console.error("Error fetching teacher subjects:", subjectsError);
          setSubjects([]);
        } else {
          // Get enrollment counts for each subject
          let totalEnrolledStudents = 0;
          const subjectsWithEnrollment = await Promise.all(
            (teacherSubjects || []).map(async (subject) => {
              const { count } = await supabase
                .from("student_subject_registrations")
                .select("*", { count: "exact", head: true })
                .eq("subject_id", subject.id)
                .eq("is_active", true);

              const enrollmentCount = count || 0;
              totalEnrolledStudents += enrollmentCount;

              // Get day name
              const dayNames = {
                1: "Monday",
                2: "Tuesday",
                3: "Wednesday",
                4: "Thursday",
                5: "Friday",
              };

              const slotInfo = subject.slot_assignments?.[0]?.slots;

              return {
                id: subject.id,
                title: `${subject.course_code} - ${subject.subject_name}`,
                time: slotInfo
                  ? `${slotInfo.start_time} - ${slotInfo.end_time}`
                  : "Not scheduled",
                start_time: slotInfo?.start_time,
                end_time: slotInfo?.end_time,
                room: "TBA", // Room info would need to be added to the schema
                studentCount: enrollmentCount,
                capacity: subject.student_limit || 60,
                isActive: true, // Could be determined by current time vs slot time
                subject_type: subject.subject_type,
                credits: subject.credits,
                slot_info: slotInfo
                  ? {
                      slot_code: slotInfo.slot_code,
                      day_name:
                        dayNames[
                          slotInfo.day_of_week as keyof typeof dayNames
                        ] || "Unknown",
                      start_time: slotInfo.start_time,
                      end_time: slotInfo.end_time,
                    }
                  : null,
              };
            }),
          );

          setSubjects(subjectsWithEnrollment);
          setTotalStudents(totalEnrolledStudents);
        }

        // Load attendance data for the first active subject (if any)
        const activeSubject = teacherSubjects?.[0];
        if (activeSubject) {
          const { data: attendance } = await supabase
            .from("attendance_records")
            .select(
              "*, users!attendance_records_student_id_fkey(name, image_url)",
            )
            .eq("subject_id", activeSubject.id);

          setAttendanceData(attendance || []);
        }
      } catch (error) {
        console.error("Error loading teacher data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, [navigate]);

  const handleUpdateCapacity = (subjectId: string) => {
    const subjectToUpdate = subjects.find(
      (subject) => subject.id === subjectId,
    );
    if (subjectToUpdate) {
      setSelectedSubject(subjectToUpdate);
      setNewCapacity(subjectToUpdate.capacity || 60);
      setIsCapacityDialogOpen(true);
    }
  };

  const saveCapacity = async () => {
    if (!selectedSubject || !newCapacity) return;

    try {
      // Update subject capacity in the new timetable system
      const { error } = await supabase
        .from("subjects")
        .update({ student_limit: newCapacity })
        .eq("id", selectedSubject.id);

      if (error) throw error;

      // Update local state
      setSubjects(
        subjects.map((subject) =>
          subject.id === selectedSubject.id
            ? { ...subject, capacity: newCapacity }
            : subject,
        ),
      );

      setIsCapacityDialogOpen(false);
    } catch (error) {
      console.error("Error updating subject capacity:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <TeacherHeader
        teacherName={teacher?.name || "Dr. Sarah Johnson"}
        teacherId={teacher?.teacher_id || "T123456"}
        department={teacher?.department || "Computer Science"}
        avatarUrl={
          teacher?.image_url ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher?.id || "teacher1"}`
        }
      />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Personal Info and Attendance Monitor */}
          <div className="flex flex-col gap-6">
            <PersonalInfoCard
              teacherName={teacher?.name || "Dr. Sarah Johnson"}
              teacherId={teacher?.teacher_id || "T123456"}
              department={teacher?.department || "Computer Science"}
              email={teacher?.email || "sarah.johnson@university.edu"}
              phone={teacher?.phone || "+1 (555) 123-4567"}
              avatarUrl={
                teacher?.image_url ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher?.id || "teacher1"}`
              }
              totalClasses={subjects.length}
              totalStudents={totalStudents}
            />
            <AttendanceMonitor
              sessionId={
                subjects.length > 0
                  ? "00000000-0000-0000-0000-000000000031"
                  : undefined
              }
              students={attendanceData.map((record) => ({
                id: record.student_id,
                name: record.users?.name || "Unknown Student",
                status: record.status,
                timestamp: new Date(record.created_at).toLocaleTimeString(),
              }))}
            />
          </div>

          {/* Right Column - Subject Schedule Grid */}
          <div className="flex-1">
            <ClassScheduleGrid
              classes={subjects}
              onUpdateCapacity={handleUpdateCapacity}
            />
          </div>
        </div>
      </main>

      {/* Subject Capacity Update Dialog */}
      <Dialog
        open={isCapacityDialogOpen}
        onOpenChange={setIsCapacityDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Subject Capacity</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject-name">Subject</Label>
              <Input
                id="subject-name"
                value={selectedSubject?.title || ""}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="current-enrollment">Current Enrollment</Label>
              <Input
                id="current-enrollment"
                value={`${selectedSubject?.studentCount || 0} students`}
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Maximum Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min={selectedSubject?.studentCount || 0}
                max={200}
                value={newCapacity}
                onChange={(e) => setNewCapacity(parseInt(e.target.value))}
              />
              {selectedSubject &&
                newCapacity < selectedSubject.studentCount && (
                  <p className="text-sm text-destructive">
                    Capacity cannot be less than current enrollment (
                    {selectedSubject.studentCount})
                  </p>
                )}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCapacityDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveCapacity}
              disabled={
                selectedSubject &&
                (newCapacity < selectedSubject.studentCount ||
                  newCapacity > 200)
              }
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDashboard;
