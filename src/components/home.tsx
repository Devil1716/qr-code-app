import React from "react";
import TeacherHeader from "./dashboard/TeacherHeader";
import PersonalInfoCard from "./dashboard/PersonalInfoCard";
import ClassScheduleGrid from "./dashboard/ClassScheduleGrid";
import AttendanceMonitor from "./dashboard/AttendanceMonitor";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      <TeacherHeader />

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column - Personal Info and Attendance Monitor */}
          <div className="flex flex-col gap-6">
            <PersonalInfoCard />
            <AttendanceMonitor />
          </div>

          {/* Right Column - Class Schedule Grid */}
          <div className="flex-1">
            <ClassScheduleGrid />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
