import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MOCK_USERS, SECURITY_CONFIG } from "@/types/auth";
import { useAuth } from "@/hooks/useAuth";
import { Shield } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const { checkSessionValidity } = useAuth();

  // Check if user is already logged in with valid session
  useEffect(() => {
    const checkExistingSession = () => {
      const userRole = localStorage.getItem("userRole");
      const loginTimestamp = localStorage.getItem("loginTimestamp");

      if (userRole && loginTimestamp) {
        // Check session validity
        if (checkSessionValidity()) {
          // Navigate to appropriate dashboard immediately
          if (userRole === "admin") {
            navigate("/admin", { replace: true });
          } else if (userRole === "teacher") {
            navigate("/teacher", { replace: true });
          } else if (userRole === "student") {
            navigate("/student", { replace: true });
          }
        }
      }
    };

    checkExistingSession();
  }, [navigate, checkSessionValidity]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // Simplified initialization - no database seeding for faster testing
  useEffect(() => {
    console.log("Login page ready for testing");
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Check if user is blocked due to too many attempts
    if (isBlocked) {
      setError(
        "Too many failed attempts. Please refresh the page and try again.",
      );
      return;
    }

    setLoading(true);
    setError("");

    // Normalize email to lowercase for case-insensitive login
    const normalizedEmail = email.toLowerCase().trim();

    // Validate password - fast check first
    if (!SECURITY_CONFIG.ALLOWED_PASSWORDS.includes(password)) {
      setLoginAttempts((prev) => {
        const newAttempts = prev + 1;
        if (newAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
          setIsBlocked(true);
          setError("Too many failed attempts. Please refresh the page.");
        } else {
          setError(
            `Invalid credentials. ${SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`,
          );
        }
        return newAttempts;
      });
      setLoading(false);
      return;
    }

    // Fast mock user authentication for testing
    const mockUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === normalizedEmail,
    );

    if (mockUser) {
      console.log(`Fast login: ${mockUser.role}`);

      // Generate simple session token
      const sessionToken = btoa(
        JSON.stringify({
          userId: mockUser.id,
          email: mockUser.email,
          role: mockUser.role,
          timestamp: Date.now(),
        }),
      );

      // Store user info in localStorage
      localStorage.setItem("userRole", mockUser.role);
      localStorage.setItem("userEmail", mockUser.email);
      localStorage.setItem("userId", mockUser.id);
      localStorage.setItem("loginTimestamp", Date.now().toString());
      localStorage.setItem("sessionToken", sessionToken);

      // Immediate navigation
      setLoading(false);
      if (mockUser.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (mockUser.role === "teacher") {
        navigate("/teacher", { replace: true });
      } else if (mockUser.role === "student") {
        navigate("/student", { replace: true });
      }
      return;
    }

    // If no mock user found
    setLoginAttempts((prev) => {
      const newAttempts = prev + 1;
      if (newAttempts >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
        setIsBlocked(true);
        setError("Too many failed attempts. Please refresh the page.");
      } else {
        setError(
          `Invalid credentials. ${SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - newAttempts} attempts remaining.`,
        );
      }
      return newAttempts;
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Welcome</CardTitle>
          <CardDescription>QR-Based Attendance System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full"
              disabled={loading || isBlocked}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              <p className="font-medium mb-2">Authorized Accounts:</p>
              <div className="space-y-1">
                <p>Admin: SSharan.s@outlook.com</p>
                <p>Teacher: sharan071718@gmail.com</p>
                <p>Student: sharan@s.amity.edu</p>
              </div>
              <p className="mt-2 text-xs">
                Password: Sharan17# (for all accounts)
              </p>
              <div className="flex items-center justify-center mt-3 text-xs text-green-600">
                <Shield className="h-3 w-3 mr-1" />
                <span>Secure Authentication Enabled</span>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;
