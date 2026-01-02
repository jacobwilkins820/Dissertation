import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/UseAuth";
import { Button } from "../components/Button";
import type { ApiError } from "../services/http";

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
    <div className="min-h-screen flex items-start justify-center bg-slate-100 pt-20">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-semibold text-slate-800 mb-6">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <Button
            type="submit"
            size="md"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging in…" : "Login"}
          </Button>
        </form>
      </div>
    </div>
  );
}

/**
 * Type guard for ApiError thrown by http.ts
 */
function isApiError(err: unknown): err is ApiError {
  if (typeof err !== "object" || err === null) return false;
  if (!("message" in err) || !("status" in err)) return false;

  return (
    typeof (err as { message: unknown }).message === "string" &&
    typeof (err as { status: unknown }).status === "number"
  );
}
