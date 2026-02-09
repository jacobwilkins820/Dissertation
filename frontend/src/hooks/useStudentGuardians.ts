import { useCallback, useEffect, useState } from "react";
import type { GuardianSearch, StudentGuardianResponse } from "../utils/responses";
import {
  deleteStudentGuardianLink,
  getStudentGuardians,
  searchGuardians,
  updateStudentGuardianLink,
} from "../services/backend";
import { getErrorMessage } from "../utils/utilFuncs";

export type GuardianEditState = {
  relationship: string;
  isPrimary: boolean;
};

export function useStudentGuardians(
  studentId: number,
  canViewGuardians: boolean,
  canEditGuardians: boolean
) {
  const [guardians, setGuardians] = useState<StudentGuardianResponse[]>([]);
  const [guardiansLoading, setGuardiansLoading] = useState(false);
  const [guardiansError, setGuardiansError] = useState<string | null>(null);
  const [guardianEdits, setGuardianEdits] = useState<
    Record<number, GuardianEditState>
  >({});
  const [primaryGuardianId, setPrimaryGuardianId] = useState<number | null>(null);
  const [guardianSaveState, setGuardianSaveState] = useState<Record<number, boolean>>({});
  const [guardianRemoveState, setGuardianRemoveState] = useState<Record<number, boolean>>({});
  const [guardianSaveError, setGuardianSaveError] = useState<string | null>(null);
  const [guardianSaveSuccess, setGuardianSaveSuccess] = useState<string | null>(null);

  const [selectedGuardian, setSelectedGuardian] = useState<GuardianSearch | null>(null);
  const [linkRelationship, setLinkRelationship] = useState("");
  const [linkIsPrimary, setLinkIsPrimary] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [showAddGuardian, setShowAddGuardian] = useState(false);
  const [addResetKey, setAddResetKey] = useState(0);

  const applyGuardianList = useCallback((list: StudentGuardianResponse[]) => {
    const sorted = [...list].sort((a, b) => {
      const lastA = (a.guardianLastName ?? "").toLowerCase();
      const lastB = (b.guardianLastName ?? "").toLowerCase();
      if (lastA !== lastB) return lastA.localeCompare(lastB);
      const firstA = (a.guardianFirstName ?? "").toLowerCase();
      const firstB = (b.guardianFirstName ?? "").toLowerCase();
      return firstA.localeCompare(firstB);
    });

    setGuardians(sorted);

    const nextEdits: Record<number, GuardianEditState> = {};
    sorted.forEach((guardian) => {
      nextEdits[guardian.guardianId] = {
        relationship: guardian.relationship ?? "",
        isPrimary: guardian.isPrimary,
      };
    });
    setGuardianEdits(nextEdits);

    const primary = sorted.find((guardian) => guardian.isPrimary);
    setPrimaryGuardianId(primary ? primary.guardianId : null);
  }, []);

  useEffect(() => {
    if (!Number.isFinite(studentId) || !canViewGuardians) {
      setGuardians([]);
      return;
    }

    const controller = new AbortController();
    setGuardiansLoading(true);
    setGuardiansError(null);

    getStudentGuardians(studentId, controller.signal)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        applyGuardianList(list);
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setGuardiansError(getErrorMessage(err, "Failed to load guardians."));
        }
      })
      .finally(() => setGuardiansLoading(false));

    return () => controller.abort();
  }, [applyGuardianList, canViewGuardians, studentId]);

  useEffect(() => {
    if (!guardianSaveError) return;
    const timeoutId = window.setTimeout(() => {
      setGuardianSaveError(null);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [guardianSaveError]);

  useEffect(() => {
    if (!guardianSaveSuccess) return;
    const timeoutId = window.setTimeout(() => {
      setGuardianSaveSuccess(null);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [guardianSaveSuccess]);

  useEffect(() => {
    if (!linkError) return;
    const timeoutId = window.setTimeout(() => {
      setLinkError(null);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [linkError]);

  useEffect(() => {
    if (!linkSuccess) return;
    const timeoutId = window.setTimeout(() => {
      setLinkSuccess(null);
    }, 5000);
    return () => window.clearTimeout(timeoutId);
  }, [linkSuccess]);

  const handleGuardianSave = useCallback(
    async (guardianId: number) => {
      if (!canEditGuardians) return;

      const edit = guardianEdits[guardianId];
      if (!edit || !edit.relationship.trim()) {
        setGuardianSaveError("Relationship is required.");
        return;
      }

      const currentPrimaryId =
        guardians.find((guardian) => guardian.isPrimary)?.guardianId ?? null;
      const needsPrimarySwitch =
        primaryGuardianId === guardianId &&
        currentPrimaryId !== null &&
        currentPrimaryId !== guardianId;

      if (needsPrimarySwitch) {
        const currentPrimaryRelationship =
          guardianEdits[currentPrimaryId]?.relationship ??
          guardians.find((guardian) => guardian.guardianId === currentPrimaryId)
            ?.relationship ??
          "";

        if (!currentPrimaryRelationship.trim()) {
          setGuardianSaveError(
            "Primary guardian relationship is required before switching."
          );
          return;
        }
      }

      setGuardianSaveError(null);
      setGuardianSaveSuccess(null);
      setGuardianSaveState((prev) => ({
        ...prev,
        [guardianId]: true,
        ...(needsPrimarySwitch && currentPrimaryId !== null
          ? { [currentPrimaryId]: true }
          : {}),
      }));

      try {
        if (needsPrimarySwitch && currentPrimaryId !== null) {
          const currentPrimaryRelationship =
            guardianEdits[currentPrimaryId]?.relationship ??
            guardians.find((guardian) => guardian.guardianId === currentPrimaryId)
              ?.relationship ??
            "";

          await updateStudentGuardianLink(studentId, currentPrimaryId, {
            relationship: currentPrimaryRelationship.trim(),
            isPrimary: false,
          });
        }

        await updateStudentGuardianLink(studentId, guardianId, {
          relationship: edit.relationship.trim(),
          isPrimary: primaryGuardianId === guardianId,
        });

        setGuardianSaveSuccess("Guardian link updated.");
        const refreshed = await getStudentGuardians(studentId);
        applyGuardianList(refreshed ?? []);
      } catch (err: unknown) {
        setGuardianSaveError(
          getErrorMessage(err, "Failed to update guardian link.")
        );
      } finally {
        setGuardianSaveState((prev) => ({
          ...prev,
          [guardianId]: false,
          ...(needsPrimarySwitch && currentPrimaryId !== null
            ? { [currentPrimaryId]: false }
            : {}),
        }));
      }
    },
    [
      applyGuardianList,
      canEditGuardians,
      guardianEdits,
      guardians,
      primaryGuardianId,
      studentId,
    ]
  );

  const handlePrimaryChange = useCallback(
    async (guardianId: number) => {
      if (!canEditGuardians) return;

      const currentPrimaryId =
        guardians.find((guardian) => guardian.isPrimary)?.guardianId ?? null;

      if (guardianId === currentPrimaryId) return;

      const getRelationship = (id: number) =>
        guardianEdits[id]?.relationship ??
        guardians.find((guardian) => guardian.guardianId === id)?.relationship ??
        "";

      const nextRelationship = getRelationship(guardianId);
      if (!nextRelationship.trim()) {
        setGuardianSaveError("Relationship is required.");
        return;
      }

      if (currentPrimaryId !== null) {
        const currentRelationship = getRelationship(currentPrimaryId);
        if (!currentRelationship.trim()) {
          setGuardianSaveError(
            "Primary guardian relationship is required before switching."
          );
          return;
        }
      }

      setGuardianSaveError(null);
      setGuardianSaveSuccess(null);
      setPrimaryGuardianId(guardianId);
      setGuardianSaveState((prev) => ({
        ...prev,
        [guardianId]: true,
        ...(currentPrimaryId !== null ? { [currentPrimaryId]: true } : {}),
      }));

      try {
        if (currentPrimaryId !== null) {
          await updateStudentGuardianLink(studentId, currentPrimaryId, {
            relationship: getRelationship(currentPrimaryId).trim(),
            isPrimary: false,
          });
        }

        await updateStudentGuardianLink(studentId, guardianId, {
          relationship: nextRelationship.trim(),
          isPrimary: true,
        });

        setGuardianSaveSuccess("Primary guardian updated.");
        const refreshed = await getStudentGuardians(studentId);
        applyGuardianList(refreshed ?? []);
      } catch (err: unknown) {
        setPrimaryGuardianId(currentPrimaryId);
        setGuardianSaveError(
          getErrorMessage(err, "Failed to update guardian link.")
        );
      } finally {
        setGuardianSaveState((prev) => ({
          ...prev,
          [guardianId]: false,
          ...(currentPrimaryId !== null ? { [currentPrimaryId]: false } : {}),
        }));
      }
    },
    [
      applyGuardianList,
      canEditGuardians,
      guardianEdits,
      guardians,
      studentId,
    ]
  );

  const handleGuardianLink = useCallback(async () => {
    if (!selectedGuardian || !canEditGuardians) return;
    if (!linkRelationship.trim()) {
      setLinkError("Relationship is required.");
      return;
    }

    setLinking(true);
    setLinkError(null);
    setLinkSuccess(null);

    try {
      const currentPrimaryId =
        guardians.find((guardian) => guardian.isPrimary)?.guardianId ?? null;
      const needsPrimarySwitch =
        linkIsPrimary &&
        currentPrimaryId !== null &&
        currentPrimaryId !== selectedGuardian.id;

      if (needsPrimarySwitch && currentPrimaryId !== null) {
        const currentPrimaryRelationship =
          guardianEdits[currentPrimaryId]?.relationship ??
          guardians.find((guardian) => guardian.guardianId === currentPrimaryId)
            ?.relationship ??
          "";

        if (!currentPrimaryRelationship.trim()) {
          setLinkError(
            "Primary guardian relationship is required before switching."
          );
          return;
        }

        await updateStudentGuardianLink(studentId, currentPrimaryId, {
          relationship: currentPrimaryRelationship.trim(),
          isPrimary: false,
        });
      }

      await updateStudentGuardianLink(studentId, selectedGuardian.id, {
        relationship: linkRelationship.trim(),
        isPrimary: linkIsPrimary,
      });

      setLinkSuccess("Guardian linked.");
      setSelectedGuardian(null);
      setLinkRelationship("");
      setLinkIsPrimary(false);
      setShowAddGuardian(false);
      setAddResetKey((prev) => prev + 1);

      const refreshed = await getStudentGuardians(studentId);
      applyGuardianList(refreshed ?? []);
    } catch (err: unknown) {
      setLinkError(getErrorMessage(err, "Failed to link guardian."));
    } finally {
      setLinking(false);
    }
  }, [
    applyGuardianList,
    canEditGuardians,
    guardianEdits,
    guardians,
    linkIsPrimary,
    linkRelationship,
    selectedGuardian,
    studentId,
  ]);

  const handleGuardianRemove = useCallback(
    async (guardianId: number) => {
      if (!canEditGuardians) return;
      const target = guardians.find(
        (guardian) => guardian.guardianId === guardianId
      );
      if (!target) return;
      if (target.isPrimary) {
        setGuardianSaveError("Primary guardian cannot be removed.");
        return;
      }

      setGuardianSaveError(null);
      setGuardianSaveSuccess(null);
      setGuardianRemoveState((prev) => ({ ...prev, [guardianId]: true }));

      try {
        await deleteStudentGuardianLink(studentId, guardianId);
        const next = guardians.filter(
          (guardian) => guardian.guardianId !== guardianId
        );
        applyGuardianList(next);
        setGuardianSaveSuccess("Guardian removed.");
      } catch (err: unknown) {
        setGuardianSaveError(getErrorMessage(err, "Failed to remove guardian."));
      } finally {
        setGuardianRemoveState((prev) => ({ ...prev, [guardianId]: false }));
      }
    },
    [applyGuardianList, canEditGuardians, guardians, studentId]
  );

  const fetchGuardianMatches = useCallback(
    async (query: string, signal: AbortSignal) => {
      return searchGuardians<GuardianSearch>(query, signal);
    },
    []
  );

  const openAddGuardian = useCallback(() => {
    setShowAddGuardian(true);
    setLinkError(null);
    setLinkSuccess(null);
  }, []);

  const closeAddGuardian = useCallback(() => {
    setShowAddGuardian(false);
    setSelectedGuardian(null);
    setLinkRelationship("");
    setLinkIsPrimary(false);
    setLinkError(null);
    setLinkSuccess(null);
    setAddResetKey((prev) => prev + 1);
  }, []);

  const clearLinkForm = useCallback(() => {
    setSelectedGuardian(null);
    setLinkRelationship("");
    setLinkIsPrimary(false);
    setLinkError(null);
    setLinkSuccess(null);
    setAddResetKey((prev) => prev + 1);
  }, []);

  return {
    guardians,
    guardiansLoading,
    guardiansError,
    guardianEdits,
    setGuardianEdits,
    primaryGuardianId,
    guardianSaveState,
    guardianRemoveState,
    guardianSaveError,
    guardianSaveSuccess,
    selectedGuardian,
    setSelectedGuardian,
    linkRelationship,
    setLinkRelationship,
    linkIsPrimary,
    setLinkIsPrimary,
    linking,
    linkError,
    linkSuccess,
    showAddGuardian,
    addResetKey,
    handleGuardianSave,
    handlePrimaryChange,
    handleGuardianLink,
    handleGuardianRemove,
    fetchGuardianMatches,
    openAddGuardian,
    closeAddGuardian,
    clearLinkForm,
  };
}
