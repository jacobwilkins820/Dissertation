import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/UseAuth";
import { FlyoutLink } from "./Flyout";
import { hasPermission, Permissions } from "../../utils/permissions";

// Main top navigation with permission-based links.
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
  const canCreateGuardian = hasPermission(
    permissionLevel,
    Permissions.CREATE_GUARDIAN
  );
  const canCreateUser = hasPermission(permissionLevel, Permissions.CREATE_USER);
  const canCreateGuardianAccount = canCreateGuardian && canCreateUser;
  const isAdmin = (user?.roleName ?? "").toUpperCase() === "ADMIN";
  const hasGuardianAccount = user?.guardianId != null;
  const canSearchGuardians =
    isAdmin ||
    (hasPermission(permissionLevel, Permissions.VIEW_GUARDIAN_CONTACT) &&
      !hasGuardianAccount);
  const canRegister = canCreateStudent || canCreateUser || canCreateGuardianAccount;
  const userName = `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim() || "Account";

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="fixed w-full shadow-lg top-0 z-20 border-b border-slate-800/80 bg-slate-950/80 px-6 py-4 text-white backdrop-blur">
      <div className="flex items-center gap-4">
        <Link to="/home" className="text-lg font-semibold text-white no-underline">
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
          <FlyoutLink
            FlyoutContent={ClassesFlyout}
            className="text-sm uppercase tracking-[0.2em] text-slate-300 hover:text-white"
            underlineClassName="bg-amber-300/60"
            flyoutClassName="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/30"
            caretClassName="bg-slate-950 border-t border-l border-slate-800/80"
          >
            Classes
          </FlyoutLink>
        )}
        {canSearchGuardians && (
          <Link
            to="/guardians"
            className="text-sm uppercase tracking-[0.2em] text-slate-300 no-underline transition hover:text-white"
          >
            Guardians
          </Link>
        )}
        {canRegister && (
          <FlyoutLink
            FlyoutContent={RegisterFlyout}
            className="text-sm uppercase tracking-[0.2em] text-slate-300 hover:text-white"
            underlineClassName="bg-amber-300/60"
            flyoutClassName="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/30"
            caretClassName="bg-slate-950 border-t border-l border-slate-800/80"
          >
            Register
          </FlyoutLink>
        )}

        <div className="ml-auto">
          <FlyoutLink
            FlyoutContent={() => (
              <AccountFlyout onLogout={handleLogout} />
            )}
            className="text-sm uppercase tracking-[0.2em] text-slate-300 hover:text-white"
            underlineClassName="bg-amber-300/60"
            flyoutClassName="rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl shadow-black/30"
            caretClassName="bg-slate-950 border-t border-l border-slate-800/80"
          >
            {userName}
          </FlyoutLink>
        </div>
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
  const canCreateGuardian = hasPermission(
    permissionLevel,
    Permissions.CREATE_GUARDIAN
  );
  const canCreateUser = hasPermission(permissionLevel, Permissions.CREATE_USER);
  const canCreateGuardianAccount = canCreateGuardian && canCreateUser;

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
      {canCreateStudent && (
        <Link
          to="/import-students"
          className="block px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-900 hover:text-white"
        >
          Import students (CSV)
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
      {canCreateGuardianAccount && (
        <Link
          to="/register-guardian"
          className="block px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-900 hover:text-white"
        >
          Create guardian
        </Link>
      )}
    </div>
  );
}

// Classes menu content for the navbar flyout.
function ClassesFlyout() {
  const { user } = useAuth();
  const permissionLevel = user?.permissionLevel ?? 0;
  const canViewClasses = hasPermission(
    permissionLevel,
    Permissions.VIEW_CLASSES
  );
  const isAdmin = (user?.roleName ?? "").toUpperCase() === "ADMIN";
  const canCreateClass = isAdmin && canViewClasses;

  if (!canViewClasses) {
    return null;
  }

  return (
    <div className="min-w-[200px] py-2 text-sm text-white">
      <Link
        to="/classes"
        className="block px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-900 hover:text-white"
      >
        View classes
      </Link>
      {canCreateClass && (
        <Link
          to="/classes/new"
          className="block px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-900 hover:text-white"
        >
          Create a class
        </Link>
      )}
    </div>
  );
}

function AccountFlyout({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="min-w-[200px] py-2 text-sm text-white">
      <Link
        to="/account"
        className="block px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200 transition hover:bg-slate-900 hover:text-white"
      >
        Account
      </Link>
      <button
        type="button"
        onClick={onLogout}
        className="block w-full px-4 py-2 text-left text-xs uppercase tracking-[0.2em] text-rose-200 transition hover:bg-rose-500/20 hover:text-rose-100"
      >
        Logout
      </button>
    </div>
  );
}
