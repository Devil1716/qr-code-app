import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

interface FormData {
  name: string;
  email: string;
  department: string;
  teacher_id: string;
}

export function TeacherEntryForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    department: "",
    teacher_id: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError("");

    try {
      // Generate a teacher ID if not provided
      const teacherId =
        formData.teacher_id || `T${Math.floor(10000 + Math.random() * 90000)}`;

      // Insert the teacher into the database
      const { error } = await supabase.from("users").insert([
        {
          name: formData.name,
          email: formData.email,
          role: "teacher",
          department: formData.department,
          teacher_id: teacherId,
        },
      ]);

      if (error) {
        throw error;
      }

      // Reset form and show success message
      setFormData({
        name: "",
        email: "",
        department: "",
        teacher_id: "",
      });
      setSuccess(true);
    } catch (err) {
      console.error("Error creating teacher:", err);
      setError(err.message || "An error occurred while creating the teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Add New Teacher</h2>

      {success && (
        <Alert className="mb-4 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            Teacher added successfully!
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert className="mb-4" variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Dr. Jane Smith"
          />
        </div>

        <div className="space-y-2">
          <Label>Email</Label>
          <Input
            type="email"
            required
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="jane.smith@university.edu"
          />
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Input
            required
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
            placeholder="Computer Science"
          />
        </div>

        <div className="space-y-2">
          <Label>Teacher ID (optional)</Label>
          <Input
            value={formData.teacher_id}
            onChange={(e) =>
              setFormData({ ...formData, teacher_id: e.target.value })
            }
            placeholder="T123456 (will be generated if left blank)"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Adding Teacher..." : "Add Teacher"}
        </Button>
      </form>
    </Card>
  );
}
