import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsersTable } from "./UsersTable";
import { ClassesTable } from "./ClassesTable";
import { EnrollmentsTable } from "./EnrollmentsTable";
import { AttendanceTable } from "./AttendanceTable";
import { TeacherEntryForm } from "./TeacherEntryForm";
import { StudentEntryForm } from "./StudentEntryForm";
import { DataEntryDashboard } from "./DataEntryDashboard";
import { TimetableManagement } from "./TimetableManagement";
import MockDataTest from "../test/MockDataTest";
import {
  Users,
  BookOpen,
  UserPlus,
  ClipboardCheck,
  Upload,
  Database,
  Calendar,
  TestTube,
} from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminDashboard() {
  const { handleLogout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <header className="w-full h-20 px-4 md:px-6 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>

        <Tabs defaultValue="test" className="space-y-4">
          <TabsList className="grid w-full grid-cols-8 h-14">
            <TabsTrigger value="test" className="space-x-2">
              <TestTube className="h-4 w-4" />
              <span>Test Data</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="space-x-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="classes" className="space-x-2">
              <BookOpen className="h-4 w-4" />
              <span>Classes</span>
            </TabsTrigger>
            <TabsTrigger value="enrollments" className="space-x-2">
              <UserPlus className="h-4 w-4" />
              <span>Enrollments</span>
            </TabsTrigger>
            <TabsTrigger value="attendance" className="space-x-2">
              <ClipboardCheck className="h-4 w-4" />
              <span>Attendance</span>
            </TabsTrigger>
            <TabsTrigger value="timetable" className="space-x-2">
              <Calendar className="h-4 w-4" />
              <span>Timetable</span>
            </TabsTrigger>
            <TabsTrigger value="teachers" className="space-x-2">
              <Database className="h-4 w-4" />
              <span>Add Teacher</span>
            </TabsTrigger>
            <TabsTrigger value="students" className="space-x-2">
              <Database className="h-4 w-4" />
              <span>Add Student</span>
            </TabsTrigger>
            <TabsTrigger value="bulk" className="space-x-2">
              <Upload className="h-4 w-4" />
              <span>Bulk Import</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="test">
            <MockDataTest />
          </TabsContent>

          <TabsContent value="users">
            <UsersTable />
          </TabsContent>

          <TabsContent value="classes">
            <ClassesTable />
          </TabsContent>

          <TabsContent value="enrollments">
            <EnrollmentsTable />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceTable />
          </TabsContent>

          <TabsContent value="timetable">
            <TimetableManagement />
          </TabsContent>

          <TabsContent value="teachers">
            <TeacherEntryForm />
          </TabsContent>

          <TabsContent value="students">
            <StudentEntryForm />
          </TabsContent>

          <TabsContent value="bulk">
            <DataEntryDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
