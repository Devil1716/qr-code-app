import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RefreshCw, Database, Check, AlertCircle } from "lucide-react";
import {
  checkDatabaseConnection,
  getDatabaseStats,
} from "@/lib/api/database-status";
import { supabase } from "@/lib/supabase";

interface TableStat {
  table: string;
  count: number;
  error: string | null;
}

export default function DatabaseDashboard() {
  const [connectionStatus, setConnectionStatus] = useState<
    "checking" | "connected" | "error"
  >("checking");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [tableStats, setTableStats] = useState<TableStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [supabaseUrl, setSupabaseUrl] = useState<string>("");

  useEffect(() => {
    checkConnection();
    // Extract Supabase URL from environment
    const url = import.meta.env.VITE_SUPABASE_URL || "";
    setSupabaseUrl(url);
  }, []);

  const checkConnection = async () => {
    setConnectionStatus("checking");
    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await checkDatabaseConnection();

      if (result.connected) {
        setConnectionStatus("connected");
        // Get table statistics
        const statsResult = await getDatabaseStats();
        if (statsResult.success) {
          setTableStats(statsResult.stats);
        }
      } else {
        setConnectionStatus("error");
        setErrorMessage(result.error || "Unknown connection error");
      }
    } catch (err: any) {
      setConnectionStatus("error");
      setErrorMessage(err.message || "Failed to check connection");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-background min-h-screen">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Database Dashboard</h1>
          <Button
            onClick={checkConnection}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="mr-2 h-5 w-5" />
              Connection Status
            </CardTitle>
            <CardDescription>
              {supabaseUrl ? (
                <span>
                  Connected to:{" "}
                  <code className="bg-muted px-1 py-0.5 rounded">
                    {supabaseUrl}
                  </code>
                </span>
              ) : (
                <span>Supabase URL not configured</span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connectionStatus === "checking" && (
              <Alert>
                <AlertDescription>
                  Checking database connection...
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus === "connected" && (
              <Alert className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <AlertDescription className="text-green-800">
                  Successfully connected to Supabase database!
                </AlertDescription>
              </Alert>
            )}

            {connectionStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>
                  Failed to connect to database: {errorMessage}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="tables">
          <TabsList>
            <TabsTrigger value="tables">Tables</TabsTrigger>
            <TabsTrigger value="queries">Test Queries</TabsTrigger>
          </TabsList>

          <TabsContent value="tables" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Tables</CardTitle>
                <CardDescription>
                  Overview of tables and record counts in your Supabase database
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table Name</TableHead>
                      <TableHead>Record Count</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableStats.length > 0 ? (
                      tableStats.map((stat) => (
                        <TableRow key={stat.table}>
                          <TableCell className="font-medium">
                            {stat.table}
                          </TableCell>
                          <TableCell>
                            {stat.error ? "N/A" : stat.count}
                          </TableCell>
                          <TableCell>
                            {stat.error ? (
                              <Badge variant="destructive">{stat.error}</Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-50">
                                <Check className="mr-1 h-3 w-3" />
                                Available
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : connectionStatus === "connected" ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-4 text-muted-foreground"
                        >
                          No table statistics available
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="text-center py-4 text-muted-foreground"
                        >
                          Connect to database to view tables
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="queries" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Queries</CardTitle>
                <CardDescription>
                  Run test queries to verify database functionality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase
                          .from("users")
                          .select("*")
                          .limit(5);
                        console.log("Users query result:", { data, error });
                        alert(
                          error
                            ? `Error: ${error.message}`
                            : `Success! Found ${data?.length || 0} users`,
                        );
                      } catch (err: any) {
                        console.error("Query error:", err);
                        alert(`Error: ${err.message}`);
                      }
                    }}
                    disabled={connectionStatus !== "connected"}
                  >
                    Test Users Query
                  </Button>

                  <Button
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase
                          .from("attendance")
                          .select("*")
                          .limit(5);
                        console.log("Attendance query result:", {
                          data,
                          error,
                        });
                        alert(
                          error
                            ? `Error: ${error.message}`
                            : `Success! Found ${data?.length || 0} attendance records`,
                        );
                      } catch (err: any) {
                        console.error("Query error:", err);
                        alert(`Error: ${err.message}`);
                      }
                    }}
                    disabled={connectionStatus !== "connected"}
                  >
                    Test Attendance Query
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
