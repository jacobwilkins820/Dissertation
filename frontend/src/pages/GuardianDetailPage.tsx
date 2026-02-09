import type {
  GuardianDetail,
  GuardianForm,
  StudentGuardianResponse,
} from "../utils/responses";
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import { useAuth } from "../auth/UseAuth";
import { hasPermission, Permissions } from "../utils/permissions";
import { getErrorMessage } from "../utils/utilFuncs";
import { formatDateTime } from "../utils/date";
import {
  getGuardianDetail,
  getGuardianStudents,
  updateGuardian,
} from "../services/backend";

// Guardian profile view with self-editing if a parent user. parents are unable to see others details.
const emptyForm: GuardianForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  postcode: "",
};

type GuardianDetailPageProps = {
  self?: boolean;
};

export default function GuardianDetailPage({
  self = false,
}: GuardianDetailPageProps) {
  const navigate = useNavigate();
  const { guardianId: guardianIdParam } = useParams();
  const { user } = useAuth();
  const permissionLevel = user?.permissionLevel ?? 0;
  const isAdmin = (user?.roleName ?? "").toUpperCase() === "ADMIN";
  const canViewContact =
    isAdmin ||
    hasPermission(permissionLevel, Permissions.VIEW_GUARDIAN_CONTACT);
  const canViewAddress =
    isAdmin ||
    hasPermission(permissionLevel, Permissions.VIEW_GUARDIAN_ADDRESS);
  const canEditSelf = hasPermission(
    permissionLevel,
    Permissions.EDIT_GUARDIAN_SELF
  );

  const resolvedGuardianId = self
    ? (user?.guardianId ?? null)
    : guardianIdParam
      ? Number(guardianIdParam)
      : null;

  const isSelf =
    user?.guardianId != null &&
    resolvedGuardianId != null &&
    user.guardianId === resolvedGuardianId;

  const canEdit = isAdmin || (isSelf && canEditSelf);
  const canShowAddress = isAdmin || (isSelf && canViewAddress);
  const shouldLoadFull = isAdmin || (isSelf && (canEditSelf || canViewAddress));

  const canAccess =
    isAdmin || canViewContact || (isSelf && user?.guardianId != null);

  const [guardian, setGuardian] = useState<GuardianDetail | null>(null);
  const [formValues, setFormValues] = useState<GuardianForm>(emptyForm);
  const [guardianStudents, setGuardianStudents] = useState<
    StudentGuardianResponse[]
  >([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentsError, setStudentsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const loadGuardian = useCallback(
    async (id: number, signal?: AbortSignal) => {
      return getGuardianDetail(id, { full: shouldLoadFull }, signal);
    },
    [shouldLoadFull]
  );

  const loadGuardianStudents = useCallback(
    async (id: number, signal?: AbortSignal) => {
      return getGuardianStudents(id, signal);
    },
    []
  );

  useEffect(() => {
    if (!resolvedGuardianId) {
      setGuardian(null);
      setEditing(false);
      setSuccess(null);
      return;
    }

    const controller = new AbortController();

    (async () => {
      setLoading(true);
      setError(null);
      setSuccess(null);
      setEditing(false);
      try {
        const data = await loadGuardian(resolvedGuardianId, controller.signal);
        setGuardian(data);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(getErrorMessage(err, "Failed to load guardian details."));
        }
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [loadGuardian, resolvedGuardianId]);

  useEffect(() => {
    if (!resolvedGuardianId) {
      setGuardianStudents([]);
      setStudentsError(null);
      return;
    }

    const controller = new AbortController();

    (async () => {
      setStudentsLoading(true);
      setStudentsError(null);
      try {
        const data = await loadGuardianStudents(
          resolvedGuardianId,
          controller.signal
        );
        setGuardianStudents(data);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setStudentsError(
            getErrorMessage(err, "Failed to load guardian students.")
          );
        }
      } finally {
        setStudentsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [loadGuardianStudents, resolvedGuardianId]);

  useEffect(() => {
    if (!guardian) {
      setFormValues(emptyForm);
      return;
    }

    setFormValues({
      firstName: guardian.firstName ?? "",
      lastName: guardian.lastName ?? "",
      email: guardian.email ?? "",
      phone: guardian.phone ?? "",
      addressLine1: guardian.addressLine1 ?? "",
      addressLine2: guardian.addressLine2 ?? "",
      city: guardian.city ?? "",
      postcode: guardian.postcode ?? "",
    });
  }, [guardian]);

  async function handleSave() {
    if (!guardian || !canEdit) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
        email: formValues.email.trim() || null,
        phone: formValues.phone.trim() || null,
        addressLine1: formValues.addressLine1.trim() || null,
        addressLine2: formValues.addressLine2.trim() || null,
        city: formValues.city.trim() || null,
        postcode: formValues.postcode.trim() || null,
      };

      await updateGuardian(guardian.id, payload);

      const refreshed = await loadGuardian(guardian.id);
      setGuardian(refreshed);
      setEditing(false);
      setSuccess("Guardian details updated.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update guardian details."));
    } finally {
      setSaving(false);
    }
  }

  if (!canAccess) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
        You do not have permission to access this page.
      </div>
    );
  }

  if (!resolvedGuardianId) {
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-6 py-4 text-sm text-amber-100">
        No guardian profile is linked to your account yet.
      </div>
    );
  }

  const nameLabel = guardian
    ? `${guardian.firstName} ${guardian.lastName}`.trim()
    : "Guardian";

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Directory
        </p>
        <h1 className="text-3xl font-semibold text-white">
          {self ? "My Account" : "Guardian Profile"}
        </h1>
        <p className="text-sm text-slate-300">
          {self
            ? "Review and update the guardian details tied to your account."
            : "Review the guardian information you are allowed to see."}
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-200">
          {success}
        </div>
      )}

      {guardian && (
        <div className="space-y-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-2xl shadow-black/30">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                {self ? "Profile" : "Guardian Profile"}
              </p>
              <h2 className="text-2xl font-semibold text-white">{nameLabel}</h2>
            </div>

            {canEdit && (
              <div className="flex flex-wrap items-center gap-2">
                {!editing && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    Edit details
                  </Button>
                )}
                {editing && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={saving || loading}
                    >
                      {saving ? "Saving..." : "Save changes"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={saving}
                      onClick={() => {
                        setEditing(false);
                        if (guardian) {
                          setFormValues({
                            firstName: guardian.firstName ?? "",
                            lastName: guardian.lastName ?? "",
                            email: guardian.email ?? "",
                            phone: guardian.phone ?? "",
                            addressLine1: guardian.addressLine1 ?? "",
                            addressLine2: guardian.addressLine2 ?? "",
                            city: guardian.city ?? "",
                            postcode: guardian.postcode ?? "",
                          });
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {loading && (
            <div className="text-sm text-slate-300">
              Loading guardian data...
            </div>
          )}

          {!loading && (
            <div className="grid gap-6">
              <section className="grid gap-4 md:grid-cols-2">
                {renderField({
                  label: "First name",
                  value: guardian.firstName,
                  editing,
                  onChange: (value) =>
                    setFormValues((prev) => ({ ...prev, firstName: value })),
                  inputValue: formValues.firstName,
                })}
                {renderField({
                  label: "Last name",
                  value: guardian.lastName,
                  editing,
                  onChange: (value) =>
                    setFormValues((prev) => ({ ...prev, lastName: value })),
                  inputValue: formValues.lastName,
                })}
              </section>

              {canViewContact && (
                <section className="grid gap-4 md:grid-cols-2">
                  {renderField({
                    label: "Email",
                    value: guardian.email,
                    editing,
                    onChange: (value) =>
                      setFormValues((prev) => ({ ...prev, email: value })),
                    inputValue: formValues.email,
                    placeholder: "guardian@email.com",
                  })}
                  {renderField({
                    label: "Phone",
                    value: guardian.phone,
                    editing,
                    onChange: (value) =>
                      setFormValues((prev) => ({ ...prev, phone: value })),
                    inputValue: formValues.phone,
                    placeholder: "e.g., 01234 567 890",
                  })}
                </section>
              )}

              {canShowAddress && (
                <section className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {renderField({
                      label: "Address line 1",
                      value: guardian.addressLine1,
                      editing,
                      onChange: (value) =>
                        setFormValues((prev) => ({
                          ...prev,
                          addressLine1: value,
                        })),
                      inputValue: formValues.addressLine1,
                      placeholder: "Street and house number",
                    })}
                    {renderField({
                      label: "Address line 2",
                      value: guardian.addressLine2,
                      editing,
                      onChange: (value) =>
                        setFormValues((prev) => ({
                          ...prev,
                          addressLine2: value,
                        })),
                      inputValue: formValues.addressLine2,
                    })}
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {renderField({
                      label: "City",
                      value: guardian.city,
                      editing,
                      onChange: (value) =>
                        setFormValues((prev) => ({ ...prev, city: value })),
                      inputValue: formValues.city,
                    })}
                    {renderField({
                      label: "Postcode",
                      value: guardian.postcode,
                      editing,
                      onChange: (value) =>
                        setFormValues((prev) => ({ ...prev, postcode: value })),
                      inputValue: formValues.postcode,
                    })}
                  </div>
                </section>
              )}

              {canViewContact && !canShowAddress && (
                <div className="text-sm text-slate-400">
                  Address details are hidden for your role.
                </div>
              )}

              {guardian.updatedAt && (
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Last updated: {formatDateTime(guardian.updatedAt)}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {guardian && (
        <div className="overflow-x-auto rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-2xl shadow-black/30">
          <div className="px-6 pt-6">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Linked Students
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Students</h2>
          </div>

          {studentsError && (
            <div className="mx-6 mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
              {studentsError}
            </div>
          )}

          <table className="mt-4 min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="px-4 py-4">Student</th>
                <th className="px-4 py-4">Relationship</th>
                <th className="px-4 py-4">Primary</th>
              </tr>
            </thead>
            <tbody>
              {guardianStudents.map((studentLink) => (
                <tr
                  key={`${studentLink.studentId}-${studentLink.relationship ?? ""}`}
                  className="relative border-t border-slate-800/60 hover:bg-slate-900/50"
                >
                  <td className="px-4 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute inset-0 h-full w-full rounded-none px-0 py-0"
                      onClick={() =>
                        navigate(`/student/${studentLink.studentId}`)
                      }
                      aria-label={`Select ${studentLink.studentFirstName} ${studentLink.studentLastName}`}
                    >
                      <span className="sr-only">
                        Select {studentLink.studentFirstName}{" "}
                        {studentLink.studentLastName}
                      </span>
                    </Button>

                    <div className="relative z-10 pointer-events-none">
                      <div className="font-medium text-white">
                        {studentLink.studentFirstName}{" "}
                        {studentLink.studentLastName}
                      </div>
                      <div className="text-xs text-slate-400">
                        ID: {studentLink.studentId}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 relative z-10 pointer-events-none">
                    {studentLink.relationship || "-"}
                  </td>
                  <td className="px-4 py-4 relative z-10 pointer-events-none">
                    {studentLink.isPrimary ? "Yes" : "No"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!studentsLoading &&
            guardianStudents.length === 0 &&
            !studentsError && (
              <div className="px-6 py-8 text-center text-sm text-slate-400">
                No linked students found.
              </div>
            )}

          {studentsLoading && (
            <div className="px-6 py-8 text-center text-sm text-slate-400">
              Loading students...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Render a read-only or editable field block.
function renderField({
  label,
  value,
  editing,
  onChange,
  inputValue,
  placeholder,
}: {
  label: string;
  value?: string | null;
  editing: boolean;
  onChange: (value: string) => void;
  inputValue: string;
  placeholder?: string;
}) {
  if (editing) {
    return (
      <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
        {label}
        <TextField
          value={inputValue}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </label>
    );
  }

  return (
    <div className="grid gap-1.5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="text-sm text-slate-100">{value || "-"}</p>
    </div>
  );
}

// Format a full date/time string for display.
