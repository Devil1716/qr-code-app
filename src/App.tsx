import { Suspense } from "react";
import { useRoutes, Routes, Route } from "react-router-dom";
import TeacherDashboard from "./components/home";
import LoginPage from "./components/auth/LoginPage";
import StudentDashboard from "./components/student/StudentDashboard";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import routes from "tempo-routes";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      {/* For the tempo routes */}
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}

      <Routes>
        {/* Make login the main landing page */}
        <Route path="/" element={<LoginPage />} />

        {/* Protected routes */}
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />

        {/* Add this before any catchall route */}
        {import.meta.env.VITE_TEMPO === "true" && <Route path="/tempobook/*" />}
      </Routes>
    </Suspense>
  );
}

export default App;
