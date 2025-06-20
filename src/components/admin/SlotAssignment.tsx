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
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Clock, Plus, Trash2, Calendar } from "lucide-react";

interface Subject {
  id: string;
  course_code: string;
  subject_name: string;
  subject_type: "theory" | "lab";
  teacher?: {
    name: string;
  };
}

interface Slot {
  id: string;
  slot_code: string;
  slot_type: "theory" | "lab";
  day_of_week: number;
  start_time: string;
  end_time: string;
  day_name: string;
}

interface SlotAssignment {
  id: string;
  subject_id: string;
  slot_id: string;
  subject: Subject;
  slot: Slot;
}

const DAYS = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

export function SlotAssignment() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [assignments, setAssignments] = useState<SlotAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    subject_id: "",
    slot_id: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadSubjects(), loadSlots(), loadAssignments()]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select(
          `
          *,
          users!subjects_teacher_id_fkey(name)
        `,
        )
        .eq("is_active", true)
        .order("course_code");

      if (error) throw error;
      setSubjects(data?.map((s) => ({ ...s, teacher: s.users })) || []);
    } catch (err: any) {
      console.error("Error loading subjects:", err);
    }
  };

  const loadSlots = async () => {
    try {
      const { data, error } = await supabase
        .from("slots")
        .select("*")
        .eq("is_active", true)
        .order(["day_of_week", "start_time"]);

      if (error) throw error;

      const slotsWithDayName = (data || []).map((slot) => ({
        ...slot,
        day_name: DAYS[slot.day_of_week as keyof typeof DAYS] || "Unknown",
      }));

      setSlots(slotsWithDayName);
    } catch (err: any) {
      console.error("Error loading slots:", err);
    }
  };

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from("slot_assignments")
        .select(
          `
          *,
          subjects!slot_assignments_subject_id_fkey(
            id,
            course_code,
            subject_name,
            subject_type,
            users!subjects_teacher_id_fkey(name)
          ),
          slots!slot_assignments_slot_id_fkey(*)
        `,
        )
        .eq("is_active", true);

      if (error) throw error;

      const assignmentsWithDayName = (data || []).map((assignment) => ({
        ...assignment,
        subject: {
          ...assignment.subjects,
          teacher: assignment.subjects?.users,
        },
        slot: {
          ...assignment.slots,
          day_name:
            DAYS[assignment.slots?.day_of_week as keyof typeof DAYS] ||
            "Unknown",
        },
      }));

      setAssignments(assignmentsWithDayName);
    } catch (err: any) {
      console.error("Error loading assignments:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      subject_id: "",
      slot_id: "",
    });
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Check for conflicts
      const selectedSubject = subjects.find(
        (s) => s.id === formData.subject_id,
      );
      const selectedSlot = slots.find((s) => s.id === formData.slot_id);

      if (!selectedSubject || !selectedSlot) {
        setError("Please select both subject and slot");
        return;
      }

      // Check if subject type matches slot type
      if (selectedSubject.subject_type !== selectedSlot.slot_type) {
        setError(
          `Subject type (${selectedSubject.subject_type}) doesn't match slot type (${selectedSlot.slot_type})`,
        );
        return;
      }

      // Check if slot is already assigned
      const existingAssignment = assignments.find(
        (a) => a.slot_id === formData.slot_id,
      );
      if (existingAssignment) {
        setError(
          `Slot ${selectedSlot.slot_code} is already assigned to ${existingAssignment.subject.course_code}`,
        );
        return;
      }

      // Check if subject is already assigned to a slot
      const subjectAssignment = assignments.find(
        (a) => a.subject_id === formData.subject_id,
      );
      if (subjectAssignment) {
        setError(
          `Subject ${selectedSubject.course_code} is already assigned to slot ${subjectAssignment.slot.slot_code}`,
        );
        return;
      }

      const { error } = await supabase
        .from("slot_assignments")
        .insert([formData]);

      if (error) throw error;

      setSuccess("Slot assigned successfully!");
      loadAssignments();
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Error assigning slot:", err);
      setError(err.message || "Failed to assign slot");
    }
  };

  const handleDelete = async (assignmentId: string) => {
    if (!confirm("Are you sure you want to remove this slot assignment?"))
      return;

    try {
      const { error } = await supabase
        .from("slot_assignments")
        .update({ is_active: false })
        .eq("id", assignmentId);

      if (error) throw error;
      setSuccess("Slot assignment removed successfully!");
      loadAssignments();
    } catch (err: any) {
      console.error("Error removing assignment:", err);
      setError("Failed to remove assignment");
    }
  };

  // Get available slots for the selected subject type
  const getAvailableSlots = () => {
    const selectedSubject = subjects.find((s) => s.id === formData.subject_id);
    if (!selectedSubject) return [];

    const assignedSlotIds = assignments.map((a) => a.slot_id);
    return slots.filter(
      (slot) =>
        slot.slot_type === selectedSubject.subject_type &&
        !assignedSlotIds.includes(slot.id),
    );
  };

  // Get unassigned subjects
  const getUnassignedSubjects = () => {
    const assignedSubjectIds = assignments.map((a) => a.subject_id);
    return subjects.filter(
      (subject) => !assignedSubjectIds.includes(subject.id),
    );
  };

  // Group assignments by day
  const groupAssignmentsByDay = () => {
    const grouped: { [key: number]: SlotAssignment[] } = {};
    assignments.forEach((assignment) => {
      const day = assignment.slot.day_of_week;
      if (!grouped[day]) grouped[day] = [];
      grouped[day].push(assignment);
    });

    // Sort assignments within each day by start time
    Object.keys(grouped).forEach((day) => {
      grouped[parseInt(day)].sort((a, b) =>
        a.slot.start_time.localeCompare(b.slot.start_time),
      );
    });

    return grouped;
  };

  const groupedAssignments = groupAssignmentsByDay();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Slot Assignment</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Assign Slot
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Assign Subject to Slot</DialogTitle>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800">
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Subject</Label>
                <Select
                  value={formData.subject_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, subject_id: value, slot_id: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {getUnassignedSubjects().map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.course_code} - {subject.subject_name}
                        <Badge className="ml-2" variant="outline">
                          {subject.subject_type}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Time Slot</Label>
                <Select
                  value={formData.slot_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, slot_id: value })
                  }
                  disabled={!formData.subject_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select time slot" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSlots().map((slot) => (
                      <SelectItem key={slot.id} value={slot.id}>
                        {slot.slot_code} - {slot.day_name} ({slot.start_time} -{" "}
                        {slot.end_time})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.subject_id || !formData.slot_id}
                >
                  Assign Slot
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading slot assignments...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Weekly Timetable View */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((day) => (
              <Card key={day}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    {DAYS[day as keyof typeof DAYS]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {groupedAssignments[day]?.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="p-2 bg-muted rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {assignment.subject.course_code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.slot.slot_code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {assignment.slot.start_time} -{" "}
                            {assignment.slot.end_time}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(assignment.id)}
                          className="text-destructive p-1 h-auto"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )) || (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No classes scheduled
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Detailed Table View */}
          <Card>
            <CardHeader>
              <CardTitle>All Slot Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Teacher</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Slot</TableHead>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {assignment.subject.course_code}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.subject.subject_name}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{assignment.subject.teacher?.name}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            assignment.subject.subject_type === "lab"
                              ? "secondary"
                              : "default"
                          }
                        >
                          {assignment.subject.subject_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {assignment.slot.slot_code}
                        </Badge>
                      </TableCell>
                      <TableCell>{assignment.slot.day_name}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>
                            {assignment.slot.start_time} -{" "}
                            {assignment.slot.end_time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(assignment.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
