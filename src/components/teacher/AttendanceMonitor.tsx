import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Brain,
  Users,
  Volume2,
  Eye,
  Hand,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  Send,
  MessageSquare,
  Target,
  Lightbulb,
  Timer,
  Award,
  Gamepad2,
} from "lucide-react";
import {
  getEngagementAlerts,
  getEngagementData,
  resolveEngagementAlert,
  sendTargetedIntervention,
  getInterventionHistory,
  triggerEngagementBooster,
} from "@/lib/api/attendance-api";