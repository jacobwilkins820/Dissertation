import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import { useAuth } from "../auth/UseAuth";
import { hasPermission, Permissions } from "../utils/permissions";
import { getErrorMessage } from "../utils/utilFuncs";
import type { ClassListItemResponse } from "../utils/responses";
import { getClass, getClasses } from "../services/backend";

// Classes directory with role-filtered access.
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

  useEffect(() => {
    if (!canView) return;

    const controller = new AbortController();

    async function loadClasses() {
      setLoading(true);
      setError(null);

      try {
        const list = await getClasses(controller.signal);

        if (isAdmin || !user?.id) {
          setVisibleClasses(list);
          return;
        }

        const details = await Promise.all(
          list.map((item) => getClass(item.id, controller.signal))
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
          Review active classes and open rosters.
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
                <th className="px-6 py-4">Statistics</th>
              </tr>
            </thead>
            <tbody>
              {visibleClasses.map((clazz) => (
                <tr
                  key={clazz.id}
                  className="group relative border-t border-slate-800/60"
                >
                  <td className="relative px-6 py-4 group-hover:bg-slate-800/60">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="w-full"
                      onClick={() => navigate(`/classes/${clazz.id}`)}
                      aria-label={`Open ${clazz.name}`}
                    >
                      <span className="sr-only">Open {clazz.name}</span>

                      <div className="relative z-10 pointer-events-none ">
                        <div className="font-medium text-white">
                          {clazz.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          ID: {clazz.id}
                        </div>
                      </div>
                    </Button>
                  </td>
                  <td className="px-6 py-4 relative z-10 group-hover:bg-slate-800/60">
                    {clazz.code || "-"}
                  </td>
                  <td className="px-6 py-4 relative z-10 group-hover:bg-slate-800/60">
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
                  <td className="px-6 py-4 group-hover:bg-slate-800/60">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/attendance/${clazz.id}`)}
                    >
                      Attendance
                    </Button>
                  </td>
                  <td className="px-6 py-4 group-hover:bg-slate-800/60">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => navigate(`/statistics/${clazz.id}`)}
                    >
                      Statistics
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
    </div>
  );
}
