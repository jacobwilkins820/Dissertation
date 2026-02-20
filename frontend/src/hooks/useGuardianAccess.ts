import { useEffect, useState } from "react";
import { getGuardianStudents } from "../services/backend";
import { getErrorMessage } from "../utils/utilFuncs";

// Resolves whether the currently signed-in guardian can access a given student record.
// Non-guardian users are allowed immediately; guardians require a relationship lookup.
export function useGuardianAccess(
  studentId: number,
  isGuardianUser: boolean,
  guardianId: number | null
) {
  const [guardianStudentIds, setGuardianStudentIds] = useState<number[] | null>(
    null
  );
  const [accessError, setAccessError] = useState<string | null>(null);
  const [loadedGuardianId, setLoadedGuardianId] = useState<number | null>(null);

  const hasValidStudentId = Number.isFinite(studentId);
  const requiresGuardianLookup = hasValidStudentId && isGuardianUser && guardianId != null;

  useEffect(() => {
    if (!requiresGuardianLookup || guardianId == null) {
      return;
    }

    // Abort previous request when guardian/student context changes.
    const controller = new AbortController();

    getGuardianStudents(guardianId, controller.signal)
      .then((data) => {
        setGuardianStudentIds((data ?? []).map((entry) => entry.studentId));
        setAccessError(null);
        setLoadedGuardianId(guardianId);
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setGuardianStudentIds(null);
          setAccessError(
            getErrorMessage(err, "Failed to verify student access.")
          );
          setLoadedGuardianId(guardianId);
        }
      });

    return () => controller.abort();
  }, [guardianId, requiresGuardianLookup]);

  if (!hasValidStudentId) {
    // Let page-level validation render the "invalid id" state.
    return { accessAllowed: null, accessChecking: false, accessError: null };
  }

  if (!isGuardianUser) {
    // Staff/admin users rely on route permissions instead of guardian linkage checks.
    return { accessAllowed: true, accessChecking: false, accessError: null };
  }

  if (guardianId == null) {
    return { accessAllowed: false, accessChecking: false, accessError: null };
  }

  const accessChecking = loadedGuardianId !== guardianId;
  const accessAllowed =
    accessChecking || !guardianStudentIds
      ? null
      : guardianStudentIds.includes(studentId);

  return { accessAllowed, accessChecking, accessError };
}
