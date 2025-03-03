import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, Building2, GraduationCap } from "lucide-react";

interface PersonalInfoCardProps {
  teacherName?: string;
  teacherId?: string;
  department?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
}

const PersonalInfoCard = ({
  teacherName = "Dr. Sarah Johnson",
  teacherId = "T123456",
  department = "Computer Science",
  email = "sarah.johnson@university.edu",
  phone = "+1 (555) 123-4567",
  avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1",
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
          <Avatar className="h-16 w-16">
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
            <p className="text-sm text-gray-500">ID: {teacherId}</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-3 text-gray-600">
            <Building2 className="h-4 w-4" />
            <span className="text-sm">{department}</span>
          </div>

          <div className="flex items-center space-x-3 text-gray-600">
            <GraduationCap className="h-4 w-4" />
            <span className="text-sm">Senior Professor</span>
          </div>

          <div className="flex items-center space-x-3 text-gray-600">
            <Mail className="h-4 w-4" />
            <span className="text-sm">{email}</span>
          </div>

          <div className="flex items-center space-x-3 text-gray-600">
            <Phone className="h-4 w-4" />
            <span className="text-sm">{phone}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PersonalInfoCard;
