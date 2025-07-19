import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { recordAttendance, getClassStudents } from "@/lib/api/attendance-api";

// ... rest of the file ...