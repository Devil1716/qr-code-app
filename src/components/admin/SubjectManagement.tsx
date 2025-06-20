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
import { supabase } from "@/lib/supabase";
import { BookOpen, Users, Edit, Trash2, Plus } from "lucide-react";

interface Subject {
  id: string;
  course_code: string;
  subject_name: string;
  teacher_id: string;
  subject_type: "theory" | "lab";
  credits: number;
  student_limit: number;
  is_active: boolean;
  teacher?: {
    name: string;
    teacher_id: string;
  };
  enrolled_count?: number;
}

interface Teacher {
  id: string;
  name: string;
  teacher_id: string;
}

export function SubjectManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    course_code: "",
    subject_name: "",
    teacher_id: "",
    subject_type: "theory" as "theory" | "lab",
    credits: 3,
    student_limit: 60,
  });

  useEffect(() => {
    loadSubjects();
    loadTeachers();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("subjects")
        .select(
          `
          *,
          users!subjects_teacher_id_fkey(name, teacher_id)
        `,
        )
        .order("course_code");

      if (error) throw error;

      // Get enrollment counts for each subject
      const subjectsWithCounts = await Promise.all(
        (data || []).map(async (subject) => {
          const { count } = await supabase
            .from("student_subject_registrations")
            .select("*", { count: "exact", head: true })
            .eq("subject_id", subject.id)
            .eq("is_active", true);

          return {
            ...subject,
            teacher: subject.users,
            enrolled_count: count || 0,
          };
        }),
      );

      setSubjects(subjectsWithCounts);
    } catch (err: any) {
      console.error("Error loading subjects:", err);
      setError("Failed to load subjects");
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
      course_code: "",
      subject_name: "",
      teacher_id: "",
      subject_type: "theory",
      credits: 3,
      student_limit: 60,
    });
    setEditingSubject(null);
    setError("");
    setSuccess("");
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      course_code: subject.course_code,
      subject_name: subject.subject_name,
      teacher_id: subject.teacher_id,
      subject_type: subject.subject_type,
      credits: subject.credits,
      student_limit: subject.student_limit,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (editingSubject) {
        // Update existing subject
        const { error } = await supabase
          .from("subjects")
          .update(formData)
          .eq("id", editingSubject.id);

        if (error) throw error;
        setSuccess("Subject updated successfully!");
      } else {
        // Create new subject
        const { error } = await supabase.from("subjects").insert([formData]);

        if (error) throw error;
        setSuccess("Subject created successfully!");
      }

      loadSubjects();
      setDialogOpen(false);
      resetForm();
    } catch (err: any) {
      console.error("Error saving subject:", err);
      setError(err.message || "Failed to save subject");
    }
  };

  const handleDelete = async (subjectId: string) => {
    if (!confirm("Are you sure you want to delete this subject?")) return;

    try {
      const { error } = await supabase
        .from("subjects")
        .update({ is_active: false })
        .eq("id", subjectId);

      if (error) throw error;
      setSuccess("Subject deactivated successfully!");
      loadSubjects();
    } catch (err: any) {
      console.error("Error deleting subject:", err);
      setError("Failed to delete subject");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Subject Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingSubject ? "Edit Subject" : "Add New Subject"}
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
                <Label>Course Code</Label>
                <Input
                  required
                  value={formData.course_code}
                  onChange={(e) =>
                    setFormData({ ...formData, course_code: e.target.value })
                  }
                  placeholder="e.g., CS101"
                />
              </div>

              <div className="space-y-2">
                <Label>Subject Name</Label>
                <Input
                  required
                  value={formData.subject_name}
                  onChange={(e) =>
                    setFormData({ ...formData, subject_name: e.target.value })
                  }
                  placeholder="e.g., Introduction to Computer Science"
                />
              </div>

              <div className="space-y-2">
                <Label>Teacher</Label>
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

              <div className="space-y-2">
                <Label>Subject Type</Label>
                <Select
                  value={formData.subject_type}
                  onValueChange={(value: "theory" | "lab") =>
                    setFormData({ ...formData, subject_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="theory">Theory (1 slot)</SelectItem>
                    <SelectItem value="lab">
                      Lab (2 consecutive slots)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Credits</Label>
                  <Input
                    type="number"
                    min={1}
                    max={6}
                    value={formData.credits}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        credits: parseInt(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Student Limit</Label>
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={formData.student_limit}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        student_limit: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingSubject ? "Update" : "Create"} Subject
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p>Loading subjects...</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Code</TableHead>
              <TableHead>Subject Name</TableHead>
              <TableHead>Teacher</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Enrollment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell className="font-medium">
                  {subject.course_code}
                </TableCell>
                <TableCell>{subject.subject_name}</TableCell>
                <TableCell>
                  {subject.teacher?.name}
                  <br />
                  <span className="text-sm text-muted-foreground">
                    {subject.teacher?.teacher_id}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      subject.subject_type === "lab" ? "secondary" : "default"
                    }
                  >
                    {subject.subject_type === "lab" ? (
                      <>
                        <BookOpen className="h-3 w-3 mr-1" />
                        Lab
                      </>
                    ) : (
                      <>
                        <BookOpen className="h-3 w-3 mr-1" />
                        Theory
                      </>
                    )}
                  </Badge>
                </TableCell>
                <TableCell>{subject.credits}</TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>
                      {subject.enrolled_count}/{subject.student_limit}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={subject.is_active ? "default" : "secondary"}>
                    {subject.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(subject)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(subject.id)}
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
