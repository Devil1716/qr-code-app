import { useEffect, useState, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Camera,
  RefreshCcw,
  Settings,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { supabase } from "@/lib/supabase";

interface QrScannerProps {
  open?: boolean;
  onClose: () => void;
  onSuccess?: (data: string) => void;
  studentId?: string;
}

// Permission states
type PermissionState = "granted" | "denied" | "prompt" | "unavailable";

// Platform detection
const getPlatformInfo = () => {
  const userAgent = navigator.userAgent;
  const platform = navigator.platform;

  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(userAgent);
  const isMobile = isIOS || isAndroid || /Mobi|Mobile/.test(userAgent);
  const isDesktop = !isMobile;

  const browser = (() => {
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
      return "Chrome";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      return "Safari";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Edg")) return "Edge";
    return "Unknown";
  })();

  const os = (() => {
    if (isIOS) return "iOS";
    if (isAndroid) return "Android";
    if (platform.includes("Win")) return "Windows";
    if (platform.includes("Mac")) return "macOS";
    if (platform.includes("Linux")) return "Linux";
    return "Unknown";
  })();

  return { isIOS, isAndroid, isMobile, isDesktop, browser, os, platform };
};

// HTTPS check
const isSecureContext = () => {
  return (
    window.isSecureContext ||
    location.protocol === "https:" ||
    location.hostname === "localhost"
  );
};

// Test mode flag - set to true to enable mock QR data for development
const TEST_MODE = import.meta.env.DEV && true; // Enable test mode in development

export function QrScanner({
  open = true,
  onClose,
  onSuccess,
  studentId,
}: QrScannerProps) {
  const [cameraPermission, setCameraPermission] =
    useState<PermissionState>("prompt");
  const [location, setLocation] = useState<GeolocationPosition | null>(null);
  const [error, setError] = useState<string>("");
  const [scanning, setScanning] = useState(false);
  const [qrScanner, setQrScanner] = useState<Html5Qrcode | null>(null);
  const [availableCameras, setAvailableCameras] = useState<
    Array<{ id: string; label: string }>
  >([]);
  const [selectedCamera, setSelectedCamera] = useState<string>("");
  const [platformInfo] = useState(getPlatformInfo());
  const [secureContext] = useState(isSecureContext());
  const [cameraSupported, setCameraSupported] = useState(true);
  const qrReaderRef = useRef<HTMLDivElement>(null);
  const permissionCheckedRef = useRef(false);

  // Check platform compatibility and camera permission on mount
  useEffect(() => {
    if (open && !permissionCheckedRef.current) {
      checkPlatformCompatibility();
      checkCameraPermission();
      permissionCheckedRef.current = true;
    }

    // Reset permission checked flag when dialog closes
    if (!open) {
      permissionCheckedRef.current = false;
    }
  }, [open]);

  // Platform compatibility check
  const checkPlatformCompatibility = () => {
    // Check if camera is supported
    const hasMediaDevices = !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    );
    const hasGetUserMedia = !!(
      navigator.getUserMedia ||
      navigator.webkitGetUserMedia ||
      navigator.mozGetUserMedia
    );

    if (!hasMediaDevices && !hasGetUserMedia) {
      setCameraSupported(false);
      setError(
        `Camera not supported on ${platformInfo.os} ${platformInfo.browser}`,
      );
      return;
    }

    // Check secure context
    if (!secureContext) {
      setError("Camera requires HTTPS. Please access this site securely.");
      return;
    }

    // Platform-specific warnings
    if (platformInfo.isIOS && platformInfo.browser === "Chrome") {
      console.warn(
        "iOS Chrome has limited camera support. Safari recommended.",
      );
    }

    setCameraSupported(true);
  };

  // Start scanning when permission is granted and dialog is open
  useEffect(() => {
    if (open && cameraPermission === "granted" && !scanning) {
      // Add a small delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        enumerateCameras().then(() => {
          startScanning();
        });
      }, 300);

      return () => clearTimeout(timer);
    }

    return () => {
      if (qrScanner) {
        stopScanning();
      }
    };
  }, [open, cameraPermission]);

  // Enhanced camera permission check with platform-specific handling
  const checkCameraPermission = async () => {
    if (!cameraSupported) return;

    try {
      // Platform-specific permission checking
      if (platformInfo.isIOS) {
        // iOS requires direct getUserMedia call
        await requestCameraPermission();
        return;
      }

      // Check if the permissions API is available (not on all browsers)
      if (navigator.permissions && navigator.permissions.query) {
        try {
          const result = await navigator.permissions.query({
            name: "camera" as PermissionName,
          });

          if (result.state === "granted") {
            setCameraPermission("granted");
            setError("");
            return;
          } else if (result.state === "denied") {
            setCameraPermission("denied");
            setError(getPlatformSpecificErrorMessage("denied"));
            return;
          } else {
            setCameraPermission("prompt");
          }
        } catch (permErr) {
          console.warn("Permissions API query failed:", permErr);
          // Fallback to direct camera access
        }
      }

      // If permissions API is not available or failed, try to access the camera directly
      await requestCameraPermission();
    } catch (err) {
      console.error("Error checking camera permission:", err);
      setCameraPermission("unavailable");
      setError(getPlatformSpecificErrorMessage("unavailable"));
    }
  };

  // Get platform-specific error messages
  const getPlatformSpecificErrorMessage = (type: string) => {
    const { os, browser, isMobile } = platformInfo;

    switch (type) {
      case "denied":
        if (os === "iOS") {
          return "Camera blocked. Go to Settings > Safari > Camera and allow access.";
        } else if (os === "Android") {
          return "Camera blocked. Check your browser permissions in Android settings.";
        } else if (os === "Windows" || os === "macOS") {
          return `Camera blocked in ${browser}. Click the camera icon in the address bar to allow access.`;
        }
        return "Camera access denied. Please check your browser settings.";

      case "unavailable":
        if (!secureContext) {
          return "Camera requires HTTPS. Please access this site securely.";
        }
        return `Camera not available on ${os} ${browser}. Try a different browser.`;

      default:
        return "Camera access error. Please try again.";
    }
  };

  // Enumerate available cameras
  const enumerateCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length) {
        setAvailableCameras(devices);
        // Prefer back camera if available
        const backCamera = devices.find(
          (camera) =>
            camera.label.toLowerCase().includes("back") ||
            camera.label.toLowerCase().includes("rear"),
        );
        setSelectedCamera(backCamera ? backCamera.id : devices[0].id);
      } else {
        setError("No cameras found on your device");
      }
    } catch (err) {
      console.error("Error enumerating cameras:", err);
      setError("Failed to detect cameras on your device");
    }
  };

  const requestCameraPermission = async () => {
    try {
      // Platform-specific camera constraints
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: platformInfo.isMobile ? { ideal: "environment" } : "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      // Try to access the camera with platform-optimized settings
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCameraPermission("granted");
      setError("");

      // Important: Release the camera stream after permission check
      stream.getTracks().forEach((track) => track.stop());

      // Store permission in session storage to remember across page reloads
      sessionStorage.setItem("cameraPermission", "granted");
      sessionStorage.setItem("cameraPermissionTime", Date.now().toString());
    } catch (err) {
      console.error("Camera permission error:", err);

      // Enhanced error handling with platform-specific messages
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
          case "PermissionDeniedError":
            setCameraPermission("denied");
            setError(getPlatformSpecificErrorMessage("denied"));
            sessionStorage.setItem("cameraPermission", "denied");
            break;

          case "NotFoundError":
          case "DevicesNotFoundError":
            setCameraPermission("unavailable");
            setError("No camera found on this device.");
            break;

          case "NotReadableError":
          case "TrackStartError":
            setCameraPermission("unavailable");
            setError(
              "Camera is being used by another application. Please close other apps and try again.",
            );
            break;

          case "OverconstrainedError":
          case "ConstraintNotSatisfiedError":
            // Try with basic constraints
            try {
              const basicStream = await navigator.mediaDevices.getUserMedia({
                video: true,
              });
              basicStream.getTracks().forEach((track) => track.stop());
              setCameraPermission("granted");
              setError("");
              sessionStorage.setItem("cameraPermission", "granted");
            } catch {
              setCameraPermission("unavailable");
              setError("Camera constraints not supported on this device.");
            }
            break;

          case "NotSupportedError":
            setCameraPermission("unavailable");
            setError(
              `Camera not supported in ${platformInfo.browser} on ${platformInfo.os}.`,
            );
            break;

          default:
            setCameraPermission("unavailable");
            setError(getPlatformSpecificErrorMessage("unavailable"));
        }
      } else {
        setCameraPermission("unavailable");
        setError("Camera access failed. Please try again.");
      }
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
      setError(
        "Please enable location services to verify your attendance position",
      );
    }
  };

  const stopScanning = async () => {
    try {
      if (qrScanner && qrScanner.isScanning) {
        await qrScanner.stop();
        await qrScanner.clear();
      }
    } catch (err) {
      console.error("Error stopping scanner:", err);
    } finally {
      setQrScanner(null);
      setScanning(false);
    }
  };

  const startScanning = async () => {
    try {
      await stopScanning();
      setError("");

      // Check if we're in development mode for additional logging
      const isDev = import.meta.env.DEV;
      if (isDev) {
        console.log(
          `Starting QR scanner on ${platformInfo.os} ${platformInfo.browser}`,
        );
        console.log("Platform info:", platformInfo);
        console.log("Secure context:", secureContext);
        console.log("QR reader ref exists:", !!qrReaderRef.current);
        console.log(
          "DOM element exists:",
          !!document.getElementById("qr-reader"),
        );
      }

      // Wait for the DOM to be ready
      if (!qrReaderRef.current || !document.getElementById("qr-reader")) {
        if (isDev) console.error("QR reader element not found in DOM");

        // Try again after a short delay
        setTimeout(() => {
          if (document.getElementById("qr-reader")) {
            if (isDev) console.log("QR reader element found after delay");
            startScanning();
          } else {
            setError("QR reader element not found. Please try again.");
          }
        }, 500);
        return;
      }

      // Create scanner with platform-optimized options
      const scanner = new Html5Qrcode("qr-reader", {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: isDev,
        useBarCodeDetectorIfSupported: true, // Use native barcode detector if available
      });

      // Platform-optimized configuration
      const config = {
        fps: platformInfo.isMobile ? 15 : 10, // Higher FPS on mobile for better performance
        qrbox: platformInfo.isMobile
          ? {
              width: Math.min(250, window.innerWidth * 0.7),
              height: Math.min(250, window.innerWidth * 0.7),
            }
          : { width: 250, height: 250 },
        aspectRatio: 1.0,
        disableFlip: platformInfo.isIOS, // Disable flip on iOS for better performance
        videoConstraints: {
          facingMode: platformInfo.isMobile ? { ideal: "environment" } : "user",
          width: { ideal: platformInfo.isMobile ? 1280 : 640 },
          height: { ideal: platformInfo.isMobile ? 720 : 480 },
        },
      };

      // Use selected camera if available, otherwise use platform-appropriate default
      const cameraId =
        selectedCamera ||
        (platformInfo.isMobile ? { facingMode: "environment" } : "user");

      if (isDev) console.log("Starting scanner with camera ID:", cameraId);
      if (isDev) console.log("Scanner config:", config);

      await scanner.start(
        cameraId,
        config,
        (decodedText) => {
          if (isDev) console.log("QR code detected:", decodedText);
          handleScan(decodedText);
        },
        (errorMessage) => {
          // Only log non-critical errors
          if (isDev && !errorMessage.includes("No QR code found")) {
            console.log("QR Scanner warning:", errorMessage);
          }
        },
      );

      setQrScanner(scanner);
      setScanning(true);
      if (isDev) console.log("QR scanner started successfully");
    } catch (err) {
      console.error("Error starting scanner:", err);

      // Platform-specific error handling
      let errorMsg = "Camera access failed. ";
      if (platformInfo.isIOS && platformInfo.browser === "Chrome") {
        errorMsg += "Try using Safari for better camera support on iOS.";
      } else if (!secureContext) {
        errorMsg += "Please access this site via HTTPS.";
      } else {
        errorMsg += "Please check your permissions and try again.";
      }

      setError(errorMsg);
      setCameraPermission("denied");
      setScanning(false);
    }
  };

  const handleScan = async (data: string) => {
    try {
      // Log in development mode
      if (import.meta.env.DEV) {
        console.log("QR code scanned:", data);
      }

      // Handle test mode with mock QR data
      if (TEST_MODE) {
        console.log("TEST MODE: Using mock QR data");
        const mockData = JSON.stringify({
          subjectId: "mock-subject-1",
          timestamp: Date.now(),
          expiresIn: 300, // 5 minutes
          location: {
            lat: 37.7749,
            lng: -122.4194,
          },
        });

        // Simulate successful attendance recording
        console.log("TEST MODE: Simulating attendance recording");

        await stopScanning();
        onSuccess?.(mockData);
        onClose();

        // Show success message
        alert("TEST MODE: Attendance recorded successfully!");
        return;
      }

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

        if (distance > 0.05) {
          // Increased to 50 meters for testing
          setError("You are too far from the class location");
          return;
        }
      }

      // Get current user ID from localStorage
      const userId = localStorage.getItem("userId");
      const supabaseUserId = localStorage.getItem("supabaseUserId");

      // Determine if this is for a subject or temporary class
      const isSubject = qrData.subjectId || qrData.classId;
      const isTemporaryClass = qrData.temporaryClassId;

      // Record attendance in the new timetable system
      try {
        console.log("Recording attendance with data:", {
          user_id: supabaseUserId || userId,
          subject_id: qrData.subjectId || qrData.classId,
          temporary_class_id: qrData.temporaryClassId,
          status: "present",
          location: location
            ? { lat: location.coords.latitude, lng: location.coords.longitude }
            : null,
        });

        // Create attendance record based on type
        const attendanceData: any = {
          student_id: supabaseUserId || userId,
          status: "present",
          qr_content: data,
          location_lat: location?.coords.latitude,
          location_lng: location?.coords.longitude,
          created_at: new Date().toISOString(),
        };

        if (isSubject) {
          attendanceData.subject_id = qrData.subjectId || qrData.classId;
        } else if (isTemporaryClass) {
          attendanceData.temporary_class_id = qrData.temporaryClassId;
        }

        // Try to insert into the attendance_records table
        const { data: insertedData, error: attendanceError } = await supabase
          .from("attendance_records")
          .insert(attendanceData)
          .select();

        if (attendanceError) {
          console.error("Error logging attendance directly:", attendanceError);

          // If direct insert fails, try alternative approach
          if (attendanceError.code === "23505") {
            // Duplicate key error
            console.log("Attendance already recorded");
            // This is not really an error, the student already marked attendance
            await stopScanning();
            onSuccess?.(data);
            onClose();
            return;
          }

          // If direct insert fails, use the edge function as fallback
          try {
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/record-attendance`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                },
                body: JSON.stringify({
                  subjectId: qrData.subjectId || qrData.classId,
                  temporaryClassId: qrData.temporaryClassId,
                  studentId: userId || "current_user_id",
                  status: "present",
                  locationLat: location?.coords.latitude,
                  locationLng: location?.coords.longitude,
                }),
              },
            );

            if (!response.ok) {
              throw new Error(`Edge function returned ${response.status}`);
            }

            console.log("Attendance recorded via edge function");
          } catch (edgeFunctionError) {
            console.error("Edge function error:", edgeFunctionError);
            // Show error to user
            setError("Failed to record attendance. Please try again.");
            return;
          }
        } else {
          console.log("Attendance recorded successfully:", insertedData);
        }
      } catch (attendanceErr) {
        console.error("Error recording attendance:", attendanceErr);
        setError("Failed to record attendance. Please try again.");
        return;
      }

      await stopScanning();
      onSuccess?.(data);
      onClose();
    } catch (err) {
      console.error("Error processing QR code:", err);
      setError("Invalid QR code format. Please try again.");
    }
  };

  const switchCamera = async () => {
    if (availableCameras.length <= 1) {
      setError("No additional cameras available");
      return;
    }

    // Find the index of the current camera
    const currentIndex = availableCameras.findIndex(
      (camera) => camera.id === selectedCamera,
    );
    // Get the next camera in the list (or go back to the first one)
    const nextIndex = (currentIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex].id;

    setSelectedCamera(nextCamera);

    // Restart scanning with the new camera
    await stopScanning();
    setTimeout(() => startScanning(), 500); // Small delay to ensure camera switch
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

  const openBrowserSettings = () => {
    const { os, browser, isMobile } = platformInfo;

    let instructions = "";

    if (os === "iOS") {
      instructions =
        "Go to Settings > Safari > Camera and allow access for this site.";
    } else if (os === "Android") {
      if (browser === "Chrome") {
        instructions =
          "Tap the camera icon in the address bar, or go to Chrome Settings > Site Settings > Camera.";
      } else {
        instructions =
          "Check your browser permissions in Android Settings > Apps > Browser > Permissions.";
      }
    } else if (os === "Windows" || os === "macOS") {
      if (browser === "Chrome") {
        instructions =
          "Click the camera icon in the address bar, or go to Chrome Settings > Privacy and Security > Site Settings > Camera.";
      } else if (browser === "Safari") {
        instructions =
          "Go to Safari > Preferences > Websites > Camera and allow access for this site.";
      } else if (browser === "Firefox") {
        instructions =
          "Click the camera icon in the address bar, or go to Firefox Settings > Privacy & Security > Permissions > Camera.";
      } else if (browser === "Edge") {
        instructions =
          "Click the camera icon in the address bar, or go to Edge Settings > Site Permissions > Camera.";
      } else {
        instructions =
          "Please check your browser settings and enable camera permissions for this site.";
      }
    } else {
      instructions =
        "Please enable camera permissions in your browser settings.";
    }

    alert(`Camera Permission Required\n\n${instructions}`);

    // Try to trigger permission prompt again
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: "camera" as PermissionName })
        .then(() => {
          // Attempt to request permission again
          requestCameraPermission();
        })
        .catch(() => {
          // Fallback - just show instructions
        });
    }
  };

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

          {!secureContext && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Camera requires HTTPS. Please access this site securely.
              </AlertDescription>
            </Alert>
          )}

          {!cameraSupported && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Camera not supported on {platformInfo.os} {platformInfo.browser}
                . Try a different browser or device.
              </AlertDescription>
            </Alert>
          )}

          {cameraPermission === "denied" &&
            cameraSupported &&
            secureContext && (
              <div className="space-y-2">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {getPlatformSpecificErrorMessage("denied")}
                  </AlertDescription>
                </Alert>
                <Button
                  className="w-full"
                  onClick={openBrowserSettings}
                  variant="default"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Fix Camera Settings
                </Button>
              </div>
            )}

          {cameraPermission === "prompt" &&
            cameraSupported &&
            secureContext && (
              <div className="space-y-2">
                <div className="text-center text-sm text-muted-foreground">
                  <p>Camera access required for QR scanning</p>
                  <p className="text-xs mt-1">
                    {platformInfo.os} {platformInfo.browser} •{" "}
                    {platformInfo.isMobile ? "Mobile" : "Desktop"}
                  </p>
                </div>
                <Button
                  className="w-full"
                  onClick={requestCameraPermission}
                  variant="default"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Allow Camera Access
                </Button>
              </div>
            )}

          {cameraPermission === "granted" && !location && (
            <div className="space-y-2">
              <div className="text-center text-sm text-muted-foreground">
                <p>Location verification helps prevent proxy attendance</p>
              </div>
              <Button
                className="w-full"
                onClick={requestLocationPermission}
                variant="outline"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Enable Location Services
              </Button>
            </div>
          )}

          <div className="w-full h-[400px] bg-muted rounded-lg overflow-hidden relative">
            {/* Always render the QR reader element but hide it when not scanning */}
            <div
              id="qr-reader"
              ref={qrReaderRef}
              className={`w-full h-full ${scanning ? "block" : "hidden"}`}
            />
            {!scanning && (
              <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                <Camera className="h-8 w-8 text-muted-foreground" />
                {TEST_MODE && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-2">
                      Test Mode Active
                    </p>
                    <Button
                      onClick={() =>
                        handleScan(
                          JSON.stringify({
                            subjectId: "mock-subject-1",
                            timestamp: Date.now(),
                            expiresIn: 300,
                            location: { lat: 37.7749, lng: -122.4194 },
                          }),
                        )
                      }
                      variant="outline"
                      size="sm"
                    >
                      Simulate QR Scan
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Camera switch button */}
            {scanning && availableCameras.length > 1 && (
              <Button
                className="absolute bottom-4 right-4 rounded-full"
                size="icon"
                variant="secondary"
                onClick={switchCamera}
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Status indicators */}
          <div className="space-y-2">
            <div className="flex gap-2 justify-center flex-wrap">
              {/* Platform indicator */}
              <Badge variant="outline" className="text-xs">
                {platformInfo.isMobile ? (
                  <Smartphone className="mr-1 h-3 w-3" />
                ) : (
                  <Monitor className="mr-1 h-3 w-3" />
                )}
                {platformInfo.os} {platformInfo.browser}
              </Badge>

              {/* Security indicator */}
              {secureContext ? (
                <Badge variant="outline" className="bg-green-50 text-xs">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Secure
                </Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Insecure
                </Badge>
              )}
            </div>

            <div className="flex gap-2 justify-center flex-wrap">
              {/* Camera status */}
              {cameraPermission === "granted" && (
                <Badge variant="outline" className="bg-green-50">
                  <Camera className="mr-1 h-3 w-3" />
                  Camera Ready
                </Badge>
              )}

              {/* Location status */}
              {location && (
                <Badge variant="outline" className="bg-green-50">
                  <MapPin className="mr-1 h-3 w-3" />
                  Location Ready
                </Badge>
              )}

              {/* Available cameras count */}
              {availableCameras.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {availableCameras.length} Camera
                  {availableCameras.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
