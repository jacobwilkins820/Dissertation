import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/UseAuth";
import { Button } from "./Button";
import { FlyoutLink } from "./Flyout";
import { hasPermission, Permissions } from "../utils/permissions";

// Main top navigation with permission-aware links.
export default function Navbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const permissionLevel = user?.permissionLevel ?? 0;
  const canViewStudents = hasPermission(
    permissionLevel,
    Permissions.VIEW_STUDENT_DIRECTORY
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
  const hasGuardianAccount = user?.guardianId != null;
  const canAccessGuardians =
    isAdmin ||
    hasGuardianAccount ||
    hasPermission(permissionLevel, Permissions.VIEW_GUARDIAN_CONTACT);
  const canRegister = canCreateStudent || canCreateUser;

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="fixed w-full shadow-lg top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 px-6 py-4 text-white backdrop-blur">
      <div className="flex items-center gap-4">
        <Link
          to="/studentDirectory"
          className="text-lg font-semibold text-white no-underline"
        >
          ACORN
        </Link>

        {canViewStudents && (
          <Link
            to="/studentDirectory"
            className="text-sm uppercase tracking-[0.2em] text-slate-300 no-underline transition hover:text-white"
          >
            Students
          </Link>
        )}
        {canViewClasses && (
          <Link
            to="/classes"
            className="text-sm uppercase tracking-[0.2em] text-slate-300 no-underline transition hover:text-white"
          >
            Classes
          </Link>
        )}
        {canAccessGuardians && (
          <Link
            to={hasGuardianAccount && !isAdmin ? "/guardian/me" : "/guardians"}
            className="text-sm uppercase tracking-[0.2em] text-slate-300 no-underline transition hover:text-white"
          >
            {hasGuardianAccount && !isAdmin ? "My Account" : "Guardians"}
          </Link>
        )}
        {canRegister && (
          <FlyoutLink
            FlyoutContent={RegisterFlyout}
            className="text-sm uppercase tracking-[0.2em] text-slate-300 hover:text-white"
            underlineClassName="bg-amber-300/60"
            flyoutClassName="rounded-2xl border border-slate-800/80 bg-slate-950/90 shadow-2xl shadow-black/30"
            caretClassName="bg-slate-950 border-t border-l border-slate-800/80"
          >
            Register
          </FlyoutLink>
        )}
        <Button
          onClick={handleLogout}
          variant="danger"
          size="sm"
          className="right-0 ml-auto"
        >
          Logout
        </Button>
      </div>
    </nav>
  );
}

// Register menu content for the navbar flyout.
function RegisterFlyout() {
  const { user } = useAuth();
  const permissionLevel = user?.permissionLevel ?? 0;
  const canCreateStudent = hasPermission(
    permissionLevel,
    Permissions.CREATE_STUDENT
  );
  const canCreateUser = hasPermission(permissionLevel, Permissions.CREATE_USER);

  return (
    <div className="min-w-[200px] py-2 text-sm text-white">
      {canCreateStudent && (
        <Link
          to="/register-student"
          className="block px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-900 hover:text-white"
        >
          Register a student
        </Link>
      )}
      {canCreateUser && (
        <Link
          to="/register-user"
          className="block px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-900 hover:text-white"
        >
          Register a user
        </Link>
      )}
    </div>
  );
}
