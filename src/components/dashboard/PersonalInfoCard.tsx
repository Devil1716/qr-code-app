import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Mail,
  Phone,
  Building2,
  GraduationCap,
  BookOpen,
  Users,
} from "lucide-react";

interface PersonalInfoCardProps {
  teacherName?: string;
  teacherId?: string;
  department?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  totalClasses?: number;
  totalStudents?: number;
}

const PersonalInfoCard = ({
  teacherName = "Dr. Sarah Johnson",
  teacherId = "T123456",
  department = "Computer Science",
  email = "sarah.johnson@university.edu",
  phone = "+1 (555) 123-4567",
  avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1",
  totalClasses = 0,
  totalStudents = 0,
}: PersonalInfoCardProps) => {
  return (
    <Card className="w-full md:w-[350px]">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold">
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20 border-2 border-primary/10">
            <AvatarImage src={avatarUrl} alt={teacherName} />
            <AvatarFallback>
              {teacherName
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium text-lg">{teacherName}</h3>
            <p className="text-sm text-muted-foreground">ID: {teacherId}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-primary/5 p-3 rounded-lg flex flex-col items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Classes</p>
            <p className="text-lg font-semibold">{totalClasses}</p>
          </div>

          <div className="bg-primary/5 p-3 rounded-lg flex flex-col items-center justify-center">
            <Users className="h-5 w-5 text-primary mb-1" />
            <p className="text-xs text-muted-foreground">Students</p>
            <p className="text-lg font-semibold">{totalStudents}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="text-sm">{department}</span>
          </div>

          <div className="flex items-center space-x-3 text-muted-foreground">
            <GraduationCap className="h-4 w-4" />
            <span className="text-sm">Senior Professor</span>
          </div>

          <div className="flex items-center space-x-3 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="text-sm">{email}</span>
          </div>

          <div className="flex items-center space-x-3 text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span className="text-sm">{phone}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoCard;
