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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";
import { getUsers } from "@/lib/api/supabase-client";
import { Eye, EyeOff, Users, GraduationCap, BookOpen } from "lucide-react";

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
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterRole, setFilterRole] = useState("");

  const loadUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Password validation function
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/(?=.*[!@#$%^&*])/.test(password)) {
      errors.push(
        "Password must contain at least one special character (!@#$%^&*)",
      );
    }
    return errors;
  };

  const createUser = async () => {
    try {
      setError("");

      // Validate required fields
      if (
        !newUser.name ||
        !newUser.email ||
        !newUser.role ||
        !newUser.department ||
        !newUser.password
      ) {
        setError("Name, email, role, department, and password are required");
        return;
      }

      // Validate password
      const passwordErrors = validatePassword(newUser.password);
      if (passwordErrors.length > 0) {
        setError(passwordErrors.join(". "));
        return;
      }

      // Check if passwords match
      if (newUser.password !== newUser.confirmPassword) {
        setError("Passwords do not match");
        return;
      }

      // Generate IDs if not provided
      let userData = { ...newUser };
      if (userData.role === "student" && !userData.student_id) {
        userData.student_id = `S${Math.floor(10000 + Math.random() * 90000)}`;
      } else if (userData.role === "teacher" && !userData.teacher_id) {
        userData.teacher_id = `T${Math.floor(10000 + Math.random() * 90000)}`;
      }

      // Remove confirmPassword before inserting
      const { confirmPassword, ...userDataToInsert } = userData;

      const { data, error } = await supabase
        .from("users")
        .insert([userDataToInsert]);

      if (error) {
        console.error("Error creating user:", error);
        setError(error.message || "Failed to create user");
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
        password: "",
        confirmPassword: "",
      });
      setDialogOpen(false);
      loadUsers();
    } catch (error) {
      console.error("Error creating user:", error);
      setError("An unexpected error occurred");
    }
  };

  // Get unique departments for filtering
  const departments = [
    ...new Set(users.map((user) => user.department).filter(Boolean)),
  ];

  // Filter users based on department and role
  const filteredUsers = users.filter((user) => {
    const matchesDepartment =
      !filterDepartment || user.department === filterDepartment;
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesDepartment && matchesRole;
  });

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <Users className="h-4 w-4" />;
      case "teacher":
        return <GraduationCap className="h-4 w-4" />;
      case "student":
        return <BookOpen className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Get role color
  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800";
      case "teacher":
        return "bg-blue-100 text-blue-800";
      case "student":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Users Management</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add User</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
            </DialogHeader>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4 max-h-96 overflow-y-auto">
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
                <Label>Department *</Label>
                <Input
                  required
                  value={newUser.department}
                  onChange={(e) =>
                    setNewUser({ ...newUser, department: e.target.value })
                  }
                  placeholder="Computer Science, Mathematics, etc."
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
                    placeholder="Will be auto-generated if left blank"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    value={newUser.password}
                    onChange={(e) =>
                      setNewUser({ ...newUser, password: e.target.value })
                    }
                    placeholder="Enter a secure password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be 8+ chars with uppercase, lowercase, number, and
                  special character
                </p>
              </div>

              <div className="space-y-2">
                <Label>Confirm Password *</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={newUser.confirmPassword}
                    onChange={(e) =>
                      setNewUser({
                        ...newUser,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Confirm the password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button onClick={createUser} className="w-full">
                Create User
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Label>Filter by Department</Label>
          <Select value={filterDepartment} onValueChange={setFilterDepartment}>
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Label>Filter by Role</Label>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger>
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="teacher">Teacher</SelectItem>
              <SelectItem value="student">Student</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(filterDepartment || filterRole) && (
          <Button
            variant="outline"
            onClick={() => {
              setFilterDepartment("");
              setFilterRole("");
            }}
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredUsers.length} of {users.length} users
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
          ) : filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                {users.length === 0
                  ? "No users found"
                  : "No users match the current filters"}
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge
                    className={`${getRoleColor(user.role)} flex items-center gap-1 w-fit`}
                  >
                    {getRoleIcon(user.role)}
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {user.role === "student" ? user.student_id : user.teacher_id}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{user.department}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
