import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { DataTable } from "./DataTable";
import { Upload, Download } from "lucide-react";

export function DataEntryDashboard() {
  const [activeTab, setActiveTab] = useState("users");
  const [data, setData] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const columns = {
    users: [
      { key: "name", label: "Name" },
      { key: "email", label: "Email" },
      { key: "role", label: "Role" },
      { key: "department", label: "Department" },
    ],
    classes: [
      { key: "title", label: "Title" },
      { key: "teacher_id", label: "Teacher ID" },
      { key: "start_time", label: "Start Time" },
      { key: "end_time", label: "End Time" },
      { key: "room", label: "Room" },
    ],
    enrollments: [
      { key: "class_id", label: "Class ID" },
      { key: "student_id", label: "Student ID" },
    ],
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setError("");
      setSuccess("");

      const text = await file.text();
      let jsonData;

      try {
        if (file.name.endsWith(".csv")) {
          jsonData = parseCSV(text);
        } else {
          jsonData = JSON.parse(text);
        }
      } catch (err) {
        throw new Error(
          "Invalid file format. Please upload a valid JSON or CSV file.",
        );
      }

      if (!Array.isArray(jsonData)) {
        throw new Error("Data must be an array of records");
      }

      setData(jsonData);
    } catch (err) {
      setError(err.message);
    }
  };

  const parseCSV = (csv: string) => {
    const lines = csv.split("\n");
    const headers = lines[0].split(",").map((h) => h.trim());
    const result = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      const obj = {};
      const currentLine = lines[i].split(",").map((cell) => cell.trim());

      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = currentLine[j];
      }

      result.push(obj);
    }

    return result;
  };

  const handleImport = async () => {
    try {
      setError("");
      setSuccess("");

      const { error } = await supabase.from(activeTab).insert(data);
      if (error) throw error;

      setSuccess(`Successfully imported ${data.length} ${activeTab}`);
      setData([]);
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadTemplate = () => {
    let template;
    const fileType = "csv";

    switch (activeTab) {
      case "users":
        template =
          fileType === "csv"
            ? "name,email,role,department,student_id,teacher_id\nJohn Doe,john@example.com,student,Computer Science,STU001,"
            : JSON.stringify(
                [
                  {
                    name: "John Doe",
                    email: "john@example.com",
                    role: "student",
                    department: "Computer Science",
                    student_id: "STU001",
                  },
                ],
                null,
                2,
              );
        break;

      case "classes":
        template =
          fileType === "csv"
            ? "title,teacher_id,start_time,end_time,room\nIntroduction to Programming,TCH001,09:00,10:30,Room 101"
            : JSON.stringify(
                [
                  {
                    title: "Introduction to Programming",
                    teacher_id: "TCH001",
                    start_time: "09:00",
                    end_time: "10:30",
                    room: "Room 101",
                  },
                ],
                null,
                2,
              );
        break;

      case "enrollments":
        template =
          fileType === "csv"
            ? "class_id,student_id\nCLS001,STU001"
            : JSON.stringify(
                [
                  {
                    class_id: "CLS001",
                    student_id: "STU001",
                  },
                ],
                null,
                2,
              );
        break;
    }

    const blob = new Blob([template], { type: `text/${fileType}` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTab}_template.${fileType}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold">Bulk Data Entry</h1>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 h-14">
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        {["users", "classes", "enrollments"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-6">
            <Card className="p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-semibold capitalize">{tab}</h2>
                  <Button
                    variant="outline"
                    onClick={downloadTemplate}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Template
                  </Button>
                </div>

                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="file">Upload File (JSON or CSV)</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".json,.csv"
                    onChange={handleFileUpload}
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                {data.length > 0 && (
                  <div className="space-y-4">
                    <DataTable data={data} columns={columns[tab]} />
                    <Button onClick={handleImport} className="w-full" size="lg">
                      <Upload className="mr-2 h-4 w-4" />
                      Import {data.length} {tab}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
