import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { Button } from "../../components/ui/Button";
import { TextField } from "../../components/ui/TextField";
import { useAuth } from "../../auth/UseAuth";
import { useEffect, useState } from "react";
import { updateCurrentUser } from "../../services/backend";
import { getErrorMessage } from "../../utils/utilFuncs";

// account page for non-guardian users.
export default function UserAccountPage() {
  const { user, refreshMe } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    // Keep local form state synced whenever user snapshot changes.
    if (!user) return;
    setFormValues({
      firstName: user.firstName ?? "",
      lastName: user.lastName ?? "",
      email: user.email ?? "",
    });
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
        Unable to load account details.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Account"
        title="My Account"
        subtitle="Your user profile and role details."
      />

      {error && <AlertBanner variant="error">{error}</AlertBanner>}
      {success && <AlertBanner variant="success">{success}</AlertBanner>}

      <SectionCard className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
              Profile
            </p>
            <h2 className="text-2xl font-semibold text-white">
              {user.firstName} {user.lastName}
            </h2>
          </div>
          {!editing ? (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditing(true)}
            >
              Edit details
            </Button>
          ) : (
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={async () => {
                  // Basic required-field validation before calling backend.
                  const firstName = formValues.firstName.trim();
                  const lastName = formValues.lastName.trim();
                  const email = formValues.email.trim();

                  if (!firstName || !lastName || !email) {
                    setError("First name, last name, and email are required.");
                    return;
                  }

                  setSaving(true);
                  setError(null);
                  setSuccess(null);

                  try {
                    await updateCurrentUser({ firstName, lastName, email });
                    // Refresh /me-derived state so navbar/account labels update immediately.
                    await refreshMe();
                    setSuccess("Account details updated.");
                    setEditing(false);
                  } catch (err: unknown) {
                    setError(
                      getErrorMessage(err, "Failed to update account details."),
                    );
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save changes"}
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  // Discard edits and restore values from current user.
                  setFormValues({
                    firstName: user.firstName ?? "",
                    lastName: user.lastName ?? "",
                    email: user.email ?? "",
                  });
                  setError(null);
                  setSuccess(null);
                  setEditing(false);
                }}
                disabled={saving}
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <EditableField
            label="First name"
            value={formValues.firstName}
            editing={editing}
            onChange={(value) =>
              setFormValues((prev) => ({ ...prev, firstName: value }))
            }
          />
          <EditableField
            label="Last name"
            value={formValues.lastName}
            editing={editing}
            onChange={(value) =>
              setFormValues((prev) => ({ ...prev, lastName: value }))
            }
          />
          <EditableField
            label="Email"
            value={formValues.email}
            editing={editing}
            type="email"
            onChange={(value) =>
              setFormValues((prev) => ({ ...prev, email: value }))
            }
          />
          <Field label="Role" value={user.roleName} />
        </div>
      </SectionCard>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1.5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="text-sm text-slate-100">{value || "-"}</p>
    </div>
  );
}

function EditableField({
  label,
  value,
  editing,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (value: string) => void;
  type?: string;
}) {
  // Reuse a single component for view/edit states to keep field markup consistent.
  if (!editing) {
    return <Field label={label} value={value} />;
  }

  return (
    <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
      {label}
      <TextField
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
