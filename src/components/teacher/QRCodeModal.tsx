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

// ... rest of the file ...