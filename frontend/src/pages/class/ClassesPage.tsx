import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { useAuth } from "../../auth/UseAuth";
import { hasPermission, Permissions } from "../../utils/permissions";
import { getErrorMessage } from "../../utils/utilFuncs";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import { StateMessage } from "../../components/ui/StateMessage";
import type { ClassListItemResponse } from "../../utils/responses";
import { getClass, getClasses } from "../../services/backend";

// Classes directory with role-filtered access.
export default function ClassesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const permissionLevel = user?.permissionLevel ?? 0;
  const canView = hasPermission(permissionLevel, Permissions.VIEW_CLASSES);
  const isAdmin = (user?.roleName ?? "").toUpperCase() === "ADMIN";

  const [visibleClasses, setVisibleClasses] = useState<ClassListItemResponse[]>(
    [],
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
          list.map((item) => getClass(item.id, controller.signal)),
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
      <AlertBanner variant="error">
        You do not have permission to access this page.
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Classes"
        title="Class Directory"
        subtitle="Review Classes."
      />
      <SectionCard padding="none">
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
          <div className="px-6 py-4">
            <AlertBanner variant="error">{error}</AlertBanner>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Class</th>
                <th className="px-6 py-4">Code</th>
                <th className="px-6 py-4">Status</th>
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
                      size="md"
                      className="w-1/2"
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
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && visibleClasses.length === 0 && !error && (
            <StateMessage>No classes available for your account.</StateMessage>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
