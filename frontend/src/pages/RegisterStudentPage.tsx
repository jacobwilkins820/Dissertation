import React, { useState } from "react";
import { API_BASE_URL } from "../config/env";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { useAuth } from "../auth/UseAuth";
import {
  getAuthHeader,
  safeReadJson,
  extractErrorMessage,
  getErrorMessage,
  type BackendErrorPayload,
} from "../utils/utilFuncs";

/**
 * Register Student Page
 * - Admin-only create via POST /api/students
 */
type CreateStudentRequest = {
  upn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  status?: string;
};

type FieldErrors = Partial<Record<keyof CreateStudentRequest, string>>;

const fieldErrorKeys = new Set<keyof CreateStudentRequest>([
  "upn",
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "status",
]);

function isFieldErrorKey(key: string): key is keyof CreateStudentRequest {
  return fieldErrorKeys.has(key as keyof CreateStudentRequest);
}

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
      const res = await fetch(`${API_BASE_URL}/api/students`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = await safeReadJson(res);
        setFieldErrors((prev) => ({ ...prev, ...extractFieldErrors(payload) }));
        throw new Error(extractErrorMessage(payload));
      }

      await safeReadJson(res);

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
      setGlobalError(getErrorMessage(e, "Failed to create student."));
    } finally {
      setSubmitting(false);
    }
  }

  if (user?.roleId !== 4) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Register Student</h1>
        <div>You do not have permission to access this page.</div>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Register Student</h1>

      {globalError && (
        <div className="p-3 border border-gray-300 mb-4">
          <strong>Error:</strong> {globalError}
        </div>
      )}

      {successMsg && (
        <div className="p-3 border border-gray-300 mb-4">{successMsg}</div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3.5">
        <label className="grid gap-1.5">
          <span>UPN</span>
          <TextField
            value={upn}
            onChange={(e) => setUpn(e.target.value)}
            placeholder="e.g., UPN12345"
          />
          {fieldErrors.upn && (
            <small className="text-red-600">{fieldErrors.upn}</small>
          )}
        </label>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span>First name</span>
            <TextField
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="e.g., Alice"
              autoComplete="given-name"
            />
            {fieldErrors.firstName && (
              <small className="text-red-600">{fieldErrors.firstName}</small>
            )}
          </label>

          <label className="grid gap-1.5">
            <span>Last name</span>
            <TextField
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="e.g., Smith"
              autoComplete="family-name"
            />
            {fieldErrors.lastName && (
              <small className="text-red-600">{fieldErrors.lastName}</small>
            )}
          </label>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span>Date of birth</span>
            <TextField
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
            />
            {fieldErrors.dateOfBirth && (
              <small className="text-red-600">{fieldErrors.dateOfBirth}</small>
            )}
          </label>

          <label className="grid gap-1.5">
            <span>Gender</span>
            <TextField
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="e.g., Female"
            />
            {fieldErrors.gender && (
              <small className="text-red-600">{fieldErrors.gender}</small>
            )}
          </label>
        </div>

        <label className="grid gap-1.5">
          <span>Status</span>
          <select
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Default (ACTIVE)</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="WITHDRAWN">WITHDRAWN</option>
          </select>
          {fieldErrors.status && (
            <small className="text-red-600">{fieldErrors.status}</small>
          )}
        </label>

        <div className="flex items-center gap-3">
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
