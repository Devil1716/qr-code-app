import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

interface FormData {
  name: string;
  email: string;
  role: "teacher" | "student";
  department: string;
  student_id?: string;
  teacher_id?: string;
}

export function DataEntryForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    role: "student",
    department: "",
    student_id: "",
    teacher_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("users").insert([formData]);
      if (error) throw error;

      // Reset form
      setFormData({
        name: "",
        email: "",
        role: "student",
        department: "",
        student_id: "",
        teacher_id: "",
      });

      alert("User added successfully!");
    } catch (err) {
      console.error("Error adding user:", err);
      alert("Error adding user");
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
          />
        </div>

        <div className="space-y-2">
          <Label>Role</Label>
          <Select
            value={formData.role}
            onValueChange={(value: "teacher" | "student") =>
              setFormData({ ...formData, role: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Department</Label>
          <Input
            required
            value={formData.department}
            onChange={(e) =>
              setFormData({ ...formData, department: e.target.value })
            }
          />
        </div>

        {formData.role === "student" && (
          <div className="space-y-2">
            <Label>Student ID</Label>
            <Input
              required
              value={formData.student_id}
              onChange={(e) =>
                setFormData({ ...formData, student_id: e.target.value })
              }
            />
          </div>
        )}

        {formData.role === "teacher" && (
          <div className="space-y-2">
            <Label>Teacher ID</Label>
            <Input
              required
              value={formData.teacher_id}
              onChange={(e) =>
                setFormData({ ...formData, teacher_id: e.target.value })
              }
            />
          </div>
        )}

        <Button type="submit" className="w-full">
          Add User
        </Button>
      </form>
    </Card>
  );
}
