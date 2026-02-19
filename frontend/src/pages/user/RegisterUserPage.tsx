import React, { useEffect, useMemo, useState } from "react";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { useAuth } from "../../auth/UseAuth";
import type { CreateUserRequest, RoleDto } from "../../utils/responses";
import { getErrorMessage, type BackendErrorPayload } from "../../utils/utilFuncs";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { AccountIdentityFields } from "../../components/userCreation/AccountIdentityFields";
import { FormActions } from "../../components/userCreation/FormActions";
import { createUser, getRoles, isFetchJsonError } from "../../services/backend";
import { hasPermission, Permissions } from "../../utils/permissions";

type FieldErrors = Partial<
  Record<keyof CreateUserRequest | "confirmPassword", string>
>;

function normalizeRoleName(name: string) {
  return name.trim().toUpperCase();
}

type FieldErrorKey = keyof FieldErrors;

const fieldErrorKeys = new Set<FieldErrorKey>([
  "firstName",
  "lastName",
  "email",
  "password",
  "roleId",
  "confirmPassword",
]);

function isFieldErrorKey(key: string): key is FieldErrorKey {
  return fieldErrorKeys.has(key as FieldErrorKey);
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

export default function RegisterUserPage() {
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [roleId, setRoleId] = useState<number | "">("");

  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { user } = useAuth();
  const canCreateUser = hasPermission(
    user?.permissionLevel ?? 0,
    Permissions.CREATE_USER
  );

  const nonParentRoles = useMemo(
    () => roles.filter((role) => normalizeRoleName(role.name) !== "PARENT"),
    [roles]
  );

  useEffect(() => {
    (async () => {
      setRolesLoading(true);
      setRolesError(null);
      try {
        const data = await getRoles();
        setRoles(data);
      } catch (e: unknown) {
        setRolesError(getErrorMessage(e, "Failed to load roles."));
      } finally {
        setRolesLoading(false);
      }
    })();
  }, []);

  function resetForm(clearFeedback = true) {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setRoleId("");
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

    if (roleId === "") errs.roleId = "Role is required.";

    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGlobalError(null);
    setSuccessMsg(null);

    const clientErrs = validateClient();
    setFieldErrors(clientErrs);
    if (Object.keys(clientErrs).length > 0) return;

    const body: CreateUserRequest = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      roleId: roleId as number,
    };

    setSubmitting(true);
    try {
      await createUser(body);
      setSuccessMsg("User created successfully.");
      resetForm(false);
    } catch (e: unknown) {
      if (isFetchJsonError(e)) {
        setFieldErrors((prev) => ({
          ...prev,
          ...extractFieldErrors(e.payload),
        }));
      }
      setGlobalError(getErrorMessage(e, "Failed to create user."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!canCreateUser) {
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
        title="Create User"
        subtitle="Add non-parent user accounts such as staff, teachers, or admins."
      />

      {rolesError && (
        <AlertBanner variant="error">
          <strong>Roles failed to load:</strong> {rolesError}
        </AlertBanner>
      )}

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
            firstNamePlaceholder="e.g., Alice"
            lastName={lastName}
            onLastNameChange={setLastName}
            lastNamePlaceholder="e.g., Smith"
            email={email}
            onEmailChange={setEmail}
            emailPlaceholder="e.g., user@example.com"
            password={password}
            onPasswordChange={setPassword}
            confirmPassword={confirmPassword}
            onConfirmPasswordChange={setConfirmPassword}
            fieldErrors={fieldErrors}
          />

          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Role
            <SelectDropdown
              value={roleId === "" ? "" : String(roleId)}
              options={[
                {
                  value: "",
                  label: rolesLoading ? "Loading roles..." : "Select a role...",
                },
                ...nonParentRoles.map((r) => ({
                  value: String(r.id),
                  label: r.name,
                })),
              ]}
              onChange={(value) => setRoleId(value ? Number(value) : "")}
              disabled={rolesLoading || nonParentRoles.length === 0}
              className="w-full"
            />
            {fieldErrors.roleId && (
              <small className="text-rose-200">{fieldErrors.roleId}</small>
            )}
          </label>

          <FormActions
            submitting={submitting}
            submitLabel="Create user"
            submittingLabel="Creating..."
            disableSubmit={rolesLoading}
            onReset={() => resetForm()}
          />
        </SectionCard>
      </form>
    </div>
  );
}
