import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { Calendar, Clock, Users, BookOpen, User, Download } from "lucide-react";

interface TimetableEntry {
  student_id?: string;
  teacher_id?: string;
  student_name?: string;
  teacher_name?: string;
  subject_id: string;
  course_code: string;
  subject_name: string;
  subject_type: "theory" | "lab";
  credits: number;
  slot_code: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  day_name: string;
  enrolled_students?: number;
  student_limit?: number;
}

interface User {
  id: string;
  name: string;
  role: string;
  student_id?: string;
  teacher_id?: string;
}

const DAYS = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

const TIME_SLOTS = [
  "09:00",
  "09:55",
  "10:50",
  "11:45",
  "13:15",
  "14:10",
  "15:05",
  "16:00",
];

export function TimetableView() {
  const [viewType, setViewType] = useState<"student" | "teacher">("student");
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [users, setUsers] = useState<User[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [viewType]);

  useEffect(() => {
    if (selectedUser) {
      loadTimetable();
    } else {
      setTimetable([]);
    }
  }, [selectedUser, viewType]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, role, student_id, teacher_id")
        .eq("role", viewType)
        .order("name");

      if (error) throw error;
      setUsers(data || []);
      setSelectedUser(""); // Reset selection when view type changes
    } catch (err: any) {
      console.error("Error loading users:", err);
    }
  };

  const loadTimetable = async () => {
    try {
      setLoading(true);

      if (viewType === "student") {
        const { data, error } = await supabase
          .from("student_timetables")
          .select("*")
          .eq("student_id", selectedUser);

        if (error) throw error;
        setTimetable(data || []);
      } else {
        const { data, error } = await supabase
          .from("teacher_timetables")
          .select("*")
          .eq("teacher_id", selectedUser);

        if (error) throw error;
        setTimetable(data || []);
      }
    } catch (err: any) {
      console.error("Error loading timetable:", err);
    } finally {
      setLoading(false);
    }
  };

  // Group timetable entries by day and time
  const groupTimetableByDayAndTime = () => {
    const grouped: { [day: number]: { [time: string]: TimetableEntry[] } } = {};

    timetable.forEach((entry) => {
      if (!grouped[entry.day_of_week]) {
        grouped[entry.day_of_week] = {};
      }
      if (!grouped[entry.day_of_week][entry.start_time]) {
        grouped[entry.day_of_week][entry.start_time] = [];
      }
      grouped[entry.day_of_week][entry.start_time].push(entry);
    });

    return grouped;
  };

  const exportTimetable = () => {
    if (!selectedUser || timetable.length === 0) return;

    const selectedUserData = users.find((u) => u.id === selectedUser);
    const csvContent = [
      [
        "Day",
        "Time",
        "Subject Code",
        "Subject Name",
        "Type",
        "Credits",
        "Slot",
      ],
      ...timetable.map((entry) => [
        entry.day_name,
        `${entry.start_time} - ${entry.end_time}`,
        entry.course_code,
        entry.subject_name,
        entry.subject_type,
        entry.credits.toString(),
        entry.slot_code,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedUserData?.name}_timetable.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const groupedTimetable = groupTimetableByDayAndTime();
  const selectedUserData = users.find((u) => u.id === selectedUser);

  return (
    <div className="space-y-6 bg-white">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Timetable View</h2>
        {selectedUser && timetable.length > 0 && (
          <Button onClick={exportTimetable} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Controls */}
      <div className="flex gap-4 items-center">
        <div className="space-y-2">
          <label className="text-sm font-medium">View Type</label>
          <Select
            value={viewType}
            onValueChange={(value: "student" | "teacher") => setViewType(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="student">
                <div className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Student
                </div>
              </SelectItem>
              <SelectItem value="teacher">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Teacher
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 flex-1">
          <label className="text-sm font-medium">
            Select {viewType === "student" ? "Student" : "Teacher"}
          </label>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder={`Select a ${viewType}`} />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} (
                  {viewType === "student" ? user.student_id : user.teacher_id})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* User Info */}
      {selectedUserData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {viewType === "student" ? (
                <User className="h-5 w-5 mr-2" />
              ) : (
                <Users className="h-5 w-5 mr-2" />
              )}
              {selectedUserData.name}'s Timetable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>
                ID:{" "}
                {viewType === "student"
                  ? selectedUserData.student_id
                  : selectedUserData.teacher_id}
              </span>
              <span>Total Classes: {timetable.length}</span>
              {viewType === "student" && (
                <span>
                  Total Credits:{" "}
                  {timetable.reduce((sum, entry) => sum + entry.credits, 0)}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timetable Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p>Loading timetable...</p>
        </div>
      ) : selectedUser ? (
        <div className="space-y-4">
          {/* Weekly Grid View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Weekly Timetable
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted text-left font-medium">
                        Time
                      </th>
                      {[1, 2, 3, 4, 5].map((day) => (
                        <th
                          key={day}
                          className="border p-2 bg-muted text-center font-medium min-w-[150px]"
                        >
                          {DAYS[day as keyof typeof DAYS]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((timeSlot) => (
                      <tr key={timeSlot}>
                        <td className="border p-2 bg-muted/50 font-medium text-sm">
                          {timeSlot}
                        </td>
                        {[1, 2, 3, 4, 5].map((day) => {
                          const entries =
                            groupedTimetable[day]?.[timeSlot] || [];
                          return (
                            <td
                              key={`${day}-${timeSlot}`}
                              className="border p-1 align-top"
                            >
                              {entries.map((entry, index) => (
                                <div key={index} className="mb-1 last:mb-0">
                                  <div className="p-2 bg-primary/10 rounded text-xs">
                                    <div className="font-medium">
                                      {entry.course_code}
                                    </div>
                                    <div className="text-muted-foreground">
                                      {entry.subject_name.length > 20
                                        ? `${entry.subject_name.substring(0, 20)}...`
                                        : entry.subject_name}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <Badge
                                        variant={
                                          entry.subject_type === "lab"
                                            ? "secondary"
                                            : "default"
                                        }
                                        className="text-xs"
                                      >
                                        {entry.subject_type}
                                      </Badge>
                                      <span className="text-xs">
                                        {entry.slot_code}
                                      </span>
                                    </div>
                                    {viewType === "teacher" &&
                                      entry.enrolled_students !== undefined && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                          {entry.enrolled_students}/
                                          {entry.student_limit} students
                                        </div>
                                      )}
                                  </div>
                                </div>
                              ))}
                              {entries.length === 0 && (
                                <div className="p-2 text-center text-muted-foreground text-xs">
                                  Free
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Detailed List View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Detailed Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {timetable.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No classes scheduled for this {viewType}.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Day</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Credits</TableHead>
                      <TableHead>Slot</TableHead>
                      {viewType === "teacher" && (
                        <TableHead>Enrollment</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timetable
                      .sort((a, b) => {
                        if (a.day_of_week !== b.day_of_week) {
                          return a.day_of_week - b.day_of_week;
                        }
                        return a.start_time.localeCompare(b.start_time);
                      })
                      .map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {entry.day_name}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>
                                {entry.start_time} - {entry.end_time}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{entry.course_code}</p>
                              <p className="text-sm text-muted-foreground">
                                {entry.subject_name}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                entry.subject_type === "lab"
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {entry.subject_type}
                            </Badge>
                          </TableCell>
                          <TableCell>{entry.credits}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{entry.slot_code}</Badge>
                          </TableCell>
                          {viewType === "teacher" && (
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>
                                  {entry.enrolled_students || 0}/
                                  {entry.student_limit || 0}
                                </span>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Select a {viewType} to view their timetable
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
