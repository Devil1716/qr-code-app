import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { MapPin, Camera } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";

interface QrScannerProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (data: string) => void;
}

export function QrScanner({ open, onClose, onSuccess }: QrScannerProps) {
  const [cameraPermission, setCameraPermission] = useState(false);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [qrScanner, setQrScanner] = useState<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!open) {
      stopScanning();
    }
    return () => {
      stopScanning();
    };
  }, [open]);

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      stream.getTracks().forEach((track) => track.stop());
      setCameraPermission(true);
      setError("");
      startScanning();
    } catch (err) {
      console.error("Camera permission error:", err);
      setCameraPermission(false);
      setError("Please allow camera access to scan QR codes");
    }
  };

  const requestLocationPermission = async () => {
    try {
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
      setError("");
    } catch (err) {
      console.error("Location permission error:", err);
      setLocation(null);
      setError("Please enable location services");
    }
  };

  const stopScanning = async () => {
    if (qrScanner?.isScanning) {
      await qrScanner.stop();
      await qrScanner.clear();
    }
    setQrScanner(null);
    setScanning(false);
  };

  const startScanning = async () => {
    try {
      await stopScanning();
      setError("");

      const scanner = new Html5Qrcode("qr-reader", {
        verbose: false,
        formatsToSupport: [Html5Qrcode.FORMATS.QR_CODE],
      });

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1,
      };

      // Try to get available cameras
      const devices = await Html5Qrcode.getCameras();

      if (devices && devices.length > 0) {
        // Try to find back camera
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("environment"),
        );

        // Use back camera if found, otherwise use first available camera
        const deviceId = backCamera ? backCamera.id : devices[0].id;

        await scanner.start(
          deviceId,
          config,
          (decodedText) => handleScan(decodedText),
          (errorMessage) => {
            console.log(errorMessage);
          },
        );

        setQrScanner(scanner);
        setScanning(true);
      } else {
        // Fallback to environment facing mode if no cameras found
        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText) => handleScan(decodedText),
          (errorMessage) => {
            console.log(errorMessage);
          },
        );

        setQrScanner(scanner);
        setScanning(true);
      }
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError("Error accessing camera. Please try again.");
      setScanning(false);
    }
  };

  const handleScan = async (data: string) => {
    try {
      const qrData = JSON.parse(data);

      // Verify if QR code is expired
      const expirationTime = qrData.timestamp + qrData.expiresIn * 1000;
      if (Date.now() > expirationTime) {
        setError("QR code has expired");
        return;
      }

      // Calculate distance if location is available
      if (location && qrData.location) {
        const distance = calculateDistance(
          location.coords.latitude,
          location.coords.longitude,
          qrData.location.lat,
          qrData.location.lng,
        );

        if (distance > 0.005) {
          // 5 meters in kilometers
          setError("You are too far from the class location");
          return;
        }
      }

      await stopScanning();
      onSuccess?.(data);
      onClose();
    } catch (err) {
      setError("Invalid QR code");
    }
  };

  function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          stopScanning();
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Scan Attendance QR Code</h2>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!cameraPermission && (
            <Button
              className="w-full"
              onClick={requestCameraPermission}
              variant="outline"
            >
              <Camera className="mr-2 h-4 w-4" />
              Allow Camera Access
            </Button>
          )}

          {!location && cameraPermission && (
            <Button
              className="w-full"
              onClick={requestLocationPermission}
              variant="outline"
            >
              <MapPin className="mr-2 h-4 w-4" />
              Enable Location Services
            </Button>
          )}

          <div className="w-full h-[400px] bg-muted rounded-lg overflow-hidden">
            {scanning ? (
              <div id="qr-reader" className="w-full h-full" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {(cameraPermission || location) && (
            <div className="flex gap-2 justify-center">
              {cameraPermission && (
                <Badge variant="outline" className="bg-green-50">
                  <Camera className="mr-1 h-3 w-3" />
                  Camera Ready
                </Badge>
              )}
              {location && (
                <Badge variant="outline" className="bg-green-50">
                  <MapPin className="mr-1 h-3 w-3" />
                  Location Ready
                </Badge>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
