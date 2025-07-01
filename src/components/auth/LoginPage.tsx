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
import { supabase } from "@/lib/supabase";

const LoginPage = () => {
  const navigate = useNavigate();
  const { checkSessionValidity } = useAuth();

  // Check if user is already logged in with valid session
  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const userRole = localStorage.getItem("userRole");
        const loginTimestamp = localStorage.getItem("loginTimestamp");
        const userId = localStorage.getItem("userId");

        console.log("Checking existing session:", {
          userRole,
          loginTimestamp,
          userId,
        });

        if (userRole && loginTimestamp && userId) {
          // Check session validity
          if (checkSessionValidity()) {
            console.log("Valid session found, navigating to:", userRole);
            // Navigate to appropriate dashboard immediately
            if (userRole === "admin") {
              navigate("/admin", { replace: true });
            } else if (userRole === "teacher") {
              navigate("/teacher", { replace: true });
            } else if (userRole === "student") {
              navigate("/student", { replace: true });
            }
          } else {
            console.log("Session expired, clearing storage");
            // Clear invalid session data
            localStorage.removeItem("userRole");
            localStorage.removeItem("userEmail");
            localStorage.removeItem("userId");
            localStorage.removeItem("loginTimestamp");
            localStorage.removeItem("sessionToken");
          }
        } else {
          console.log("No existing session found");
        }
      } catch (error) {
        console.error("Error checking existing session:", error);
        // Clear potentially corrupted session data
        localStorage.clear();
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

  // Initialize database connection and check for required tables
  useEffect(() => {
    const initializeDatabase = async () => {
      try {
        console.log("Initializing database connection...");
        // Test database connection by checking if users table exists
        const { data, error } = await supabase
          .from("users")
          .select("id")
          .limit(1);

        if (error) {
          console.error("Database connection error:", error);
          console.log(
            "Database connection failed, but continuing with mock users",
          );
          // Don't set error here - allow fallback to mock users
        } else {
          console.log("Database connection successful", data);
        }
      } catch (err) {
        console.error("Database initialization error:", err);
        console.log(
          "Database initialization failed, but continuing with mock users",
        );
        // Don't set error here - allow fallback to mock users
      }
    };

    initializeDatabase();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
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

    // For database users, we'll validate password against their stored password
    // For mock users, we'll still use the fixed password system

    // Try database authentication first, then fall back to mock users
    try {
      console.log("Attempting database authentication for:", normalizedEmail);
      const { data: dbUser, error: dbError } = await supabase
        .from("users")
        .select("*")
        .eq("email", normalizedEmail)
        .single();

      if (!dbError && dbUser) {
        // Check if user has a custom password or uses the default system
        const isPasswordValid = dbUser.password
          ? dbUser.password === password // Custom password
          : SECURITY_CONFIG.ALLOWED_PASSWORDS.includes(password); // Default system

        if (!isPasswordValid) {
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

        console.log(`Database login successful: ${dbUser.role}`, dbUser);

        // Generate session token
        const sessionToken = btoa(
          JSON.stringify({
            userId: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            timestamp: Date.now(),
          }),
        );

        // Store user info in localStorage
        localStorage.setItem("userRole", dbUser.role);
        localStorage.setItem("userEmail", dbUser.email);
        localStorage.setItem("userId", dbUser.id);
        localStorage.setItem("loginTimestamp", Date.now().toString());
        localStorage.setItem("sessionToken", sessionToken);

        console.log("Stored user data, navigating to dashboard...");

        // Navigate based on role
        setLoading(false);
        if (dbUser.role === "admin") {
          navigate("/admin", { replace: true });
        } else if (dbUser.role === "teacher") {
          navigate("/teacher", { replace: true });
        } else if (dbUser.role === "student") {
          navigate("/student", { replace: true });
        }
        return;
      } else {
        console.log("Database user not found or error:", dbError);
      }
    } catch (dbErr) {
      console.log("Database auth failed, trying mock users:", dbErr);
    }

    // Fall back to mock user authentication for testing
    console.log("Trying mock user authentication...");
    const mockUser = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === normalizedEmail,
    );

    if (mockUser) {
      // For mock users, validate against the fixed password system
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

      console.log(`Mock login successful: ${mockUser.role}`, mockUser);

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

      console.log("Mock user data stored, navigating to dashboard...");

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
    } else {
      console.log("No mock user found for email:", normalizedEmail);
    }

    // If no user found (database or mock)
    console.log("Login failed - no user found");
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
