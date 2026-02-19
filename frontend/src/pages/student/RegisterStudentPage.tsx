import React, { useState } from "react";
import { Button } from "../../components/ui/Button";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { TextField } from "../../components/ui/TextField";
import { useAuth } from "../../auth/UseAuth";
import type { CreateStudentRequest } from "../../utils/responses";
import { getErrorMessage, type BackendErrorPayload } from "../../utils/utilFuncs";
import { createStudent, isFetchJsonError } from "../../services/backend";
import { DatePicker } from "../../components/ui/DatePicker";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";

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
      <AlertBanner variant="error">
        You do not have permission to access this page.
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Onboarding"
        title="Register Student"
        subtitle="Create a new student record and assign the initial status."
      />

      {globalError && (
        <AlertBanner variant="error">
          <strong>Error:</strong> {globalError}
        </AlertBanner>
      )}

      {successMsg && (
        <AlertBanner variant="success">{successMsg}</AlertBanner>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid gap-4"
      >
        <SectionCard padding="md" className="grid gap-4">
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
              <DatePicker
                size="sm"
                value={dateOfBirth}
                onChange={setDateOfBirth}
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
            <SelectDropdown
              value={status}
              options={[
                { value: "", label: "Default (ACTIVE)" },
                { value: "ACTIVE", label: "ACTIVE" },
                { value: "INACTIVE", label: "INACTIVE" },
                { value: "WITHDRAWN", label: "WITHDRAWN" },
              ]}
              onChange={setStatus}
              className="w-full"
            />
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
        </SectionCard>
      </form>
    </div>
  );
}
