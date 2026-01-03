import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { useAuth } from "./auth/UseAuth";
import { hasPermission, Permissions } from "./utils/permissions";

import LoginPage from "./pages/LoginPage";
import RegisterUser from "./pages/RegisterUserPage";
import RegisterStudent from "./pages/RegisterStudentPage";
import StudentDirectoryPage from "./pages/StudentDirectoryPage";
import StudentPage from "./pages/StudentPage";
import ClassesPage from "./pages/ClassesPage";
import ClassDetailPage from "./pages/ClassDetailPage";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";

export default function App() {
  const { user } = useAuth();
  const permissionLevel = user?.permissionLevel ?? 0;
  const canViewStudents = hasPermission(
    permissionLevel,
    Permissions.VIEW_STUDENT_DIRECTORY
  );
  const canViewStudentDetails = hasPermission(
    permissionLevel,
    Permissions.VIEW_STUDENT_DETAILS
  );
  const canViewClasses = hasPermission(
    permissionLevel,
    Permissions.VIEW_CLASSES
  );
  const canViewAttendance = hasPermission(
    permissionLevel,
    Permissions.VIEW_ATTENDANCE
  );
  const canCreateStudent = hasPermission(
    permissionLevel,
    Permissions.CREATE_STUDENT
  );
  const canCreateUser = hasPermission(permissionLevel, Permissions.CREATE_USER);

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
          <Route
            path="/"
            element={
              <Navigate
                to={
                  canViewStudents
                    ? "/studentDirectory"
                    : canViewClasses
                      ? "/classes"
                      : canViewAttendance
                        ? "/attendance"
                        : "/login"
                }
                replace
              />
            }
          />

          <Route
            path="/register-user"
            element={canCreateUser ? <RegisterUser /> : <Forbidden />}
          />
          <Route
            path="/register-student"
            element={canCreateStudent ? <RegisterStudent /> : <Forbidden />}
          />

          <Route
            path="/studentDirectory"
            element={canViewStudents ? <StudentDirectoryPage /> : <Forbidden />}
          />
          <Route
            path="/student/:studentId"
            element={
              canViewStudentDetails ? <StudentPage /> : <Forbidden />
            }
          />

          {/* placeholders */}
          <Route
            path="/classes"
            element={
              canViewClasses ? <ClassesPage /> : <Forbidden />
            }
          />
          <Route
            path="/classes/:classId"
            element={canViewClasses ? <ClassDetailPage /> : <Forbidden />}
          />
          <Route
            path="/attendance"
            element={
              canViewAttendance ? (
                <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 text-sm text-slate-300 shadow-2xl shadow-black/30">
                  Attendance (protected)
                </div>
              ) : (
                <Forbidden />
              )
            }
          />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function Forbidden() {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
      You do not have permission to access this page.
    </div>
  );
}
