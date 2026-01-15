import React, { useState } from "react";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { useAuth } from "../auth/UseAuth";
import type { CreateStudentRequest } from "../utils/responses";
import {
  getErrorMessage,
  type BackendErrorPayload,
} from "../utils/utilFuncs";
import { createStudent, isFetchJsonError } from "../services/backend";

// Student registration form with client + server validation. Should be SQL injection safe.
type FieldErrors = Partial<Record<keyof CreateStudentRequest, string>>;

const fieldErrorKeys = new Set<keyof CreateStudentRequest>([
  "upn",
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "status",
]);

// Narrow backend field keys to known form fields.
function isFieldErrorKey(key: string): key is keyof CreateStudentRequest {
  return fieldErrorKeys.has(key as keyof CreateStudentRequest);
}

// Parse backend error message into field-level errors.
function extractFieldErrors(payload: unknown): FieldErrors {
  const out: FieldErrors = {};
  if (!payload || typeof payload !== "object") return out;

  const p = payload as BackendErrorPayload;
  if (typeof p.message !== "string") return out;

  const raw = p.message.trim();
  const idx = raw.indexOf(":");
  if (idx <= 0) return out;

  const field = raw.slice(0, idx).trim();
  const msg = raw.slice(idx + 1).trim();

  if (isFieldErrorKey(field) && msg.length > 0) {
    out[field] = msg;
  }

  return out;
}

// Render the register student page.
export default function RegisterStudent() {
  const [upn, setUpn] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [status, setStatus] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { user } = useAuth();

  function validateClient(): FieldErrors {
    const errs: FieldErrors = {};

    if (!upn.trim()) errs.upn = "UPN is required.";
    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";
    if (!dateOfBirth.trim()) errs.dateOfBirth = "Date of birth is required.";
    if (!gender.trim()) errs.gender = "Gender is required.";

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setSuccessMsg(null);

    const clientErrs = validateClient();
    setFieldErrors(clientErrs);
    if (Object.keys(clientErrs).length > 0) return;

    const body: CreateStudentRequest = {
      upn: upn.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth,
      gender: gender.trim(),
      status: status.trim() ? status.trim() : undefined,
    };

    setSubmitting(true);
    try {
      await createStudent(body);

      setSuccessMsg("Student created successfully.");

      setUpn("");
      setFirstName("");
      setLastName("");
      setDateOfBirth("");
      setGender("");
      setStatus("");
      setFieldErrors({});
      setGlobalError(null);
    } catch (e: unknown) {
      if (isFetchJsonError(e)) {
        setFieldErrors((prev) => ({
          ...prev,
          ...extractFieldErrors(e.payload),
        }));
      }
      setGlobalError(getErrorMessage(e, "Failed to create student."));
    } finally {
      setSubmitting(false);
    }
  }

  if (user?.roleId !== 4) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
        You do not have permission to access this page.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Onboarding
        </p>
        <h1 className="text-3xl font-semibold text-white">Register Student</h1>
        <p className="text-sm text-slate-300">
          Create a new student record and assign the initial status.
        </p>
      </div>

      {globalError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          <strong>Error:</strong> {globalError}
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-200">
          {successMsg}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-2xl shadow-black/30"
      >
        <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
          UPN
          <TextField
            value={upn}
            onChange={(e) => setUpn(e.target.value)}
            placeholder="e.g., UPN12345"
          />
          {fieldErrors.upn && (
            <small className="text-rose-200">{fieldErrors.upn}</small>
          )}
        </label>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            First name
            <TextField
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g., Alice"
              autoComplete="given-name"
            />
            {fieldErrors.firstName && (
              <small className="text-rose-200">{fieldErrors.firstName}</small>
            )}
          </label>

          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Last name
            <TextField
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g., Smith"
              autoComplete="family-name"
            />
            {fieldErrors.lastName && (
              <small className="text-rose-200">{fieldErrors.lastName}</small>
            )}
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Date of birth
            <TextField
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
            {fieldErrors.dateOfBirth && (
              <small className="text-rose-200">{fieldErrors.dateOfBirth}</small>
            )}
          </label>

          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Gender
            <TextField
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="e.g., Female"
            />
            {fieldErrors.gender && (
              <small className="text-rose-200">{fieldErrors.gender}</small>
            )}
          </label>
        </div>

        <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
          Status
          <select
            className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 transition focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Default (ACTIVE)</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="WITHDRAWN">WITHDRAWN</option>
          </select>
          {fieldErrors.status && (
            <small className="text-rose-200">{fieldErrors.status}</small>
          )}
        </label>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create student"}
          </Button>

          <Button
            variant="secondary"
            disabled={submitting}
            onClick={() => {
              setUpn("");
              setFirstName("");
              setLastName("");
              setDateOfBirth("");
              setGender("");
              setStatus("");
              setFieldErrors({});
              setGlobalError(null);
              setSuccessMsg(null);
            }}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
