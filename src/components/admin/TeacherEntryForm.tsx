import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("users").insert([
        {
          ...formData,
          role: "teacher",
        },
      ]);

      if (error) throw error;

      // Reset form
      setFormData({
        name: "",
        email: "",
        department: "",
        teacher_id: "",
      });

      alert("Teacher added successfully!");
    } catch (err) {
      console.error("Error adding teacher:", err);
      alert("Error adding teacher");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Add New Teacher</h2>
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
          <Label>Teacher ID</Label>
          <Input
            required
            value={formData.teacher_id}
            onChange={(e) =>
              setFormData({ ...formData, teacher_id: e.target.value })
            }
            placeholder="T123456"
          />
        </div>

        <Button type="submit" className="w-full">
          Add Teacher
        </Button>
      </form>
    </Card>
  );
}
