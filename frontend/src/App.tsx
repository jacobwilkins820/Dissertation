import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";
import { useAuth } from "./auth/UseAuth";
import { hasPermission, Permissions } from "./utils/permissions";
import { StateMessage } from "./components/StateMessage";
import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterUser = lazy(() => import("./pages/RegisterUserPage"));
const RegisterStudent = lazy(() => import("./pages/RegisterStudentPage"));
const StudentDirectoryPage = lazy(() => import("./pages/StudentDirectoryPage"));
const StudentPage = lazy(() => import("./pages/student/StudentPage"));
const ClassesPage = lazy(() => import("./pages/ClassesPage"));
const AddClassPage = lazy(() => import("./pages/AddClassPage"));
const ClassDetailPage = lazy(() => import("./pages/ClassDetailPage"));
const AttendanceRegisterPage = lazy(() => import("./pages/AttendanceRegisterPage"));
const GuardiansSearchPage = lazy(() => import("./pages/GuardiansSearchPage"));
const GuardianDetailPage = lazy(() => import("./pages/GuardianDetailPage"));
const StatisticsPage = lazy(() => import("./pages/StatisticsPage"));
const HomePage = lazy(() => import("./pages/HomePage"));

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
  const canCreateClass = isAdmin && canViewClasses;
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
        <Route
          path="/login"
          element={
            <Suspense fallback={<PageFallback />}>
              <LoginPage />
            </Suspense>
          }
        />
      </Route>

      {/* Protected (navbar always visible) */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          {/* Default protected landing page */}
          <Route path="/" element={<Navigate to="/home" replace />} />

          <Route
            path="/home"
            element={
              <Suspense fallback={<PageFallback />}>
                <HomePage />
              </Suspense>
            }
          />

          <Route
            path="/register-user"
            element={
              canCreateUser ? (
                <Suspense fallback={<PageFallback />}>
                  <RegisterUser />
                </Suspense>
              ) : (
                <Forbidden />
              )
            }
          />
          <Route
            path="/register-student"
            element={
              canCreateStudent ? (
                <Suspense fallback={<PageFallback />}>
                  <RegisterStudent />
                </Suspense>
              ) : (
                <Forbidden />
              )
            }
          />

          <Route
            path="/studentDirectory"
            element={
              canViewStudents ? (
                <Suspense fallback={<PageFallback />}>
                  <StudentDirectoryPage />
                </Suspense>
              ) : (
                <Forbidden />
              )
            }
          />
          <Route
            path="/student/:studentId"
            element={
              canViewStudentDetails ? (
                <Suspense fallback={<PageFallback />}>
                  <StudentPage />
                </Suspense>
              ) : (
                <Forbidden />
              )
            }
          />

          {/* placeholders */}
          <Route
            path="/classes"
            element={
              canViewClasses ? (
                <Suspense fallback={<PageFallback />}>
                  <ClassesPage />
                </Suspense>
              ) : (
                <Forbidden />
              )
            }
          />
          <Route
            path="/classes/new"
            element={
              canCreateClass ? (
                <Suspense fallback={<PageFallback />}>
                  <AddClassPage />
                </Suspense>
              ) : (
                <Forbidden />
              )
            }
          />
          <Route
            path="/classes/:classId"
            element={
              canViewClasses ? (
                <Suspense fallback={<PageFallback />}>
                  <ClassDetailPage />
                </Suspense>
              ) : (
                <Forbidden />
              )
            }
          />
          <Route
            path="/attendance/:classId"
            element={
              canViewClasses ? (
                <Suspense fallback={<PageFallback />}>
                  <AttendanceRegisterPage />
                </Suspense>
              ) : (
                <Forbidden />
              )
            }
          />

          <Route
            path="/statistics/:classId"
            element={
              canViewClasses ? (
                <Suspense fallback={<PageFallback />}>
                  <StatisticsPage />
                </Suspense>
              ) : (
                <Forbidden />
              )
            }
          />

          <Route
            path="/guardians"
            element={
              canSearchGuardians ? (
                <Suspense fallback={<PageFallback />}>
                  <GuardiansSearchPage />
                </Suspense>
              ) : (
                <Forbidden />
              )
            }
          />
          <Route
            path="/guardians/:guardianId"
            element={
              canAccessGuardians ? (
                <Suspense fallback={<PageFallback />}>
                  <GuardianDetailPage />
                </Suspense>
              ) : (
                <Forbidden />
              )
            }
          />
          <Route
            path="/guardian/me"
            element={
              user?.guardianId != null ? (
                <Suspense fallback={<PageFallback />}>
                  <GuardianDetailPage self />
                </Suspense>
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

function PageFallback() {
  return <StateMessage inline>Loading page...</StateMessage>;
}
