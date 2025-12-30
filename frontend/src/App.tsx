import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import LoginPage from "./pages/LoginPage";

import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";

export default function App() {
  return (
    <Routes>
      {/* Public (no navbar) */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<div>Register page (todo)</div>} />
      </Route>

      {/* Protected (navbar always visible) */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          {/* Default protected landing page */}
          <Route path="/" element={<Navigate to="/students" replace />} />

          <Route
            path="/students"
            element={
              <div style={{ padding: 16 }}>Students page (protected)</div>
            }
          />

          {/* placeholders */}
          <Route
            path="/classes"
            element={<div style={{ padding: 16 }}>Classes (protected)</div>}
          />
          <Route
            path="/attendance"
            element={<div style={{ padding: 16 }}>Attendance (protected)</div>}
          />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
