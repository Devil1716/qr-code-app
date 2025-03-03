import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "../theme-toggle";
import { useAuth } from "@/hooks/useAuth";

export function StudentHeader() {
  const { handleLogout } = useAuth();

  return (
    <header className="w-full h-20 px-4 md:px-6 border-b flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Avatar>
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=student1" />
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-lg font-semibold">John Smith</h2>
          <p className="text-sm text-muted-foreground">Student ID: S12345</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <ThemeToggle />
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
