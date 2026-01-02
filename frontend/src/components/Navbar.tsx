import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/UseAuth";
import { Button } from "./Button";

export default function Navbar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="h-14 flex items-center justify-between px-4 bg-slate-800 text-white">
      <div className="flex items-center gap-3.5">
        <Link
          to="/students"
          className="font-bold mr-2.5 no-underline text-white"
        >
          SIS
        </Link>

        <Link
          to="/students"
          className="text-slate-300 no-underline hover:text-white"
        >
          Students
        </Link>
        <Link
          to="/classes"
          className="text-slate-300 no-underline hover:text-white"
        >
          Classes
        </Link>
        <Link
          to="/attendance"
          className="text-slate-300 no-underline hover:text-white"
        >
          Attendance
        </Link>
        {user?.roleId === 4 && (
          <Link
            to="/register-user"
            className="text-slate-300 no-underline hover:text-white"
          >
            Register
          </Link>
        )}
        {user?.roleId === 4 && (
          <Link
            to="/register-student"
            className="text-slate-300 no-underline hover:text-white"
          >
            Register Students
          </Link>
        )}
      </div>

      <Button onClick={handleLogout} variant="danger" size="sm">
        Logout
      </Button>
    </nav>
  );
}
