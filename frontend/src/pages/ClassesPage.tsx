import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/env";
import { Button } from "../components/Button";
import { SearchSelect } from "../components/SearchSelect";
import { TextField } from "../components/TextField";
import { useAuth } from "../auth/UseAuth";
import { hasPermission, Permissions } from "../utils/permissions";
import {
  extractErrorMessage,
  getAuthHeader,
  getErrorMessage,
  safeReadJson,
} from "../utils/utilFuncs";
import type {
  ClassListItemResponse,
  ClassResponse,
  UserListItemResponse,
} from "../utils/responses";

// Classes directory with admin-only create flow.
export default function ClassesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissionLevel = user?.permissionLevel ?? 0;
  const canView = hasPermission(permissionLevel, Permissions.VIEW_CLASSES);
  const isAdmin = (user?.roleName ?? "").toUpperCase() === "ADMIN";

  const [visibleClasses, setVisibleClasses] = useState<ClassListItemResponse[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (!canView) return;

    const controller = new AbortController();

    async function loadClasses() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${API_BASE_URL}/api/classes`, {
          headers: {
            ...getAuthHeader(),
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          const payload = await safeReadJson(res);
          throw new Error(extractErrorMessage(payload));
        }

        const payload = (await safeReadJson(res)) as ClassListItemResponse[];
        const list = Array.isArray(payload) ? payload : [];

        if (isAdmin || !user?.id) {
          setVisibleClasses(list);
          return;
        }

        const details = await Promise.all(
          list.map(async (item) => {
            const detailRes = await fetch(
              `${API_BASE_URL}/api/classes/${item.id}`,
              { headers: { ...getAuthHeader() }, signal: controller.signal }
            );

            if (!detailRes.ok) {
              const detailPayload = await safeReadJson(detailRes);
              throw new Error(extractErrorMessage(detailPayload));
            }

            return (await safeReadJson(detailRes)) as ClassResponse;
          })
        );

        const allowed = list.filter((_, idx) => {
          const detail = details[idx];
          return detail?.teacherId === user.id;
        });

        setVisibleClasses(allowed);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(getErrorMessage(err, "Failed to load classes."));
        }
      } finally {
        setLoading(false);
      }
    }

    loadClasses();

    return () => controller.abort();
  }, [canView, isAdmin, user?.id]);

  const fetchTeachers = useCallback(
    async (query: string, signal: AbortSignal) => {
      if (!teachersCacheRef.current) {
        const res = await fetch(`${API_BASE_URL}/api/users`, {
          headers: {
            ...getAuthHeader(),
          },
          signal,
        });

        if (!res.ok) {
          const payload = await safeReadJson(res);
          throw new Error(extractErrorMessage(payload));
        }

        const payload = (await safeReadJson(res)) as UserListItemResponse[];
        const list = Array.isArray(payload) ? payload : [];
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

  // Create a new class and refresh the list.
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
      const res = await fetch(`${API_BASE_URL}/api/classes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const responsePayload = await safeReadJson(res);
        throw new Error(extractErrorMessage(responsePayload));
      }

      await safeReadJson(res);

      setSuccessMsg("Class created successfully.");
      setName("");
      setCode("");
      setActive(true);
      setSelectedTeacher(null);
      setTeacherResetKey((prev) => prev + 1);

      setLoading(true);
      const listRes = await fetch(`${API_BASE_URL}/api/classes`, {
        headers: { ...getAuthHeader() },
      });
      if (listRes.ok) {
        const listPayload = (await safeReadJson(
          listRes
        )) as ClassListItemResponse[];
        const list = Array.isArray(listPayload) ? listPayload : [];
        setVisibleClasses(list);
      }
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, "Failed to create class."));
    } finally {
      setSubmitting(false);
      setLoading(false);
    }
  }

  if (!canView) {
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
        <h1 className="text-3xl font-semibold text-white">Class Directory</h1>
        <p className="text-sm text-slate-300">
          Review active classes, create new offerings, and open rosters.
        </p>
      </div>
      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-2xl shadow-black/30">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 text-sm text-slate-300">
          <span>
            {loading
              ? "Loading classes..."
              : `Showing ${visibleClasses.length} class${
                  visibleClasses.length === 1 ? "" : "es"
                }`}
          </span>
        </div>

        {error && (
          <div className="px-6 py-4 text-xs text-rose-200">{error}</div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {visibleClasses.map((clazz) => (
                <tr
                  key={clazz.id}
                  className="relative border-t border-slate-800/60 hover:bg-slate-900/50"
                >
                  <td className="relative px-6 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute inset-0 h-full w-full rounded-none px-0 py-0"
                      onClick={() => navigate(`/classes/${clazz.id}`)}
                      aria-label={`Open ${clazz.name}`}
                    >
                      <span className="sr-only">Open {clazz.name}</span>
                    </Button>
                    <div className="relative z-10 pointer-events-none">
                      <div className="font-medium text-white">{clazz.name}</div>
                      <div className="text-xs text-slate-400">
                        ID: {clazz.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 relative z-10 pointer-events-none">
                    {clazz.code || "-"}
                  </td>
                  <td className="px-6 py-4 relative z-10 pointer-events-none">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${
                        clazz.active
                          ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-200"
                          : "border-amber-300/40 bg-amber-400/10 text-amber-200"
                      }`}
                    >
                      {clazz.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/attendance/${clazz.id}`)}
                    >
                      Attendance
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && visibleClasses.length === 0 && !error && (
            <div className="px-6 py-8 text-center text-sm text-slate-400">
              No classes available for your account.
            </div>
          )}
        </div>
      </div>
      {isAdmin && (
        <form
          onSubmit={handleCreateClass}
          className="grid gap-4 rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 shadow-2xl shadow-black/30"
        >
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Create class
            </p>
            <p className="text-sm text-slate-300">
              Assign a teacher now or leave the class unassigned.
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
      )}
    </div>
  );
}
