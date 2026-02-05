import { useCallback, useRef, useState } from "react";
import { Button } from "../components/Button";
import { SearchSelect } from "../components/SearchSelect";
import { TextField } from "../components/TextField";
import { useAuth } from "../auth/UseAuth";
import { hasPermission, Permissions } from "../utils/permissions";
import { getErrorMessage } from "../utils/utilFuncs";
import type { UserListItemResponse } from "../utils/responses";
import { createClass, getUsers } from "../services/backend";

// Admin-only class creation page.
export default function AddClassPage() {
  const { user } = useAuth();
  const permissionLevel = user?.permissionLevel ?? 0;
  const canView = hasPermission(permissionLevel, Permissions.VIEW_CLASSES);
  const isAdmin = (user?.roleName ?? "").toUpperCase() === "ADMIN";

  const [selectedTeacher, setSelectedTeacher] =
    useState<UserListItemResponse | null>(null);
  const [teacherResetKey, setTeacherResetKey] = useState(0);
  const teachersCacheRef = useRef<UserListItemResponse[] | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchTeachers = useCallback(
    async (query: string, signal: AbortSignal) => {
      if (!teachersCacheRef.current) {
        const list = await getUsers(signal);
        teachersCacheRef.current = list.filter(
          (item) => (item.roleName ?? "").toUpperCase() === "TEACHER"
        );
      }

      const q = query.trim().toLowerCase();
      return (teachersCacheRef.current ?? []).filter((t) => {
        const label = `${t.firstName ?? ""} ${t.lastName ?? ""} ${t.email ?? ""}`;
        return label.toLowerCase().includes(q);
      });
    },
    []
  );

  async function handleCreateClass(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setFormError("Class name is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      code: code.trim() ? code.trim() : undefined,
      active,
      teacherId: selectedTeacher?.id ?? undefined,
    };

    setSubmitting(true);
    try {
      await createClass(payload);

      setSuccessMsg("Class created successfully.");
      setName("");
      setCode("");
      setActive(true);
      setSelectedTeacher(null);
      setTeacherResetKey((prev) => prev + 1);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to create class."));
    } finally {
      setSubmitting(false);
    }
  }

  if (!canView || !isAdmin) {
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
          Classes
        </p>
        <h1 className="text-3xl font-semibold text-white">Create Class</h1>
        <p className="text-sm text-slate-300">
          Set up a new class and optionally assign a teacher.
        </p>
      </div>

      {formError && (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
          {formError}
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-200">
          {successMsg}
        </div>
      )}

      <form
        onSubmit={handleCreateClass}
        className="grid gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-2xl shadow-black/30"
      >
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Class details
          </p>
          <p className="text-sm text-slate-300">
            Assign a teacher now or leave the class unassigned.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Class name
            <TextField
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Year 1"
            />
          </label>

          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Class code
            <TextField
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., YR1"
            />
          </label>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <div className="grid gap-2">
            <SearchSelect
              label="Assign teacher"
              placeholder="Type a teacher name"
              selected={selectedTeacher}
              onSelect={setSelectedTeacher}
              fetchOptions={fetchTeachers}
              getOptionKey={(teacher) => teacher.id}
              getOptionLabel={(teacher) =>
                `${teacher.firstName ?? ""} ${teacher.lastName ?? ""}${
                  teacher.email ? ` - ${teacher.email}` : ""
                }`
              }
              idleLabel="Type at least 2 characters."
              loadingLabel="Loading teachers..."
              resultsLabel="Results"
              emptyLabel="No matches."
              resetKey={teacherResetKey}
            />
          </div>

          <label className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-300">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border border-slate-700 bg-slate-950 text-amber-300 focus:ring-2 focus:ring-amber-400/40"
            />
            Active
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create class"}
          </Button>

          <Button
            variant="secondary"
            disabled={submitting}
            onClick={() => {
              setName("");
              setCode("");
              setActive(true);
              setSelectedTeacher(null);
              setTeacherResetKey((prev) => prev + 1);
              setFormError(null);
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
