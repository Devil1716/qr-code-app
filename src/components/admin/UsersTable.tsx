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
import { getUsers } from "@/lib/api/supabase-client";

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
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const createUser = async () => {
    try {
      // Validate required fields
      if (!newUser.name || !newUser.email || !newUser.role) {
        alert("Name, email and role are required");
        return;
      }

      // Generate IDs if not provided
      let userData = { ...newUser };
      if (userData.role === "student" && !userData.student_id) {
        userData.student_id = `S${Math.floor(10000 + Math.random() * 90000)}`;
      } else if (userData.role === "teacher" && !userData.teacher_id) {
        userData.teacher_id = `T${Math.floor(10000 + Math.random() * 90000)}`;
      }

      const { data, error } = await supabase.from("users").insert([userData]);

      if (error) {
        console.error("Error creating user:", error);
        return;
      }

      // Reset form and reload users
      setNewUser({
        name: "",
        email: "",
        role: "student",
        student_id: "",
        teacher_id: "",
        department: "",
      });
      setDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
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
                  onValueChange={(value: "teacher" | "student" | "admin") =>
                    setNewUser({ ...newUser, role: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Input
                  value={newUser.department}
                  onChange={(e) =>
                    setNewUser({ ...newUser, department: e.target.value })
                  }
                />
              </div>

              {newUser.role === "student" && (
                <div className="space-y-2">
                  <Label>Student ID</Label>
                  <Input
                    value={newUser.student_id}
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
                    value={newUser.teacher_id}
                    onChange={(e) =>
                      setNewUser({ ...newUser, teacher_id: e.target.value })
                    }
                  />
                </div>
              )}

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
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
