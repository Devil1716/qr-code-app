import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SubjectManagement } from "./SubjectManagement";
import { SlotAssignment } from "./SlotAssignment";
import { TemporaryClassManagement } from "./TemporaryClassManagement";
import { TimetableView } from "./TimetableView";
import {
  BookOpen,
  Calendar,
  Clock,
  Users,
  Settings,
  CalendarDays,
} from "lucide-react";

export function TimetableManagement() {
  const [activeTab, setActiveTab] = useState("subjects");

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Timetable Management</h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-5 h-14">
          <TabsTrigger value="subjects" className="space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>Subjects</span>
          </TabsTrigger>
          <TabsTrigger value="slots" className="space-x-2">
            <Clock className="h-4 w-4" />
            <span>Slot Assignment</span>
          </TabsTrigger>
          <TabsTrigger value="temporary" className="space-x-2">
            <CalendarDays className="h-4 w-4" />
            <span>Temporary Classes</span>
          </TabsTrigger>
          <TabsTrigger value="timetable" className="space-x-2">
            <Calendar className="h-4 w-4" />
            <span>View Timetables</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="space-x-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="subjects">
          <SubjectManagement />
        </TabsContent>

        <TabsContent value="slots">
          <SlotAssignment />
        </TabsContent>

        <TabsContent value="temporary">
          <TemporaryClassManagement />
        </TabsContent>

        <TabsContent value="timetable">
          <TimetableView />
        </TabsContent>

        <TabsContent value="settings">
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Settings panel coming soon...
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
