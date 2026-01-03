import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/UseAuth";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
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
    <div className="w-full max-w-md rounded-3xl border border-slate-800/80 bg-slate-900/80 p-8 shadow-2xl shadow-black/30">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Welcome back
        </p>
        <h1 className="text-3xl font-semibold text-white">Sign in</h1>
        <p className="text-sm text-slate-300">
          Use your institutional credentials to access the SIS workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-sm">
        <label className="grid gap-1.5 text-slate-300">
          Email
          <TextField
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.edu"
          />
        </label>

        <label className="grid gap-1.5 text-slate-300">
          Password
          <TextField
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="password"
          />
        </label>

        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {error}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>
      </form>
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
