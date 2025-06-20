import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, LogOut, Settings, GraduationCap } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TeacherHeaderProps {
  teacherName?: string;
  teacherId?: string;
  department?: string;
  avatarUrl?: string;
  onSettings?: () => void;
}

const TeacherHeader = ({
  teacherName = "Dr. Jane Smith",
  teacherId = "T123456",
  department = "Computer Science",
  avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=teacher1",
  onSettings = () => {},
}: TeacherHeaderProps) => {
  const { handleLogout } = useAuth();

  return (
    <header className="w-full h-20 px-4 md:px-6 border-b border-border flex items-center justify-between bg-background">
      <div className="flex items-center space-x-4">
        <Avatar className="h-10 w-10 border-2 border-primary/10">
          <AvatarImage src={avatarUrl} alt={teacherName} />
          <AvatarFallback>
            {teacherName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">{teacherName}</h2>
            <Badge variant="outline" className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              Teacher
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>ID: {teacherId}</span>
            {department && (
              <>
                <span>•</span>
                <span>{department}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default TeacherHeader;
