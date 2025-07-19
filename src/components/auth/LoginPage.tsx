import { useState } from "react";
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
import { Shield } from "lucide-react";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  // useEffect(() => { ... }, []);
  // useEffect(() => { ... }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-3xl font-bold">Welcome</CardTitle>
          <CardDescription>QR-Based Attendance System</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
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
