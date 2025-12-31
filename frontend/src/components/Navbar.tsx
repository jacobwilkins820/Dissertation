import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/UseAuth";
import { Button } from "./Button";

export default function Navbar() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.left}>
        <Link to="/students" style={styles.brand}>
          SIS
        </Link>
        <Link to="/students" style={styles.link}>
          Students
        </Link>
        <Link to="/classes" style={styles.link}>
          Classes
        </Link>
        <Link to="/attendance" style={styles.link}>
          Attendance
        </Link>
      </div>

      <Button onClick={handleLogout} variant="danger" size="sm">
        Logout
      </Button>
    </nav>
  );
}

const styles = {
  nav: {
    height: 56,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 16px",
    background: "#1e293b",
    color: "#fff",
  },
  left: { display: "flex", gap: 14, alignItems: "center" },
  brand: {
    color: "#fff",
    textDecoration: "none",
    fontWeight: 700,
    marginRight: 10,
  },
  link: { color: "#cbd5f5", textDecoration: "none" },
};
