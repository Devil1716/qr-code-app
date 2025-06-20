import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { recordAttendance, getClassStudents } from "@/lib/api/attendance-api";

interface ManualAttendanceDialogProps {
  open: boolean;
  onClose: () => void;
  classId: string;
}

export function ManualAttendanceDialog({
  open,
  onClose,
  classId,
}: ManualAttendanceDialogProps) {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [error, setError] = useState("");

  const searchStudents = async (query: string) => {
    try {
      // First try to get students enrolled in this class
      const enrolledStudents = await getClassStudents(classId);

      if (enrolledStudents.length > 0) {
        // Filter enrolled students by name
        const filteredStudents = enrolledStudents.filter((student) =>
          student.name.toLowerCase().includes(query.toLowerCase()),
        );
        setStudents(filteredStudents);
        return;
      }

      // Fallback to searching all students
      const { data } = await supabase
        .from("users")
        .select("*")
        .eq("role", "student")
        .ilike("name", `%${query}%`);

      setStudents(data || []);
    } catch (error) {
      console.error("Error searching students:", error);
      setStudents([]);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.length >= 2) {
      searchStudents(value);
    }
  };

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId],
    );
  };

  const markAttendance = async () => {
    try {
      // Mark each student as present
      for (const studentId of selectedStudents) {
        await recordAttendance({
          classId,
          studentId,
          status: "present",
          isManual: true,
          markedBy: "current_user_id", // TODO: Get from auth context
        });
      }

      onClose();
    } catch (error) {
      console.error("Error marking attendance:", error);
      setError("Failed to mark attendance. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manual Attendance Entry</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Search Students</Label>
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Type student name..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <ScrollArea className="h-[300px] rounded-md border p-2">
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.id}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                    selectedStudents.includes(student.id)
                      ? "bg-primary/10"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => toggleStudent(student.id)}
                >
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.student_id}
                    </p>
                  </div>
                  {selectedStudents.includes(student.id) && (
                    <Badge variant="secondary">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Selected
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              {selectedStudents.length} students selected
            </p>
            <Button
              onClick={markAttendance}
              disabled={selectedStudents.length === 0}
            >
              Mark Present
            </Button>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
