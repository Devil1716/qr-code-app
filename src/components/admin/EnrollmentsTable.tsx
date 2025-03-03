import { useState } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type Enrollment = Database["public"]["Tables"]["class_enrollments"]["Row"];

export function EnrollmentsTable() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [newEnrollment, setNewEnrollment] = useState({
    class_id: "",
    student_id: "",
  });

  const loadEnrollments = async () => {
    const { data, error } = await supabase.from("class_enrollments").select(`
        *,
        classes(title),
        users!class_enrollments_student_id_fkey(name)
      `);

    if (error) {
      console.error("Error loading enrollments:", error);
      return;
    }

    setEnrollments(data);
  };

  const createEnrollment = async () => {
    const { data, error } = await supabase.from("class_enrollments").insert([
      {
        ...newEnrollment,
        id: crypto.randomUUID(),
      },
    ]);

    if (error) {
      console.error("Error creating enrollment:", error);
      return;
    }

    loadEnrollments();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Class Enrollments</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Enrollment</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Enrollment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Class ID</Label>
                <Input
                  value={newEnrollment.class_id}
                  onChange={(e) =>
                    setNewEnrollment({
                      ...newEnrollment,
                      class_id: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input
                  value={newEnrollment.student_id}
                  onChange={(e) =>
                    setNewEnrollment({
                      ...newEnrollment,
                      student_id: e.target.value,
                    })
                  }
                />
              </div>

              <Button onClick={createEnrollment}>Create Enrollment</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Enrolled At</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {enrollments.map((enrollment) => (
            <TableRow key={enrollment.id}>
              <TableCell>{(enrollment as any).classes?.title}</TableCell>
              <TableCell>{(enrollment as any).users?.name}</TableCell>
              <TableCell>
                {new Date(enrollment.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
