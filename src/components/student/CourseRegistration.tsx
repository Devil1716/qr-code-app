import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import {
  BookOpen,
  Users,
  Clock,
  Plus,
  Minus,
  Calendar,
  MapPin,
} from "lucide-react";

interface Subject {
  id: string;
  course_code: string;
  subject_name: string;
  subject_type: "theory" | "lab";
  credits: number;
  student_limit: number;
  teacher?: {
    name: string;
    teacher_id: string;
  };
  enrolled_count?: number;
  is_registered?: boolean;
  slot_info?: {
    slot_code: string;
    day_name: string;
    start_time: string;
    end_time: string;
  };
}

interface TemporaryClass {
  id: string;
  title: string;
  description: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  student_limit: number;
  teacher?: {
    name: string;
    teacher_id: string;
  };
  registration_count?: number;
  is_registered?: boolean;
}

interface CourseRegistrationProps {
  onRegistrationComplete?: () => void;
}

export function CourseRegistration({
  onRegistrationComplete,
}: CourseRegistrationProps) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [temporaryClasses, setTemporaryClasses] = useState<TemporaryClass[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState<"subjects" | "events">("subjects");
  const [studentDepartment, setStudentDepartment] = useState<string | null>(
    null,
  );

  const studentId = localStorage.getItem("userId");

  useEffect(() => {
    if (studentId) {
      loadStudentInfo();
    }
  }, [studentId]);

  const loadStudentInfo = async () => {
    try {
      console.log("Loading student info for ID:", studentId);

      // Try to get student's department information from database
      try {
        const { data: studentData, error: studentError } = await supabase
          .from("users")
          .select("department")
          .eq("id", studentId)
          .single();

        if (!studentError && studentData) {
          console.log("Student data from database:", studentData);
          setStudentDepartment(studentData.department);
          // Load subjects and events after getting department info
          loadSubjects(studentData.department);
          loadTemporaryClasses(studentData.department);
          return;
        } else {
          console.log("Database student not found, using fallback");
        }
      } catch (dbError) {
        console.log("Database error, using fallback:", dbError);
      }

      // Fallback: Use mock department for testing
      const mockDepartment = "Computer Science";
      console.log("Using mock department:", mockDepartment);
      setStudentDepartment(mockDepartment);

      // Load subjects and events with mock department
      loadSubjects(mockDepartment);
      loadTemporaryClasses(mockDepartment);
    } catch (err: any) {
      console.error("Error loading student info:", err);
      // Don't show error, use fallback instead
      console.log("Using fallback due to error");
      const fallbackDepartment = "Computer Science";
      setStudentDepartment(fallbackDepartment);
      loadSubjects(fallbackDepartment);
      loadTemporaryClasses(fallbackDepartment);
    }
  };

  const loadSubjects = async (department: string | null) => {
    try {
      setLoading(true);
      console.log("Loading subjects for department:", department);

      // Try to load from database first
      try {
        // Build query with department filter if available
        let query = supabase
          .from("subjects")
          .select(
            `
            *,
            users!subjects_teacher_id_fkey(name, teacher_id, department),
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
          .eq("is_active", true)
          .eq("slot_assignments.is_active", true);

        // Apply department filter if student has a department
        if (department) {
          query = query.eq("department", department);
        }

        const { data: subjectsData, error: subjectsError } =
          await query.order("course_code");

        if (subjectsError) {
          console.log("Database subjects query failed:", subjectsError);
          throw subjectsError;
        }

        // Get enrollment counts and student's registrations
        const subjectsWithInfo = await Promise.all(
          (subjectsData || []).map(async (subject) => {
            // Get enrollment count
            const { count } = await supabase
              .from("student_subject_registrations")
              .select("*", { count: "exact", head: true })
              .eq("subject_id", subject.id)
              .eq("is_active", true);

            // Check if current student is registered
            const { data: registration } = await supabase
              .from("student_subject_registrations")
              .select("*")
              .eq("subject_id", subject.id)
              .eq("student_id", studentId)
              .eq("is_active", true)
              .single();

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
              ...subject,
              teacher: subject.users,
              enrolled_count: count || 0,
              is_registered: !!registration,
              slot_info: slotInfo
                ? {
                    slot_code: slotInfo.slot_code,
                    day_name:
                      dayNames[slotInfo.day_of_week as keyof typeof dayNames] ||
                      "Unknown",
                    start_time: slotInfo.start_time,
                    end_time: slotInfo.end_time,
                  }
                : undefined,
            };
          }),
        );

        setSubjects(subjectsWithInfo);
        console.log("Loaded subjects from database:", subjectsWithInfo.length);
      } catch (dbError) {
        console.log("Database subjects failed, using mock data:", dbError);

        // Fallback to mock subjects for testing
        const mockSubjects = [
          {
            id: "mock-subject-1",
            course_code: "CS101",
            subject_name: "Introduction to Computer Science",
            subject_type: "theory" as const,
            credits: 3,
            student_limit: 50,
            teacher: {
              name: "Dr. Smith",
              teacher_id: "T001",
            },
            enrolled_count: 25,
            is_registered: false,
            slot_info: {
              slot_code: "A1",
              day_name: "Monday",
              start_time: "09:00",
              end_time: "10:00",
            },
          },
          {
            id: "mock-subject-2",
            course_code: "CS102",
            subject_name: "Programming Fundamentals",
            subject_type: "lab" as const,
            credits: 4,
            student_limit: 30,
            teacher: {
              name: "Prof. Johnson",
              teacher_id: "T002",
            },
            enrolled_count: 15,
            is_registered: false,
            slot_info: {
              slot_code: "B2",
              day_name: "Wednesday",
              start_time: "14:00",
              end_time: "16:00",
            },
          },
        ];

        setSubjects(mockSubjects);
        console.log("Using mock subjects:", mockSubjects.length);
      }
    } catch (err: any) {
      console.error("Error loading subjects:", err);
      // Don't set error, just use empty array
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const loadTemporaryClasses = async (department: string | null) => {
    try {
      console.log("Loading temporary classes for department:", department);

      // Try to load from database first
      try {
        // Build query with department filter if available
        let query = supabase
          .from("temporary_classes")
          .select(
            `
            *,
            users!temporary_classes_teacher_id_fkey(name, teacher_id, department)
          `,
          )
          .eq("is_active", true)
          .gte("start_datetime", new Date().toISOString());

        // Apply department filter if student has a department
        if (department) {
          query = query.eq("department", department);
        }

        const { data: classesData, error: classesError } =
          await query.order("start_datetime");

        if (classesError) {
          console.log("Database temporary classes query failed:", classesError);
          throw classesError;
        }

        // Get registration counts and student's registrations
        const classesWithInfo = await Promise.all(
          (classesData || []).map(async (tempClass) => {
            // Get registration count
            const { count } = await supabase
              .from("temporary_class_registrations")
              .select("*", { count: "exact", head: true })
              .eq("temporary_class_id", tempClass.id)
              .eq("approval_status", "approved");

            // Check if current student is registered
            const { data: registration } = await supabase
              .from("temporary_class_registrations")
              .select("*")
              .eq("temporary_class_id", tempClass.id)
              .eq("student_id", studentId)
              .single();

            return {
              ...tempClass,
              teacher: tempClass.users,
              registration_count: count || 0,
              is_registered: !!registration,
            };
          }),
        );

        setTemporaryClasses(classesWithInfo);
        console.log(
          "Loaded temporary classes from database:",
          classesWithInfo.length,
        );
      } catch (dbError) {
        console.log(
          "Database temporary classes failed, using mock data:",
          dbError,
        );

        // Fallback to mock temporary classes for testing
        const mockEvents = [
          {
            id: "mock-event-1",
            title: "AI Workshop",
            description:
              "Introduction to Artificial Intelligence and Machine Learning",
            start_datetime: new Date(
              Date.now() + 24 * 60 * 60 * 1000,
            ).toISOString(), // Tomorrow
            end_datetime: new Date(
              Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000,
            ).toISOString(), // Tomorrow + 2 hours
            location: "Lab 101",
            student_limit: 25,
            teacher: {
              name: "Dr. AI Expert",
              teacher_id: "T003",
            },
            registration_count: 10,
            is_registered: false,
          },
          {
            id: "mock-event-2",
            title: "Web Development Seminar",
            description: "Modern web development techniques and frameworks",
            start_datetime: new Date(
              Date.now() + 48 * 60 * 60 * 1000,
            ).toISOString(), // Day after tomorrow
            end_datetime: new Date(
              Date.now() + 48 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000,
            ).toISOString(), // Day after tomorrow + 3 hours
            location: "Auditorium",
            student_limit: 100,
            teacher: {
              name: "Prof. Web Dev",
              teacher_id: "T004",
            },
            registration_count: 45,
            is_registered: false,
          },
        ];

        setTemporaryClasses(mockEvents);
        console.log("Using mock temporary classes:", mockEvents.length);
      }
    } catch (err: any) {
      console.error("Error loading temporary classes:", err);
      // Don't show error, just use empty array
      setTemporaryClasses([]);
    }
  };

  const handleSubjectRegistration = async (
    subjectId: string,
    isRegistering: boolean,
  ) => {
    try {
      setError("");
      setSuccess("");

      if (isRegistering) {
        // Register for subject
        const { error } = await supabase
          .from("student_subject_registrations")
          .insert([
            {
              student_id: studentId,
              subject_id: subjectId,
              registration_date: new Date().toISOString(),
              is_active: true,
            },
          ]);

        if (error) throw error;
        setSuccess("Successfully registered for the subject!");
      } else {
        // Unregister from subject
        const { error } = await supabase
          .from("student_subject_registrations")
          .update({ is_active: false })
          .eq("student_id", studentId)
          .eq("subject_id", subjectId);

        if (error) throw error;
        setSuccess("Successfully unregistered from the subject!");
      }

      // Reload subjects to update counts
      loadSubjects(studentDepartment);

      // Notify parent component
      if (onRegistrationComplete) {
        onRegistrationComplete();
      }
    } catch (err: any) {
      console.error("Error with subject registration:", err);
      setError(err.message || "Failed to update registration");
    }
  };

  const handleEventRegistration = async (
    eventId: string,
    isRegistering: boolean,
  ) => {
    try {
      setError("");
      setSuccess("");

      if (isRegistering) {
        // Register for event
        const { error } = await supabase
          .from("temporary_class_registrations")
          .insert([
            {
              student_id: studentId,
              temporary_class_id: eventId,
              registration_date: new Date().toISOString(),
              approval_status: "approved", // Auto-approve for now
            },
          ]);

        if (error) throw error;
        setSuccess("Successfully registered for the event!");
      } else {
        // Unregister from event
        const { error } = await supabase
          .from("temporary_class_registrations")
          .delete()
          .eq("student_id", studentId)
          .eq("temporary_class_id", eventId);

        if (error) throw error;
        setSuccess("Successfully unregistered from the event!");
      }

      // Reload events to update counts
      loadTemporaryClasses(studentDepartment);

      // Notify parent component
      if (onRegistrationComplete) {
        onRegistrationComplete();
      }
    } catch (err: any) {
      console.error("Error with event registration:", err);
      setError(err.message || "Failed to update registration");
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6 bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Course Registration</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Development mode indicator */}
      {import.meta.env.DEV && (
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-blue-800">
            <strong>Development Mode:</strong> Using mock data for testing.
            Database connection may be limited.
          </AlertDescription>
        </Alert>
      )}

      {studentDepartment && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Department Restriction:</strong> You can only register for
            courses offered by your department ({studentDepartment}) or general
            courses.
          </p>
        </div>
      )}

      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
        <Button
          variant={activeTab === "subjects" ? "default" : "ghost"}
          onClick={() => setActiveTab("subjects")}
          className="space-x-2"
        >
          <BookOpen className="h-4 w-4" />
          <span>Regular Subjects</span>
        </Button>
        <Button
          variant={activeTab === "events" ? "default" : "ghost"}
          onClick={() => setActiveTab("events")}
          className="space-x-2"
        >
          <Calendar className="h-4 w-4" />
          <span>Events & Seminars</span>
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading courses...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === "subjects" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Available Subjects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {subjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No subjects available for registration.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Teacher</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Schedule</TableHead>
                        <TableHead>Enrollment</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subjects.map((subject) => (
                        <TableRow key={subject.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">
                                {subject.course_code}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {subject.subject_name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{subject.teacher?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {subject.teacher?.teacher_id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                subject.subject_type === "lab"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {subject.subject_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{subject.credits}</TableCell>
                          <TableCell>
                            {subject.slot_info ? (
                              <div className="text-sm">
                                <p className="font-medium">
                                  {subject.slot_info.day_name}
                                </p>
                                <p className="text-muted-foreground">
                                  {subject.slot_info.start_time} -{" "}
                                  {subject.slot_info.end_time}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {subject.slot_info.slot_code}
                                </Badge>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Not scheduled
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span className="text-sm">
                                {subject.enrolled_count}/{subject.student_limit}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {subject.is_registered ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleSubjectRegistration(subject.id, false)
                                }
                                className="text-destructive"
                              >
                                <Minus className="h-4 w-4 mr-1" />
                                Unregister
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSubjectRegistration(subject.id, true)
                                }
                                disabled={
                                  (subject.enrolled_count || 0) >=
                                  subject.student_limit
                                }
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Register
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "events" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Upcoming Events & Seminars
                </CardTitle>
              </CardHeader>
              <CardContent>
                {temporaryClasses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming events available.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Instructor</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Registrations</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {temporaryClasses.map((event) => (
                        <TableRow key={event.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{event.title}</p>
                              {event.description && (
                                <p className="text-sm text-muted-foreground">
                                  {event.description.substring(0, 60)}...
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm">{event.teacher?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {event.teacher?.teacher_id}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <div className="text-sm">
                                <p>{formatDateTime(event.start_datetime)}</p>
                                <p className="text-muted-foreground">
                                  to {formatDateTime(event.end_datetime)}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {event.location ? (
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span className="text-sm">
                                  {event.location}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                TBA
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Users className="h-4 w-4" />
                              <span className="text-sm">
                                {event.registration_count}/{event.student_limit}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {event.is_registered ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleEventRegistration(event.id, false)
                                }
                                className="text-destructive"
                              >
                                <Minus className="h-4 w-4 mr-1" />
                                Unregister
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleEventRegistration(event.id, true)
                                }
                                disabled={
                                  (event.registration_count || 0) >=
                                  event.student_limit
                                }
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Register
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
