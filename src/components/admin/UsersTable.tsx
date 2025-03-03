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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type User = Database["public"]["Tables"]["users"]["Row"];

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "student" as const,
    student_id: "",
    teacher_id: "",
    department: "",
  });

  const loadUsers = async () => {
    const { data, error } = await supabase.from("users").select("*");

    if (error) {
      console.error("Error loading users:", error);
      return;
    }

    setUsers(data || []);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async () => {
    const { data, error } = await supabase.from("users").insert([
      {
        ...newUser,
        id: crypto.randomUUID(),
      },
    ]);

    if (error) {
      console.error("Error creating user:", error);
      return;
    }

    loadUsers();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add User</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser({ ...newUser, name: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser({ ...newUser, email: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: "teacher" | "student") =>
                    setNewUser({ ...newUser, role: value })
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

              {newUser.role === "student" && (
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input
                    value={newUser.student_id || ""}
                    onChange={(e) =>
                      setNewUser({ ...newUser, student_id: e.target.value })
                    }
                  />
                </div>
              )}

              {newUser.role === "teacher" && (
                <div className="space-y-2">
                  <Label>Teacher ID</Label>
                  <Input
                    value={newUser.teacher_id || ""}
                    onChange={(e) =>
                      setNewUser({ ...newUser, teacher_id: e.target.value })
                    }
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={newUser.department || ""}
                  onChange={(e) =>
                    setNewUser({ ...newUser, department: e.target.value })
                  }
                />
              </div>

              <Button onClick={createUser}>Create User</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.role}</TableCell>
              <TableCell>
                {user.role === "student" ? user.student_id : user.teacher_id}
              </TableCell>
              <TableCell>{user.department}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">
                  Edit
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive">
                  Delete
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
