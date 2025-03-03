import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Users, QrCode } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";

interface ClassCardProps {
  className?: string;
  classTitle?: string;
  classTime?: string;
  studentCount?: number;
  isActive?: boolean;
  onGenerateQR?: () => void;
}

const ClassCard = ({
  className = "",
  classTitle = "Introduction to Computer Science",
  classTime = "9:00 AM - 10:30 AM",
  studentCount = 30,
  isActive = true,
  onGenerateQR = () => {},
}: ClassCardProps) => {
  return (
    <Card className={`w-full md:w-[380px] ${className}`}>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">{classTitle}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{classTime}</span>
        </div>
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-4 h-4" />
          <span>{studentCount} Students</span>
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
