import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle,
  XCircle,
  Users,
  BookOpen,
  Calendar,
  Database,
} from "lucide-react";

interface TestResult {
  name: string;
  status: "success" | "error" | "loading";
  message: string;
  data?: any;
}

export function MockDataTest() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const testResults: TestResult[] = [];

    // Test 1: Database Connection
    try {
      const { data, error } = await supabase
        .from("users")
        .select("count")
        .limit(1);
      testResults.push({
        name: "Database Connection",
        status: error ? "error" : "success",
        message: error ? error.message : "Connected successfully",
        data: data,
      });
    } catch (err: any) {
      testResults.push({
        name: "Database Connection",
        status: "error",
        message: err.message || "Connection failed",
      });
    }

    // Test 2: Users Table
    try {
      const { data: users, error } = await supabase
        .from("users")
        .select("*")
        .limit(10);

      testResults.push({
        name: "Users Table",
        status: error ? "error" : "success",
        message: error ? error.message : `Found ${users?.length || 0} users`,
        data: users,
      });
    } catch (err: any) {
      testResults.push({
        name: "Users Table",
        status: "error",
        message: err.message || "Failed to fetch users",
      });
    }

    // Test 3: Classes Table
    try {
      const { data: classes, error } = await supabase
        .from("classes")
        .select("*, users!classes_teacher_id_fkey(name, teacher_id)")
        .limit(10);

      testResults.push({
        name: "Classes Table",
        status: error ? "error" : "success",
        message: error
          ? error.message
          : `Found ${classes?.length || 0} classes`,
        data: classes,
      });
    } catch (err: any) {
      testResults.push({
        name: "Classes Table",
        status: "error",
        message: err.message || "Failed to fetch classes",
      });
    }

    // Test 4: Class Enrollments
    try {
      const { data: enrollments, error } = await supabase
        .from("class_enrollments")
        .select(
          `
          *,
          users!class_enrollments_student_id_fkey(name, email, image_url),
          classes!class_enrollments_class_id_fkey(title, room)
        `,
        )
        .limit(10);

      testResults.push({
        name: "Class Enrollments",
        status: error ? "error" : "success",
        message: error
          ? error.message
          : `Found ${enrollments?.length || 0} enrollments`,
        data: enrollments,
      });
    } catch (err: any) {
      testResults.push({
        name: "Class Enrollments",
        status: "error",
        message: err.message || "Failed to fetch enrollments",
      });
    }

    // Test 5: Attendance Records
    try {
      const { data: attendance, error } = await supabase
        .from("attendance_records")
        .select(
          `
          *,
          users!attendance_records_student_id_fkey(name, email, image_url),
          classes!attendance_records_class_id_fkey(title, room)
        `,
        )
        .limit(10);

      testResults.push({
        name: "Attendance Records",
        status: error ? "error" : "success",
        message: error
          ? error.message
          : `Found ${attendance?.length || 0} attendance records`,
        data: attendance,
      });
    } catch (err: any) {
      testResults.push({
        name: "Attendance Records",
        status: "error",
        message: err.message || "Failed to fetch attendance",
      });
    }

    setTests(testResults);
    setLoading(false);
  };

  useEffect(() => {
    runTests();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return (
          <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
    }
  };

  const getTestIcon = (testName: string) => {
    switch (testName) {
      case "Database Connection":
        return <Database className="h-4 w-4" />;
      case "Users Table":
        return <Users className="h-4 w-4" />;
      case "Classes Table":
        return <BookOpen className="h-4 w-4" />;
      case "Class Enrollments":
        return <Users className="h-4 w-4" />;
      case "Attendance Records":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6 bg-white p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mock Data Test</h2>
          <p className="text-muted-foreground">
            Testing database connectivity and mock data integrity
          </p>
        </div>
        <Button onClick={runTests} disabled={loading}>
          {loading ? "Running Tests..." : "Run Tests Again"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tests.map((test, index) => (
          <Card
            key={index}
            className={`border-l-4 ${
              test.status === "success"
                ? "border-l-green-500"
                : test.status === "error"
                  ? "border-l-red-500"
                  : "border-l-blue-500"
            }`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  {getTestIcon(test.name)}
                  <span>{test.name}</span>
                </div>
                {getStatusIcon(test.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-sm ${
                  test.status === "success"
                    ? "text-green-600"
                    : test.status === "error"
                      ? "text-red-600"
                      : "text-blue-600"
                }`}
              >
                {test.message}
              </p>

              {test.data && test.data.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Sample Data:
                  </p>
                  <div className="space-y-1">
                    {test.data.slice(0, 3).map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center space-x-2 text-xs"
                      >
                        {item.image_url && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={item.image_url} />
                            <AvatarFallback>
                              {item.name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div className="flex-1 truncate">
                          <p className="font-medium">
                            {item.name || item.title || item.room}
                          </p>
                          <p className="text-muted-foreground">
                            {item.email ||
                              item.room ||
                              item.description ||
                              item.role}
                          </p>
                        </div>
                        {item.role && (
                          <Badge variant="outline" className="text-xs">
                            {item.role}
                          </Badge>
                        )}
                        {item.status && (
                          <Badge
                            variant={
                              item.status === "present"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {item.status}
                          </Badge>
                        )}
                      </div>
                    ))}
                    {test.data.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        ...and {test.data.length - 3} more
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Test Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {tests.filter((t) => t.status === "success").length}
              </p>
              <p className="text-sm text-muted-foreground">Passed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {tests.filter((t) => t.status === "error").length}
              </p>
              <p className="text-sm text-muted-foreground">Failed</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{tests.length}</p>
              <p className="text-sm text-muted-foreground">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MockDataTest;
