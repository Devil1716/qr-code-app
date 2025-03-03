import React, { useState } from "react";
import ClassCard from "./ClassCard";
import QRCodeModal from "./QRCodeModal";

interface ClassScheduleGridProps {
  classes?: Array<{
    id: string;
    title: string;
    time: string;
    studentCount: number;
    isActive: boolean;
  }>;
}

const ClassScheduleGrid = ({
  classes = [
    {
      id: "1",
      title: "Introduction to Computer Science",
      time: "9:00 AM - 10:30 AM",
      studentCount: 30,
      isActive: true,
    },
    {
      id: "2",
      title: "Data Structures",
      time: "11:00 AM - 12:30 PM",
      studentCount: 25,
      isActive: false,
    },
    {
      id: "3",
      title: "Advanced Web Development",
      time: "2:00 PM - 3:30 PM",
      studentCount: 20,
      isActive: false,
    },
    {
      id: "4",
      title: "Mobile App Development",
      time: "4:00 PM - 5:30 PM",
      studentCount: 15,
      isActive: false,
    },
  ],
}: ClassScheduleGridProps) => {
  const [selectedClass, setSelectedClass] = useState<{
    name: string;
    time: string;
    location: string;
  } | null>(null);

  return (
    <div className="w-full h-full bg-muted/50 p-4 md:p-6">
      <h2 className="text-2xl font-bold mb-6">Class Schedule</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 justify-items-center">
        {classes.map((classItem) => (
          <ClassCard
            key={classItem.id}
            classTitle={classItem.title}
            classTime={classItem.time}
            studentCount={classItem.studentCount}
            isActive={classItem.isActive}
            onGenerateQR={() =>
              setSelectedClass({
                name: classItem.title,
                time: classItem.time,
                location: "Room 301", // Default location
              })
            }
          />
        ))}
      </div>

      <QRCodeModal
        isOpen={!!selectedClass}
        onClose={() => setSelectedClass(null)}
        classDetails={selectedClass || undefined}
      />
    </div>
  );
};

export default ClassScheduleGrid;
