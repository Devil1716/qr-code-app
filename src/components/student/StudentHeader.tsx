import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Settings } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StudentHeaderProps {
  studentName?: string;
  studentId?: string;
  avatarUrl?: string;
  onSettings?: () => void;
}

export function StudentHeader({
  studentName = "John Smith",
  studentId = "S12345",
  avatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=student1",
  onSettings = () => {},
}: StudentHeaderProps) {
  const { handleLogout } = useAuth();

  return (
    <header className="w-full h-20 px-4 md:px-6 border-b flex items-center justify-between bg-background">
      <div className="flex items-center space-x-4">
        <Avatar className="h-10 w-10 border-2 border-primary/10">
          <AvatarImage src={avatarUrl} alt={studentName} />
          <AvatarFallback>
            {studentName
              .split(" ")
              .map((n) => n[0])
              .join("")}
          </AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">{studentName}</h2>
          <p className="text-sm text-muted-foreground">
            Student ID: {studentId}
          </p>
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
}
