import React, { useState } from "react";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { TextField } from "../../components/ui/TextField";
import { AccountIdentityFields } from "../../components/userCreation/AccountIdentityFields";
import { FormActions } from "../../components/userCreation/FormActions";
import { useAuth } from "../../auth/UseAuth";
import { createGuardianUser, isFetchJsonError } from "../../services/backend";
import type { CreateGuardianUserRequest } from "../../utils/responses";
import { hasPermission, Permissions } from "../../utils/permissions";
import {
  getErrorMessage,
  type BackendErrorPayload,
} from "../../utils/utilFuncs";

// Field-level errors for guardian + linked parent-account creation flow.
type FieldErrors = Partial<
  Record<keyof CreateGuardianUserRequest | "confirmPassword", string>
>;

type FieldErrorKey = keyof FieldErrors;

const fieldErrorKeys = new Set<FieldErrorKey>([
  "firstName",
  "lastName",
  "email",
  "password",
  "phone",
  "addressLine1",
  "addressLine2",
  "city",
  "postcode",
  "confirmPassword",
]);

function isFieldErrorKey(key: string): key is FieldErrorKey {
  return fieldErrorKeys.has(key as FieldErrorKey);
}

// Parses backend "field: message" validation responses into form field errors.
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

// Converts the optional text inputs to nullable fields expected by backend.
function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

// Creates a guardian record and the corresponding parent login in one submission.
export default function RegisterGuardianPage() {
  const { user } = useAuth();
  const permissionLevel = user?.permissionLevel ?? 0;
  const canCreateGuardianAccount =
    hasPermission(permissionLevel, Permissions.CREATE_USER) &&
    hasPermission(permissionLevel, Permissions.CREATE_GUARDIAN);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState("");
  const [postcode, setPostcode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function resetForm(clearFeedback = true) {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setCity("");
    setPostcode("");
    setFieldErrors({});
    if (clearFeedback) {
      setGlobalError(null);
      setSuccessMsg(null);
    }
  }

  function validateClient(): FieldErrors {
    const errs: FieldErrors = {};

    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    if (!password) errs.password = "Password is required.";
    if (!confirmPassword) {
      errs.confirmPassword = "Confirm password is required.";
    }

    if (password && confirmPassword && password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setSuccessMsg(null);

    const clientErrs = validateClient();
    setFieldErrors(clientErrs);
    if (Object.keys(clientErrs).length > 0) return;

    const payload: CreateGuardianUserRequest = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      phone: normalizeOptional(phone),
      addressLine1: normalizeOptional(addressLine1),
      addressLine2: normalizeOptional(addressLine2),
      city: normalizeOptional(city),
      postcode: normalizeOptional(postcode),
    };

    setSubmitting(true);
    try {
      await createGuardianUser(payload);
      setSuccessMsg("Guardian and parent user account created successfully.");
      // Keep success feedback visible while resetting input state.
      resetForm(false);
    } catch (e: unknown) {
      if (isFetchJsonError(e)) {
        // Merge server-side field validation into local error model.
        setFieldErrors((prev) => ({
          ...prev,
          ...extractFieldErrors(e.payload),
        }));
      }
      setGlobalError(
        getErrorMessage(e, "Failed to create guardian and parent account."),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!canCreateGuardianAccount) {
    return (
      <AlertBanner variant="error">
        You do not have permission to access this page.
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Administration"
        title="Create Guardian"
        subtitle="Creates both a guardian record and linked parent login in one action."
      />

      {globalError && (
        <AlertBanner variant="error">
          <strong>Error:</strong> {globalError}
        </AlertBanner>
      )}

      {successMsg && <AlertBanner variant="success">{successMsg}</AlertBanner>}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <SectionCard padding="md" className="grid gap-4">
          <AccountIdentityFields
            firstName={firstName}
            onFirstNameChange={setFirstName}
            firstNamePlaceholder="e.g., Jane"
            lastName={lastName}
            onLastNameChange={setLastName}
            lastNamePlaceholder="e.g., Doe"
            email={email}
            onEmailChange={setEmail}
            emailPlaceholder="e.g., jane.doe@example.com"
            password={password}
            onPasswordChange={setPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            fieldErrors={fieldErrors}
          />

          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Phone (optional)
            <TextField
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g., 07123 456789"
              autoComplete="tel"
            />
            {fieldErrors.phone && (
              <small className="text-rose-200">{fieldErrors.phone}</small>
            )}
          </label>

          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Address line 1 (optional)
            <TextField
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              placeholder="e.g., 12 Orchard Street"
              autoComplete="address-line1"
            />
            {fieldErrors.addressLine1 && (
              <small className="text-rose-200">
                {fieldErrors.addressLine1}
              </small>
            )}
          </label>

          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Address line 2 (optional)
            <TextField
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
              placeholder="e.g., Apartment 4B"
              autoComplete="address-line2"
            />
            {fieldErrors.addressLine2 && (
              <small className="text-rose-200">
                {fieldErrors.addressLine2}
              </small>
            )}
          </label>

          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
            <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
              City (optional)
              <TextField
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Preston"
                autoComplete="address-level2"
              />
              {fieldErrors.city && (
                <small className="text-rose-200">{fieldErrors.city}</small>
              )}
            </label>

            <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
              Postcode (optional)
              <TextField
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="e.g., PR1 2HE"
                autoComplete="postal-code"
              />
              {fieldErrors.postcode && (
                <small className="text-rose-200">{fieldErrors.postcode}</small>
              )}
            </label>
          </div>

          <FormActions
            submitting={submitting}
            submitLabel="Create guardian"
            submittingLabel="Creating..."
            onReset={() => resetForm()}
          />
        </SectionCard>
      </form>
    </div>
  );
}
