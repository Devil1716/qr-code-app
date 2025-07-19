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
  return (
    <div>
      <h1>Welcome</h1>
      <div>QR-Based Attendance System</div>
    </div>
  );
};
export default LoginPage;
