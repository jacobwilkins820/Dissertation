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
import AttendanceRegisterPage from "./pages/AttendanceRegisterPage";
import GuardiansSearchPage from "./pages/GuardiansSearchPage";
import GuardianDetailPage from "./pages/GuardianDetailPage";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";

// App routes with permission gating + layout composition.
// Main router tree and access control rules.
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
  const canCreateStudent = hasPermission(
    permissionLevel,
    Permissions.CREATE_STUDENT
  );
  const canCreateUser = hasPermission(permissionLevel, Permissions.CREATE_USER);
  const isAdmin = (user?.roleName ?? "").toUpperCase() === "ADMIN";
  const canAccessGuardians =
    isAdmin ||
    user?.guardianId != null ||
    hasPermission(permissionLevel, Permissions.VIEW_GUARDIAN_CONTACT);
  const canSearchGuardians =
    isAdmin ||
    (hasPermission(permissionLevel, Permissions.VIEW_GUARDIAN_CONTACT) &&
      user?.guardianId == null);

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
            path="/attendance/:classId"
            element={canViewClasses ? <AttendanceRegisterPage /> : <Forbidden />}
          />

          <Route
            path="/guardians"
            element={canSearchGuardians ? <GuardiansSearchPage /> : <Forbidden />}
          />
          <Route
            path="/guardians/:guardianId"
            element={canAccessGuardians ? <GuardianDetailPage /> : <Forbidden />}
          />
          <Route
            path="/guardian/me"
            element={
              user?.guardianId != null ? (
                <GuardianDetailPage self />
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

// Simple forbidden banner for protected routes.
function Forbidden() {
  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
      You do not have permission to access this page.
    </div>
  );
}
