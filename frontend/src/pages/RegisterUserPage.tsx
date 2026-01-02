import React, { useEffect, useMemo, useRef, useState } from "react";
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
 * Register (Admin Create User) Page
 * - Admin-only create via POST /api/users
 * - Loads roles, shows role dropdown (name -> sends roleId)
 * - If selected role is "PARENT",
 *   shows guardian search + selection, and includes guardianId in create request.
 */
type RoleDto = {
  id: number;
  name: string; // e.g., "ADMIN", "TEACHER", "PARENT"
};

type GuardianDto = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
};

type CreateUserRequest = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleId: number;
  guardianId?: number | null;
};

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
  const [guardianQuery, setGuardianQuery] = useState("");
  const [guardians, setGuardians] = useState<GuardianDto[]>([]);
  const [guardiansLoading, setGuardiansLoading] = useState(false);
  const [guardiansError, setGuardiansError] = useState<string | null>(null);
  const [selectedGuardian, setSelectedGuardian] = useState<GuardianDto | null>(
    null
  );

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  // Debounce / cancel guardian searches
  const guardianAbortRef = useRef<AbortController | null>(null);
  const guardianDebounceRef = useRef<number | null>(null);

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
      setGuardianQuery("");
      setGuardians([]);
      setSelectedGuardian(null);
      setGuardiansError(null);
      setGuardiansLoading(false);
      // cancel pending requests
      guardianAbortRef.current?.abort();
      guardianAbortRef.current = null;
      if (guardianDebounceRef.current)
        window.clearTimeout(guardianDebounceRef.current);
      guardianDebounceRef.current = null;
    }
  }, [showGuardianLink]);

  useEffect(() => {
    if (!showGuardianLink) return;

    const q = guardianQuery.trim();

    // Avoid searching for very short inputs
    if (q.length < 2) {
      setGuardians([]);
      setGuardiansError(null);
      setGuardiansLoading(false);
      guardianAbortRef.current?.abort();
      guardianAbortRef.current = null;
      if (guardianDebounceRef.current)
        window.clearTimeout(guardianDebounceRef.current);
      guardianDebounceRef.current = null;
      return;
    }

    // Debounce
    if (guardianDebounceRef.current)
      window.clearTimeout(guardianDebounceRef.current);
    guardianDebounceRef.current = window.setTimeout(async () => {
      guardianAbortRef.current?.abort();
      const ac = new AbortController();
      guardianAbortRef.current = ac;

      setGuardiansLoading(true);
      setGuardiansError(null);

      try {
        const res = await fetch(
          `${API_BASE_URL}/api/guardians?query=${encodeURIComponent(q)}`,
          {
            signal: ac.signal,
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
        setGuardians(data);
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setGuardiansError(getErrorMessage(e, "Failed to search guardians."));
      } finally {
        setGuardiansLoading(false);
      }
    }, 350);

    return () => {
      if (guardianDebounceRef.current)
        window.clearTimeout(guardianDebounceRef.current);
    };
  }, [guardianQuery, showGuardianLink]);

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
      setGuardianQuery("");
      setGuardians([]);
      setSelectedGuardian(null);
    } catch (e: unknown) {
      setGlobalError(getErrorMessage(e, "Failed to create user."));
    } finally {
      setSubmitting(false);
    }
  }

  if (user?.roleId !== 4) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">Create User</h1>
        <div>You do not have permission to access this page.</div>
      </div>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Create User</h1>

      {rolesError && (
        <div className="p-3 border border-gray-300 mb-4">
          <strong>Roles failed to load:</strong> {rolesError}
        </div>
      )}

      {globalError && (
        <div className="p-3 border border-gray-300 mb-4">
          <strong>Error:</strong> {globalError}
        </div>
      )}

      {successMsg && (
        <div className="p-3 border border-gray-300 mb-4">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-3.5">
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

        <label className="grid gap-1.5">
          <span>Email</span>
          <TextField
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., alice@example.com"
            autoComplete="email"
          />
          {fieldErrors.email && (
            <small className="text-red-600">{fieldErrors.email}</small>
          )}
        </label>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          <label className="grid gap-1.5">
            <span>Password</span>
            <TextField
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
            />
            {fieldErrors.password && (
              <small className="text-red-600">{fieldErrors.password}</small>
            )}
          </label>

          <label className="grid gap-1.5">
            <span>Confirm password</span>
            <TextField
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              type="password"
              autoComplete="new-password"
            />

            {fieldErrors.confirmPassword && (
              <small className="text-red-600">
                {fieldErrors.confirmPassword}
              </small>
            )}
          </label>
        </div>

        <label className="grid gap-1.5">
          <span>Role</span>
          <select
            className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-900 transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
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
            <small className="text-red-600">{fieldErrors.roleId}</small>
          )}
        </label>

        {showGuardianLink && (
          <div className="p-3 border border-gray-300">
            <div className="grid gap-2">
              <strong>Link Guardian</strong>
              <span className="opacity-80">
                Search guardians by name (min 2 characters). Select one to link
                during user creation.
              </span>

              <label className="grid gap-1.5">
                <span>Search</span>
                <TextField
                  value={guardianQuery}
                  onChange={(e) => {
                    setGuardianQuery(e.target.value);
                    // If they start searching again, clear selection
                    setSelectedGuardian(null);
                  }}
                  placeholder="e.g., John Doe"
                />
              </label>

              {guardiansError && (
                <small className="text-red-600">
                  Guardian search failed: {guardiansError}
                </small>
              )}

              {fieldErrors.guardianId && (
                <small className="text-red-600">{fieldErrors.guardianId}</small>
              )}

              <div className="grid gap-2">
                <div className="opacity-80">
                  {guardiansLoading
                    ? "Searching..."
                    : guardians.length > 0
                      ? "Results"
                      : guardianQuery.trim().length >= 2
                        ? "No matches."
                        : "Type to search."}
                </div>

                {guardians.length > 0 && (
                  <div className="grid gap-2">
                    {guardians.map((g) => {
                      const label = `${g.firstName} ${g.lastName}${
                        g.email ? ` - ${g.email}` : ""
                      }`;
                      const selected = selectedGuardian?.id === g.id;

                      return (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => setSelectedGuardian(g)}
                          className={`text-left p-2.5 border border-gray-300 ${
                            selected ? "bg-gray-100" : "bg-transparent"
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedGuardian && (
                  <div className="mt-2 p-2.5 border border-gray-300">
                    <strong>Selected:</strong> {selectedGuardian.firstName}{" "}
                    {selectedGuardian.lastName}
                    {selectedGuardian.email
                      ? ` - ${selectedGuardian.email}`
                      : ""}
                    <div className="mt-2">
                      <Button
                        variant="secondary"
                        onClick={() => setSelectedGuardian(null)}
                      >
                        Clear selection
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
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
              setGuardianQuery("");
              setGuardians([]);
              setSelectedGuardian(null);
            }}
          >
            Reset
          </Button>
        </div>
      </form>
    </div>
  );
}
