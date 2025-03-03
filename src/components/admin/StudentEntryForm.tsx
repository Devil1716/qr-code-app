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
  student_id: string;
}

export function StudentEntryForm() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    department: "",
    student_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("users").insert([
        {
          ...formData,
          role: "student",
        },
      ]);

      if (error) throw error;

      // Reset form
      setFormData({
        name: "",
        email: "",
        department: "",
        student_id: "",
      });

      alert("Student added successfully!");
    } catch (err) {
      console.error("Error adding student:", err);
      alert("Error adding student");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Add New Student</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>Full Name</Label>
          <Input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="John Smith"
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
            placeholder="john.smith@university.edu"
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
          <Label>Student ID</Label>
          <Input
            required
            value={formData.student_id}
            onChange={(e) =>
              setFormData({ ...formData, student_id: e.target.value })
            }
            placeholder="S12345"
          />
        </div>

        <Button type="submit" className="w-full">
          Add Student
        </Button>
      </form>
    </Card>
  );
}
