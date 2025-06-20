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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import {
  CalendarDays,
  Users,
  Edit,
  Trash2,
  Plus,
  Clock,
  MapPin,
} from "lucide-react";

interface TemporaryClass {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  start_datetime: string;
  end_datetime: string;
  location: string;
  attendance_credit: boolean;
  student_limit: number;
  is_recurring: boolean;
  recurrence_pattern: string;
  recurrence_end_date: string;
  is_active: boolean;
  teacher?: {
    name: string;
    teacher_id: string;
  };
  registration_count?: number;
}

interface Teacher {
  id: string;
  name: string;
  teacher_id: string;
}

export function TemporaryClassManagement() {
  const [temporaryClasses, setTemporaryClasses] = useState<TemporaryClass[]>(
    [],
  );
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<TemporaryClass | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    teacher_id: "",
    start_datetime: "",
    end_datetime: "",
    location: "",
    attendance_credit: false,
    student_limit: 60,
    is_recurring: false,
    recurrence_pattern: "weekly",
    recurrence_end_date: "",
  });

  useEffect(() => {
    loadTemporaryClasses();
    loadTeachers();
  }, []);

  const loadTemporaryClasses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("temporary_classes")
        .select(
          `
          *,
          users!temporary_classes_teacher_id_fkey(name, teacher_id)
        `,
        )
        .order("start_datetime", { ascending: false });

      if (error) throw error;

      // Get registration counts for each temporary class
      const classesWithCounts = await Promise.all(
        (data || []).map(async (tempClass) => {
          const { count } = await supabase
            .from("temporary_class_registrations")
            .select("*", { count: "exact", head: true })
            .eq("temporary_class_id", tempClass.id)
            .eq("approval_status", "approved");

          return {
            ...tempClass,
            teacher: tempClass.users,
            registration_count: count || 0,
          };
        }),
      );

      setTemporaryClasses(classesWithCounts);
    } catch (err: any) {
      console.error("Error loading temporary classes:", err);
      setError("Failed to load temporary classes");
    } finally {
      setLoading(false);
    }
  };

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, teacher_id")
        .eq("role", "teacher")
        .order("name");

      if (error) throw error;
      setTeachers(data || []);
    } catch (err: any) {
      console.error("Error loading teachers:", err);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      teacher_id: "",
      start_datetime: "",
      end_datetime: "",
      location: "",
      attendance_credit: false,
      student_limit: 60,
      is_recurring: false,
      recurrence_pattern: "weekly",
      recurrence_end_date: "",
    });
    setEditingClass(null);
    setError("");
    setSuccess("");
  };

  const handleEdit = (tempClass: TemporaryClass) => {
    setEditingClass(tempClass);
    setFormData({
      title: tempClass.title,
      description: tempClass.description || "",
      teacher_id: tempClass.teacher_id,
      start_datetime: new Date(tempClass.start_datetime)
        .toISOString()
        .slice(0, 16),
      end_datetime: new Date(tempClass.end_datetime).toISOString().slice(0, 16),
      location: tempClass.location || "",
      attendance_credit: tempClass.attendance_credit,
      student_limit: tempClass.student_limit,
      is_recurring: tempClass.is_recurring,
      recurrence_pattern: tempClass.recurrence_pattern || "weekly",
      recurrence_end_date: tempClass.recurrence_end_date
        ? new Date(tempClass.recurrence_end_date).toISOString().slice(0, 10)
        : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      // Validate dates
      const startDate = new Date(formData.start_datetime);
      const endDate = new Date(formData.end_datetime);

      if (startDate >= endDate) {
        setError("End time must be after start time");
        return;
      }

      const submitData = {
        ...formData,
        start_datetime: startDate.toISOString(),
        end_datetime: endDate.toISOString(),
        recurrence_end_date: formData.recurrence_end_date
          ? new Date(formData.recurrence_end_date).toISOString()
          : null,
        created_by: localStorage.getItem("userId"),
      };

      if (editingClass) {
        // Update existing temporary class
        const { error } = await supabase
          .from("temporary_classes")
          .update(submitData)
          .eq("id", editingClass.id);

        if (error) throw error;
        setSuccess("Temporary class updated successfully!");
      } else {
        // Create new temporary class
        const { error } = await supabase
          .from("temporary_classes")
          .insert([submitData]);

        if (error) throw error;
        setSuccess("Temporary class created successfully!");
      }

      loadTemporaryClasses();
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Error saving temporary class:", err);
      setError(err.message || "Failed to save temporary class");
    }
  };

  const handleDelete = async (classId: string) => {
    if (!confirm("Are you sure you want to delete this temporary class?"))
      return;

    try {
      const { error } = await supabase
        .from("temporary_classes")
        .update({ is_active: false })
        .eq("id", classId);

      if (error) throw error;
      setSuccess("Temporary class deleted successfully!");
      loadTemporaryClasses();
    } catch (err: any) {
      console.error("Error deleting temporary class:", err);
      setError("Failed to delete temporary class");
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const isUpcoming = (startDateTime: string) => {
    return new Date(startDateTime) > new Date();
  };

  const isPast = (endDateTime: string) => {
    return new Date(endDateTime) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Temporary Classes & Events</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingClass
                  ? "Edit Temporary Class"
                  : "Create Temporary Class"}
              </DialogTitle>
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
                <Label>Title</Label>
                <Input
                  required
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Guest Lecture on AI"
                />
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Event description..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Teacher/Instructor</Label>
                <Select
                  value={formData.teacher_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, teacher_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name} ({teacher.teacher_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date & Time</Label>
                  <Input
                    type="datetime-local"
                    required
                    value={formData.start_datetime}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        start_datetime: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>End Date & Time</Label>
                  <Input
                    type="datetime-local"
                    required
                    value={formData.end_datetime}
                    onChange={(e) =>
                      setFormData({ ...formData, end_datetime: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Location</Label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="e.g., Auditorium, Room 301"
                />
              </div>

              <div className="space-y-2">
                <Label>Student Limit</Label>
                <Input
                  type="number"
                  min={1}
                  max={200}
                  value={formData.student_limit}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      student_limit: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="attendance-credit"
                  checked={formData.attendance_credit}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, attendance_credit: checked })
                  }
                />
                <Label htmlFor="attendance-credit">Attendance Credit</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="recurring"
                  checked={formData.is_recurring}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_recurring: checked })
                  }
                />
                <Label htmlFor="recurring">Recurring Event</Label>
              </div>

              {formData.is_recurring && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Recurrence Pattern</Label>
                    <Select
                      value={formData.recurrence_pattern}
                      onValueChange={(value) =>
                        setFormData({ ...formData, recurrence_pattern: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Recurrence End Date</Label>
                    <Input
                      type="date"
                      value={formData.recurrence_end_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          recurrence_end_date: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingClass ? "Update" : "Create"} Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading temporary classes...</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Registrations</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {temporaryClasses.map((tempClass) => (
              <TableRow key={tempClass.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{tempClass.title}</p>
                    {tempClass.description && (
                      <p className="text-sm text-muted-foreground">
                        {tempClass.description.substring(0, 50)}...
                      </p>
                    )}
                    <div className="flex gap-2 mt-1">
                      {tempClass.attendance_credit && (
                        <Badge variant="secondary" className="text-xs">
                          Credit
                        </Badge>
                      )}
                      {tempClass.is_recurring && (
                        <Badge variant="outline" className="text-xs">
                          Recurring
                        </Badge>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {tempClass.teacher?.name}
                  <br />
                  <span className="text-sm text-muted-foreground">
                    {tempClass.teacher?.teacher_id}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <div>
                      <p className="text-sm">
                        {formatDateTime(tempClass.start_datetime)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        to {formatDateTime(tempClass.end_datetime)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {tempClass.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span className="text-sm">{tempClass.location}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {tempClass.registration_count}/{tempClass.student_limit}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      isPast(tempClass.end_datetime)
                        ? "secondary"
                        : isUpcoming(tempClass.start_datetime)
                          ? "default"
                          : "destructive"
                    }
                  >
                    {isPast(tempClass.end_datetime)
                      ? "Completed"
                      : isUpcoming(tempClass.start_datetime)
                        ? "Upcoming"
                        : "In Progress"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(tempClass)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tempClass.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
