import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";

import LoginPage from "./pages/LoginPage";
import RegisterUser from "./pages/RegisterUserPage";
import RegisterStudent from "./pages/RegisterStudentPage";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";

export default function App() {
  return (
    <Routes>
      {/* Public (no navbar) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected (navbar always visible) */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          {/* Default protected landing page */}
          <Route path="/" element={<Navigate to="/students" replace />} />

          <Route path="/register-user" element={<RegisterUser />} />
          <Route path="/register-student" element={<RegisterStudent />} />

          <Route
            path="/students"
            element={
              <div className="p-4">Students page (protected)</div>
            }
          />

          {/* placeholders */}
          <Route
            path="/classes"
            element={<div className="p-4">Classes (protected)</div>}
          />
          <Route
            path="/attendance"
            element={<div className="p-4">Attendance (protected)</div>}
          />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
