import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, QrCode, Settings } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ClassCardProps {
  className?: string;
  classTitle?: string;
  classTime?: string;
  studentCount?: number;
  capacity?: number;
  isActive?: boolean;
  onGenerateQR?: () => void;
  onUpdateCapacity?: () => void;
}

const ClassCard = ({
  className = "",
  classTitle = "Introduction to Computer Science",
  classTime = "9:00 AM - 10:30 AM",
  studentCount = 30,
  capacity = 60,
  isActive = true,
  onGenerateQR = () => {},
  onUpdateCapacity = () => {},
}: ClassCardProps) => {
  // Calculate enrollment percentage
  const enrollmentPercentage = Math.min(
    Math.round((studentCount / capacity) * 100),
    100,
  );

  // Determine progress color based on enrollment percentage
  const getProgressColor = () => {
    if (enrollmentPercentage >= 90) return "bg-red-500";
    if (enrollmentPercentage >= 75) return "bg-amber-500";
    return "bg-green-500";
  };

  return (
    <Card className={`w-full md:w-[380px] ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold">{classTitle}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onUpdateCapacity}>
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Update class settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{classTime}</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{studentCount} Students</span>
            </div>
            <span className="text-muted-foreground">
              {enrollmentPercentage}% Full
            </span>
          </div>
          <Progress
            value={enrollmentPercentage}
            className="h-2"
            indicatorClassName={getProgressColor()}
          />
          <div className="text-xs text-muted-foreground text-right">
            {capacity - studentCount} spots remaining
          </div>
        </div>

        <div
          className={`inline-flex px-3 py-1 rounded-full text-sm ${isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}
        >
          {isActive ? "In Progress" : "Not Started"}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {}}
          className="flex items-center gap-2"
        >
          View Details
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="default"
              className="flex items-center gap-2"
              disabled={!isActive}
              onClick={onGenerateQR}
            >
              <QrCode className="w-4 h-4" />
              Generate QR
            </Button>
          </DialogTrigger>
        </Dialog>
      </CardFooter>
    </Card>
  );
};

export default ClassCard;
