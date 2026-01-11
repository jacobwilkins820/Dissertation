import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/env";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { SearchSelect } from "../components/SearchSelect";
import { useAuth } from "../auth/UseAuth";
import type { CreateUserRequest, GuardianDto, RoleDto } from "../utils/responses";
import {
  getAuthHeader,
  safeReadJson,
  extractErrorMessage,
  getErrorMessage,
  type BackendErrorPayload,
} from "../utils/utilFuncs";

type FieldErrors = Partial<
  Record<keyof CreateUserRequest | "confirmPassword", string>
>;

function normalizeRoleName(name: string) {
  return name.trim().toUpperCase();
}

function isParentRoleName(name: string) {
  const n = normalizeRoleName(name);
  return n === "PARENT";
}

type FieldErrorKey = keyof FieldErrors;

const fieldErrorKeys = new Set<FieldErrorKey>([
  "firstName",
  "lastName",
  "email",
  "password",
  "roleId",
  "guardianId",
  "confirmPassword",
]);

function isFieldErrorKey(key: string): key is FieldErrorKey {
  return fieldErrorKeys.has(key as FieldErrorKey);
}

/**
 * backend returns ONE field error at a time.
 * parse that into FieldErrors so the UI can show it under the field.
 */
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
  // Roles
  const [roles, setRoles] = useState<RoleDto[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [rolesError, setRolesError] = useState<string | null>(null);

  // Form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [roleId, setRoleId] = useState<number | "">("");
  const selectedRole = useMemo(
    () => roles.find((r) => r.id === roleId) ?? null,
    [roles, roleId]
  );
  const showGuardianLink =
    !!selectedRole && isParentRoleName(selectedRole.name);

  // Guardians search (only for parent role)
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianDto | null>(
    null
  );
  const [guardianResetKey, setGuardianResetKey] = useState(0);

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const { user } = useAuth();

  useEffect(() => {
    // Load roles on mount
    (async () => {
      setRolesLoading(true);
      setRolesError(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/roles`, {
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        });

        if (!res.ok) {
          const payload = await safeReadJson(res);
          throw new Error(extractErrorMessage(payload));
        }

        const data = (await res.json()) as RoleDto[];
        setRoles(data);
      } catch (e: unknown) {
        setRolesError(getErrorMessage(e, "Failed to load roles."));
      } finally {
        setRolesLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    // If role changes away from parent role, clear guardian selection + query
    if (!showGuardianLink) {
      setSelectedGuardian(null);
      setGuardianResetKey((prev) => prev + 1);
    }
  }, [showGuardianLink]);

  const fetchGuardians = useCallback(
    async (query: string, signal: AbortSignal) => {
      const res = await fetch(
        `${API_BASE_URL}/api/guardians/search?query=${encodeURIComponent(
          query
        )}`,
        {
          signal,
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeader(),
          },
        }
      );

      if (!res.ok) {
        const payload = await safeReadJson(res);
        throw new Error(extractErrorMessage(payload));
      }

      const data = (await res.json()) as GuardianDto[];
      return Array.isArray(data) ? data : [];
    },
    []
  );

  function validateClient(): FieldErrors {
    const errs: FieldErrors = {};

    if (!firstName.trim()) errs.firstName = "First name is required.";
    if (!lastName.trim()) errs.lastName = "Last name is required.";
    if (!email.trim()) errs.email = "Email is required.";
    if (!password) errs.password = "Password is required.";
    if (!confirmPassword)
      errs.confirmPassword = "Confirm password is required.";

    if (password && confirmPassword && password !== confirmPassword) {
      errs.confirmPassword = "Passwords do not match.";
    }

    if (roleId === "") errs.roleId = "Role is required.";

    if (showGuardianLink && !selectedGuardian) {
      errs.guardianId = "Select a guardian to link.";
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

    const body: CreateUserRequest = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password,
      roleId: roleId as number,
      guardianId: showGuardianLink ? selectedGuardian!.id : null,
    };

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/users`, {
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

      // summary DTO returned
      await safeReadJson(res);

      setSuccessMsg("User created successfully.");

      // Reset form
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFieldErrors({});
      setGlobalError(null);

      // Clear guardian section
      setSelectedGuardian(null);
      setGuardianResetKey((prev) => prev + 1);
    } catch (e: unknown) {
      setGlobalError(getErrorMessage(e, "Failed to create user."));
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
          Administration
        </p>
        <h1 className="text-3xl font-semibold text-white">Create User</h1>
        <p className="text-sm text-slate-300">
          Add staff, teacher, or guardian access with role-aware linking.
        </p>
      </div>

      {rolesError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          <strong>Roles failed to load:</strong> {rolesError}
        </div>
      )}

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

        <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
          Email
          <TextField
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., alice@example.com"
            autoComplete="email"
          />
          {fieldErrors.email && (
            <small className="text-rose-200">{fieldErrors.email}</small>
          )}
        </label>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Password
            <TextField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <small className="text-rose-200">{fieldErrors.password}</small>
            )}
          </label>

          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Confirm password
            <TextField
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
            />

            {fieldErrors.confirmPassword && (
              <small className="text-rose-200">
                {fieldErrors.confirmPassword}
              </small>
            )}
          </label>
        </div>

        <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
          Role
          <select
            className="w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-2 text-sm text-slate-100 transition focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400/40 disabled:opacity-60"
            value={roleId === "" ? "" : String(roleId)}
            onChange={(e) =>
              setRoleId(e.target.value ? Number(e.target.value) : "")
            }
            disabled={rolesLoading || roles.length === 0}
          >
            <option value="">
              {rolesLoading ? "Loading roles..." : "Select a role..."}
            </option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
          {fieldErrors.roleId && (
            <small className="text-rose-200">{fieldErrors.roleId}</small>
          )}
        </label>

        {showGuardianLink && (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-4 text-sm text-slate-300">
            <div className="grid gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Link Guardian
                </p>
                <p className="mt-1 text-sm text-slate-300">
                  Search guardians by name (min 2 characters). Select one to
                  link during user creation.
                </p>
              </div>

              <SearchSelect
                label="Search"
                placeholder="e.g., John Doe"
                selected={selectedGuardian}
                onSelect={setSelectedGuardian}
                fetchOptions={fetchGuardians}
                getOptionKey={(guardian) => guardian.id}
                getOptionLabel={(guardian) =>
                  `${guardian.firstName} ${guardian.lastName}${
                    guardian.email ? ` - ${guardian.email}` : ""
                  }`
                }
                idleLabel="Type at least 2 characters."
                loadingLabel="Searching..."
                resultsLabel="Results"
                emptyLabel="No matches."
                resetKey={guardianResetKey}
              />

              {fieldErrors.guardianId && (
                <small className="text-rose-200">{fieldErrors.guardianId}</small>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" disabled={submitting || rolesLoading}>
            {submitting ? "Creating..." : "Create user"}
          </Button>

          <Button
            variant="secondary"
            disabled={submitting}
            onClick={() => {
              setFirstName("");
              setLastName("");
              setEmail("");
              setPassword("");
              setConfirmPassword("");
              setFieldErrors({});
              setGlobalError(null);
              setSuccessMsg(null);
              setSelectedGuardian(null);
              setGuardianResetKey((prev) => prev + 1);
            }}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
