import { useEffect, useState } from "react";
import { getGuardianStudents } from "../services/backend";
import { getErrorMessage } from "../utils/utilFuncs";

export function useGuardianAccess(
  studentId: number,
  isGuardianUser: boolean,
  guardianId: number | null
) {
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [accessChecking, setAccessChecking] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(studentId)) {
      return;
    }

    if (!isGuardianUser) {
      setAccessAllowed(true);
      setAccessChecking(false);
      setAccessError(null);
      return;
    }

    if (guardianId == null) {
      setAccessAllowed(false);
      setAccessChecking(false);
      return;
    }

    const controller = new AbortController();
    setAccessChecking(true);
    setAccessAllowed(null);
    setAccessError(null);

    getGuardianStudents(guardianId, controller.signal)
      .then((data) => {
        const allowed = (data ?? []).some((entry) => entry.studentId === studentId);
        setAccessAllowed(allowed);
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setAccessError(
            getErrorMessage(err, "Failed to verify student access.")
          );
        }
      })
      .finally(() => setAccessChecking(false));

    return () => controller.abort();
  }, [guardianId, isGuardianUser, studentId]);

  return { accessAllowed, accessChecking, accessError };
}
