import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Trophy, Medal, Award, Plus, Edit, Trash2, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";

interface StudentRanking {
  id: string;
  student_id: string;
  skills: string[];
  grade: number;
  certificates: string[];
  competitions_won: number;
  total_score: number;
  rank_position: number;
  student_name?: string;
  student_email?: string;
}

interface RankingFormData {
  student_id: string;
  skills: string;
  grade: number;
  certificates: string;
  competitions_won: number;
}

export function StudentRanking() {
  const [rankings, setRankings] = useState<StudentRanking[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRanking, setEditingRanking] = useState<StudentRanking | null>(
    null,
  );
  const [formData, setFormData] = useState<RankingFormData>({
    student_id: "",
    skills: "",
    grade: 0,
    certificates: "",
    competitions_won: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRankings();
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "student");

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    }
  };

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("student_rankings")
        .select(
          `
          *,
          users!student_rankings_student_id_fkey(name, email)
        `,
        )
        .order("rank_position", { ascending: true });

      if (error) throw error;

      const formattedData =
        data?.map((item) => ({
          ...item,
          student_name: item.users?.name,
          student_email: item.users?.email,
        })) || [];

      setRankings(formattedData);
    } catch (error) {
      console.error("Error fetching rankings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch student rankings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const skillsArray = formData.skills
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);
      const certificatesArray = formData.certificates
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s);

      const rankingData = {
        student_id: formData.student_id,
        skills: skillsArray,
        grade: formData.grade,
        certificates: certificatesArray,
        competitions_won: formData.competitions_won,
      };

      let error;
      if (editingRanking) {
        ({ error } = await supabase
          .from("student_rankings")
          .update(rankingData)
          .eq("id", editingRanking.id));
      } else {
        ({ error } = await supabase
          .from("student_rankings")
          .insert([rankingData]));
      }

      if (error) throw error;

      toast({
        title: "Success",
        description: `Student ranking ${editingRanking ? "updated" : "created"} successfully`,
      });

      setDialogOpen(false);
      resetForm();
      fetchRankings();
    } catch (error) {
      console.error("Error saving ranking:", error);
      toast({
        title: "Error",
        description: "Failed to save student ranking",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (ranking: StudentRanking) => {
    setEditingRanking(ranking);
    setFormData({
      student_id: ranking.student_id,
      skills: ranking.skills.join(", "),
      grade: ranking.grade,
      certificates: ranking.certificates.join(", "),
      competitions_won: ranking.competitions_won,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ranking?")) return;

    try {
      const { error } = await supabase
        .from("student_rankings")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student ranking deleted successfully",
      });

      fetchRankings();
    } catch (error) {
      console.error("Error deleting ranking:", error);
      toast({
        title: "Error",
        description: "Failed to delete student ranking",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: "",
      skills: "",
      grade: 0,
      certificates: "",
      competitions_won: 0,
    });
    setEditingRanking(null);
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <Star className="h-5 w-5 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading student rankings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-background p-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Student Rankings
          </h2>
          <p className="text-muted-foreground">
            Manage and view student rankings based on skills, grades,
            certificates, and competitions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Ranking
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingRanking
                  ? "Edit Student Ranking"
                  : "Add Student Ranking"}
              </DialogTitle>
              <DialogDescription>
                Enter the student's academic and extracurricular achievements to
                calculate their ranking.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="student">Student</Label>
                <select
                  id="student"
                  className="w-full p-2 border rounded-md"
                  value={formData.student_id}
                  onChange={(e) =>
                    setFormData({ ...formData, student_id: e.target.value })
                  }
                  required
                  disabled={!!editingRanking}
                >
                  <option value="">Select a student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} ({student.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="grade">Grade (0-100)</Label>
                <Input
                  id="grade"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.grade}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      grade: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Textarea
                  id="skills"
                  placeholder="e.g., JavaScript, Python, React, Node.js"
                  value={formData.skills}
                  onChange={(e) =>
                    setFormData({ ...formData, skills: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificates">
                  Certificates (comma-separated)
                </Label>
                <Textarea
                  id="certificates"
                  placeholder="e.g., AWS Certified, Google Cloud, Microsoft Azure"
                  value={formData.certificates}
                  onChange={(e) =>
                    setFormData({ ...formData, certificates: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="competitions">Competitions Won</Label>
                <Input
                  id="competitions"
                  type="number"
                  min="0"
                  value={formData.competitions_won}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      competitions_won: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRanking ? "Update" : "Create"} Ranking
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Rankings Leaderboard</CardTitle>
          <CardDescription>
            Rankings are calculated based on: Grade (40%), Skills (10% each),
            Certificates (15% each), Competitions (25% each)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {rankings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No student rankings found.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Add your first student ranking to get started.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>Certificates</TableHead>
                  <TableHead>Competitions</TableHead>
                  <TableHead>Total Score</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rankings.map((ranking) => (
                  <TableRow key={ranking.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getRankIcon(ranking.rank_position)}
                        <span className="font-semibold">
                          #{ranking.rank_position}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {ranking.student_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {ranking.student_email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ranking.grade}%</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ranking.skills.slice(0, 3).map((skill, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {skill}
                          </Badge>
                        ))}
                        {ranking.skills.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{ranking.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ranking.certificates.slice(0, 2).map((cert, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {cert}
                          </Badge>
                        ))}
                        {ranking.certificates.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{ranking.certificates.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        {ranking.competitions_won}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-lg">
                        {ranking.total_score.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(ranking)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(ranking.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default StudentRanking;
