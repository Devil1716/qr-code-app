import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";

interface Student {
  id: string;
  name: string;
  status: "present" | "absent" | "proxy";
  timestamp?: string;
}

interface AttendanceMonitorProps {
  className?: string;
  students?: Student[];
  onStatusChange?: (
    studentId: string,
    status: "present" | "absent" | "proxy",
  ) => void;
}

const AttendanceMonitor = ({
  className = "",
  students = [
    { id: "1", name: "John Doe", status: "present", timestamp: "09:00 AM" },
    { id: "2", name: "Jane Smith", status: "absent" },
    { id: "3", name: "Mike Johnson", status: "proxy", timestamp: "09:05 AM" },
    {
      id: "4",
      name: "Sarah Williams",
      status: "present",
      timestamp: "09:02 AM",
    },
    { id: "5", name: "Tom Brown", status: "absent" },
  ],
  onStatusChange = () => {},
}: AttendanceMonitorProps) => {
  const stats = {
    present: students.filter((s) => s.status === "present").length,
    absent: students.filter((s) => s.status === "absent").length,
    proxy: students.filter((s) => s.status === "proxy").length,
  };

  return (
    <Card className={`w-full md:w-[350px] h-[600px] p-4 ${className}`}>
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Attendance Monitor</h2>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
            <p className="text-sm font-medium mt-1">Present</p>
            <p className="text-lg font-bold text-green-600">{stats.present}</p>
          </div>
          <div className="p-2 bg-red-50 rounded-lg">
            <XCircle className="w-5 h-5 text-red-600 mx-auto" />
            <p className="text-sm font-medium mt-1">Absent</p>
            <p className="text-lg font-bold text-red-600">{stats.absent}</p>
          </div>
          <div className="p-2 bg-yellow-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mx-auto" />
            <p className="text-sm font-medium mt-1">Proxy</p>
            <p className="text-lg font-bold text-yellow-600">{stats.proxy}</p>
          </div>
        </div>

        <Separator />

        {/* Student List */}
        <ScrollArea className="h-[420px] w-full pr-4">
          <div className="space-y-2">
            {students.map((student) => (
              <div
                key={student.id}
                className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    {student.timestamp && (
                      <p className="text-sm text-gray-500">
                        {student.timestamp}
                      </p>
                    )}
                  </div>
                  <Badge
                    variant={
                      student.status === "present"
                        ? "default"
                        : student.status === "absent"
                          ? "destructive"
                          : "warning"
                    }
                  >
                    {student.status.charAt(0).toUpperCase() +
                      student.status.slice(1)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
};

export default AttendanceMonitor;
