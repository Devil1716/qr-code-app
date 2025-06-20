import React, { useState } from "react";
import ClassCard from "./ClassCard";
import QRCodeModal from "./QRCodeModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Clock, Users, Settings } from "lucide-react";

interface ClassScheduleGridProps {
  classes?: Array<{
    id: string;
    title: string;
    time: string;
    start_time?: string;
    end_time?: string;
    room?: string;
    studentCount: number;
    capacity?: number;
    isActive: boolean;
  }>;
  onUpdateCapacity?: (classId: string, capacity: number) => void;
}

const ClassScheduleGrid = ({
  classes = [
    {
      id: "1",
      title: "Introduction to Computer Science",
      time: "9:00 AM - 10:30 AM",
      start_time: "9:00 AM",
      end_time: "10:30 AM",
      room: "301",
      studentCount: 30,
      capacity: 60,
      isActive: true,
    },
    {
      id: "2",
      title: "Data Structures",
      time: "11:00 AM - 12:30 PM",
      start_time: "11:00 AM",
      end_time: "12:30 PM",
      room: "302",
      studentCount: 25,
      capacity: 60,
      isActive: false,
    },
    {
      id: "3",
      title: "Advanced Web Development",
      time: "2:00 PM - 3:30 PM",
      start_time: "2:00 PM",
      end_time: "3:30 PM",
      room: "303",
      studentCount: 20,
      capacity: 60,
      isActive: false,
    },
    {
      id: "4",
      title: "Mobile App Development",
      time: "4:00 PM - 5:30 PM",
      start_time: "4:00 PM",
      end_time: "5:30 PM",
      room: "304",
      studentCount: 15,
      capacity: 60,
      isActive: false,
    },
  ],
  onUpdateCapacity = () => {},
}: ClassScheduleGridProps) => {
  const [selectedClass, setSelectedClass] = useState<{
    id?: string;
    name: string;
    time: string;
    location: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState("today");

  // Group classes by day for the weekly view
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const classesByDay = days.map((day) => ({
    day,
    classes: classes.filter(
      (_, index) => index % days.length === days.indexOf(day),
    ),
  }));

  return (
    <div className="w-full h-full bg-background p-4 md:p-6 rounded-lg border">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Class Schedule</h2>
          <TabsList>
            <TabsTrigger value="today" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Today
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Week
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="today" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {classes.map((classItem) => (
              <ClassCard
                key={classItem.id}
                classTitle={classItem.title}
                classTime={
                  classItem.time ||
                  `${classItem.start_time} - ${classItem.end_time}`
                }
                studentCount={classItem.studentCount}
                isActive={classItem.isActive}
                onGenerateQR={() =>
                  setSelectedClass({
                    id: classItem.id,
                    name: classItem.title,
                    time:
                      classItem.time ||
                      `${classItem.start_time} - ${classItem.end_time}`,
                    location: `Room ${classItem.room || "301"}`,
                  })
                }
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="week">
          <div className="space-y-6">
            {classesByDay.map(({ day, classes }) => (
              <Card key={day} className="overflow-hidden">
                <div className="bg-primary/10 p-3">
                  <h3 className="font-medium">{day}</h3>
                </div>
                <CardContent className="p-4">
                  {classes.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No classes scheduled
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {classes.map((classItem) => (
                        <div
                          key={classItem.id}
                          className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                        >
                          <div>
                            <h4 className="font-medium">{classItem.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>
                                  {classItem.time ||
                                    `${classItem.start_time} - ${classItem.end_time}`}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                <span>
                                  {classItem.studentCount}/
                                  {classItem.capacity || 60}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setSelectedClass({
                                id: classItem.id,
                                name: classItem.title,
                                time:
                                  classItem.time ||
                                  `${classItem.start_time} - ${classItem.end_time}`,
                                location: `Room ${classItem.room || "301"}`,
                              })
                            }
                          >
                            Generate QR
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <QRCodeModal
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        classDetails={selectedClass || undefined}
      />
    </div>
  );
};

export default ClassScheduleGrid;
