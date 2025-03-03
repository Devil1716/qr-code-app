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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { Database } from "@/types/supabase";

type AttendanceRecord =
  Database["public"]["Tables"]["attendance_records"]["Row"];

export function AttendanceTable() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);

  const loadRecords = async () => {
    const { data, error } = await supabase.from("attendance_records").select(`
        *,
        attendance_sessions(classes(title)),
        users!attendance_records_student_id_fkey(name)
      `);

    if (error) {
      console.error("Error loading attendance records:", error);
      return;
    }

    setRecords(data);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Attendance Records</h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Time</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>
                {(record as any).attendance_sessions?.classes?.title}
              </TableCell>
              <TableCell>{(record as any).users?.name}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    record.status === "present"
                      ? "default"
                      : record.status === "proxy"
                        ? "warning"
                        : "destructive"
                  }
                >
                  {record.status}
                </Badge>
              </TableCell>
              <TableCell>
                {record.location_lat && record.location_lng
                  ? `${record.location_lat.toFixed(6)}, ${record.location_lng.toFixed(6)}`
                  : "N/A"}
              </TableCell>
              <TableCell>
                {new Date(record.created_at).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
