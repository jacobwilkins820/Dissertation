import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/UseAuth";
import type { ApiError } from "../services/http.ts";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      if (isApiError(err)) {
        setError(err.message);
      } else {
        setError("Login failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 360, margin: "80px auto", padding: 16 }}>
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        {error && <div style={{ color: "red", marginBottom: 12 }}>{error}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          style={{ padding: 8, width: "100%" }}
        >
          {isSubmitting ? "Logging in…" : "Login"}
        </button>
      </form>
    </div>
  );
}
/**
 * Type guard for ApiError thrown by http.ts
 */
function isApiError(err: unknown): err is ApiError {
  if (typeof err !== "object" || err === null) {
    return false;
  }

  if (!("message" in err) || !("status" in err)) {
    return false;
  }

  return (
    typeof (err as { message: unknown }).message === "string" &&
    typeof (err as { status: unknown }).status === "number"
  );
}
