import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/UseAuth";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import type { ApiError } from "../services/http";
import { AlertBanner } from "../components/AlertBanner";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";

// Login form with auth redirect handling.
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
    <SectionCard
      padding="lg"
      className="w-full max-w-md bg-slate-900/80"
    >
      <PageHeader
        label="Welcome back"
        title="Sign in"
        subtitle="Use your institutional credentials to access the SIS workspace."
        className="md:items-start md:justify-start"
      />

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
          <AlertBanner variant="error">{error}</AlertBanner>
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
    </SectionCard>
  );
}

// Type guard for ApiError thrown by http.ts.
function isApiError(err: unknown): err is ApiError {
  if (typeof err !== "object" || err === null) return false;
  if (!("message" in err) || !("status" in err)) return false;

  return (
    typeof (err as { message: unknown }).message === "string" &&
    typeof (err as { status: unknown }).status === "number"
  );
}
