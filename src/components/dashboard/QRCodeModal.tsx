import React, { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { ManualAttendanceDialog } from "./ManualAttendanceDialog";
import { Progress } from "../ui/progress";
import { QRCodeSVG } from "qrcode.react";
import { Badge } from "../ui/badge";
import {
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface QRCodeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  classDetails?: {
    id?: string;
    name: string;
    time: string;
    location: string;
  };
}

const EXPIRATION_TIME = 180; // 3 minutes in seconds

const QRCodeModal = ({
  isOpen = true,
  onClose = () => {},
  classDetails = {
    id: "default_class",
    name: "Advanced Web Development",
    time: "10:00 AM - 11:30 AM",
    location: "Room 301",
  },
}: QRCodeModalProps) => {
  const [locationValid, setLocationValid] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [qrExpiration, setQrExpiration] = useState(EXPIRATION_TIME);
  const [qrCode, setQrCode] = useState("");
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    proxyAttempts: 0,
  });

  const generateQRCode = useCallback(async () => {
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          });
        },
      );

      setLocation(position);
      setLocationValid(true);

      // Generate QR code data for the new timetable system
      // Check if this is a subject or temporary class
      const data = {
        // For backward compatibility, include both classId and subjectId
        classId: classDetails.id,
        subjectId: classDetails.id, // Assuming the ID represents a subject
        timestamp: Date.now(),
        expiresIn: EXPIRATION_TIME,
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        // Add a random nonce to ensure unique QR codes
        nonce: Math.random().toString(36).substring(7),
      };

      setQrCode(JSON.stringify(data));
      setQrExpiration(EXPIRATION_TIME);
    } catch (err) {
      console.error("Error getting location:", err);
      setLocationValid(false);
    }
  }, [classDetails]);

  const loadAttendanceStats = async () => {
    if (!classDetails.id) return;

    try {
      // Load attendance stats from the new timetable system
      // Try to get attendance records for this subject
      const { data: attendanceRecords, error } = await supabase
        .from("attendance_records")
        .select("status")
        .eq("subject_id", classDetails.id);

      if (error) {
        console.error("Error loading attendance stats:", error);
        // Fallback to old system if needed
        const { data: fallbackData } = await supabase
          .from("attendance_records")
          .select("status")
          .eq("class_id", classDetails.id);

        if (fallbackData) {
          const stats = {
            present: fallbackData.filter((r) => r.status === "present").length,
            absent: fallbackData.filter((r) => r.status === "absent").length,
            proxyAttempts: fallbackData.filter((r) => r.status === "proxy")
              .length,
          };
          setAttendanceStats(stats);
        }
      } else if (attendanceRecords) {
        const stats = {
          present: attendanceRecords.filter((r) => r.status === "present")
            .length,
          absent: attendanceRecords.filter((r) => r.status === "absent").length,
          proxyAttempts: attendanceRecords.filter((r) => r.status === "proxy")
            .length,
        };
        setAttendanceStats(stats);
      }
    } catch (error) {
      console.error("Error loading attendance stats:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
      loadAttendanceStats();
    }
  }, [isOpen, generateQRCode]);

  // QR code expiration timer
  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setQrExpiration((prev) => {
        if (prev <= 0) {
          generateQRCode();
          return EXPIRATION_TIME;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, generateQRCode]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Attendance QR Code
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 p-4">
          {/* Class Info */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{classDetails.name}</h3>
              <p className="text-sm text-gray-500">{classDetails.time}</p>
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="mr-1 h-4 w-4" />
              {classDetails.location}
            </div>
          </div>

          {/* Location Status */}
          <div
            className={`flex items-center justify-center p-4 rounded-lg ${locationValid ? "bg-green-50" : "bg-red-50"}`}
          >
            {locationValid ? (
              <div className="flex items-center text-green-600">
                <CheckCircle className="mr-2 h-5 w-5" />
                Location Verified
              </div>
            ) : (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="mr-2 h-5 w-5" />
                {location === null
                  ? "Waiting for location..."
                  : "Location verification failed"}
              </div>
            )}
          </div>

          {/* QR Code Display */}
          {locationValid && (
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-gray-100 p-8 rounded-lg">
                <QRCodeSVG
                  value={qrCode}
                  size={192}
                  level="H"
                  includeMargin
                  className="bg-white p-2"
                />
              </div>
              <div className="w-full space-y-2">
                <div className="flex justify-between text-sm">
                  <span>QR Code expires in</span>
                  <span>{qrExpiration}s</span>
                </div>
                <Progress
                  value={(qrExpiration / EXPIRATION_TIME) * 100}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Attendance Stats */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 bg-green-50">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Present</p>
                  <p className="text-2xl font-bold text-green-600">
                    {attendanceStats.present}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-red-50">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-sm font-medium">Absent</p>
                  <p className="text-2xl font-bold text-red-600">
                    {attendanceStats.absent}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 bg-yellow-50">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium">Proxy Attempts</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {attendanceStats.proxyAttempts}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button variant="outline" onClick={() => setShowManualEntry(true)}>
              Manual Entry
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button onClick={generateQRCode} variant="default">
              Regenerate QR
            </Button>
          </div>

          <ManualAttendanceDialog
            open={showManualEntry}
            onClose={() => setShowManualEntry(false)}
            classId={classDetails.id || ""}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeModal;
