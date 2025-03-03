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
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

// Mock data for offline development
const mockData = {
  classes: [
    {
      id: "1",
      title: "Introduction to Computer Science",
      teacher_id: "T123",
      start_time: "09:00",
      end_time: "10:30",
      room: "Room 101",
      created_at: new Date().toISOString(),
    },
    {
      id: "2",
      title: "Web Development",
      teacher_id: "T124",
      start_time: "11:00",
      end_time: "12:30",
      room: "Room 102",
      created_at: new Date().toISOString(),
    },
  ],
};

type Class = Database["public"]["Tables"]["classes"]["Row"];

export function ClassesTable() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [newClass, setNewClass] = useState({
    title: "",
    teacher_id: "",
    start_time: "",
    end_time: "",
    room: "",
  });

  const loadClasses = async () => {
    if (supabase) {
      const { data, error } = await supabase
        .from("classes")
        .select("*, users!classes_teacher_id_fkey(name)");

      if (error) {
        console.error("Error loading classes:", error);
        return;
      }

      setClasses(data);
    } else {
      // Use mock data
      setClasses(mockData.classes);
    }
  };

  // Load classes on mount
  useEffect(() => {
    loadClasses();
  }, []);

  const createClass = async () => {
    if (supabase) {
      const { data, error } = await supabase.from("classes").insert([
        {
          ...newClass,
          id: crypto.randomUUID(),
        },
      ]);

      if (error) {
        console.error("Error creating class:", error);
        return;
      }
    } else {
      // Add to mock data
      mockData.classes.push({
        ...newClass,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      });
    }

    loadClasses();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Classes</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Class</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Class</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={newClass.title}
                  onChange={(e) =>
                    setNewClass({ ...newClass, title: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Teacher ID</Label>
                <Input
                  value={newClass.teacher_id}
                  onChange={(e) =>
                    setNewClass({ ...newClass, teacher_id: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Start Time</Label>
                <Input
                  type="time"
                  value={newClass.start_time}
                  onChange={(e) =>
                    setNewClass({ ...newClass, start_time: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>End Time</Label>
                <Input
                  type="time"
                  value={newClass.end_time}
                  onChange={(e) =>
                    setNewClass({ ...newClass, end_time: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Room</Label>
                <Input
                  value={newClass.room}
                  onChange={(e) =>
                    setNewClass({ ...newClass, room: e.target.value })
                  }
                />
              </div>

              <Button onClick={createClass}>Create Class</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Teacher</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((cls) => (
            <TableRow key={cls.id}>
              <TableCell>{cls.title}</TableCell>
              <TableCell>{(cls as any).users?.name}</TableCell>
              <TableCell>
                {cls.start_time} - {cls.end_time}
              </TableCell>
              <TableCell>{cls.room}</TableCell>
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
