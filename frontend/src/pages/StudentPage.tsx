import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/Button";
import { DatePicker } from "../components/DatePicker";
import { SearchSelect } from "../components/SearchSelect";
import { SelectDropdown } from "../components/SelectDropdown";
import { TextField } from "../components/TextField";
import { useAuth } from "../auth/UseAuth";
import { hasPermission, Permissions } from "../utils/permissions";
import { getErrorMessage } from "../utils/utilFuncs";
import type {
  GuardianSearch,
  Student,
  StudentGuardianResponse,
} from "../utils/responses";
import {
  getAttendanceRecordsForSession,
  getAttendanceSessionsForClass,
  getCurrentAcademicYear,
  getGuardianStudents,
  getStudent,
  getStudentEnrolments,
  getStudentGuardians,
  searchGuardians,
  deleteStudentGuardianLink,
  updateStudent,
  updateStudentGuardianLink,
} from "../services/backend";

// Student form state for editing.
type StudentForm = {
  upn: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  status: string;
};

// Guardian edit state to keep local edits.
type GuardianEditState = {
  relationship: string;
  isPrimary: boolean;
};

// Attendance rollup for a time range.
type AttendanceSummary = {
  label: string;
  present: number;
  late: number;
  absent: number;
  total: number;
  percent: string;
  note: string;
};

// Range options for attendance.
type AttendanceRange = "last-week" | "last-month";

// Empty student form placeholder.
const emptyForm: StudentForm = {
  upn: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  status: "ACTIVE",
};

// Student profile page with live API data.
export default function StudentPage() {
  // Route param for the student id.
  const { studentId } = useParams();
  const parsedId = Number(studentId);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Permission checks for edit and attendance access.
  const permissionLevel = user?.permissionLevel ?? 0;
  const canEditStudent = hasPermission(
    permissionLevel,
    Permissions.EDIT_STUDENT_DETAILS
  );
  const canViewAttendance = hasPermission(
    permissionLevel,
    Permissions.VIEW_ATTENDANCE
  );
  const isAdmin = (user?.roleName ?? "").toUpperCase() === "ADMIN";
  const guardianId = user?.guardianId ?? null;
  const isGuardianUser = !isAdmin && guardianId != null;
  const canEditGuardians = isAdmin;
  const canViewGuardians = isAdmin;

  // Core student record state.
  const [student, setStudent] = useState<Student | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [savingStudent, setSavingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState(false);
  const [formValues, setFormValues] = useState<StudentForm>(emptyForm);

  // Guardian list state.
  const [guardians, setGuardians] = useState<StudentGuardianResponse[]>([]);
  const [guardiansLoading, setGuardiansLoading] = useState(false);
  const [guardiansError, setGuardiansError] = useState<string | null>(null);
  const [guardianEdits, setGuardianEdits] = useState<
    Record<number, GuardianEditState>
  >({});
  const [primaryGuardianId, setPrimaryGuardianId] = useState<number | null>(
    null
  );
  const [guardianSaveState, setGuardianSaveState] = useState<
    Record<number, boolean>
  >({});
  const [guardianRemoveState, setGuardianRemoveState] = useState<
    Record<number, boolean>
  >({});
  const [guardianSaveError, setGuardianSaveError] = useState<string | null>(
    null
  );
  const [guardianSaveSuccess, setGuardianSaveSuccess] = useState<string | null>(
    null
  );

  // Guardian search + link state.
  const [selectedGuardian, setSelectedGuardian] =
    useState<GuardianSearch | null>(null);
  const [linkRelationship, setLinkRelationship] = useState("");
  const [linkIsPrimary, setLinkIsPrimary] = useState(false);
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null);
  const [showAddGuardian, setShowAddGuardian] = useState(false);
  const [addResetKey, setAddResetKey] = useState(0);

  // Attendance range and summary state.
  const [attendanceRange, setAttendanceRange] =
    useState<AttendanceRange>("last-week");
  const [attendanceSummary, setAttendanceSummary] =
    useState<AttendanceSummary | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  // Guardian access check for parent users.
  const [accessAllowed, setAccessAllowed] = useState<boolean | null>(null);
  const [accessChecking, setAccessChecking] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  // Load a single student by id.
  const loadStudent = useCallback(async (id: number, signal?: AbortSignal) => {
    return getStudent(id, signal);
  }, []);

  // Load guardians linked to the student.
  const loadGuardians = useCallback(
    async (id: number, signal?: AbortSignal) => {
      return getStudentGuardians(id, signal);
    },
    []
  );

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

  const loadGuardianStudents = useCallback(
    async (id: number, signal?: AbortSignal) => {
      return getGuardianStudents(id, signal);
    },
    []
  );

  // Fetch guardian search results for linking.
  const fetchGuardianMatches = useCallback(
    async (query: string, signal: AbortSignal) => {
      return searchGuardians<GuardianSearch>(query, signal);
    },
    []
  );

  // Load student details on mount or id change.
  useEffect(() => {
    if (!Number.isFinite(parsedId)) {
      setStudentError("Invalid student id.");
      return;
    }

    if (isGuardianUser && accessAllowed !== true) {
      setStudent(null);
      setStudentLoading(false);
      return;
    }

    const controller = new AbortController();
    setStudentLoading(true);
    setStudentError(null);

    loadStudent(parsedId, controller.signal)
      .then((data) => {
        setStudent(data);
        setFormValues({
          upn: data.upn ?? "",
          firstName: data.firstName ?? "",
          lastName: data.lastName ?? "",
          dateOfBirth: data.dateOfBirth ?? "",
          gender: data.gender ?? "",
          status: data.status ?? "ACTIVE",
        });
      })
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setStudentError(getErrorMessage(err, "Failed to load student."));
        }
      })
      .finally(() => setStudentLoading(false));

    return () => controller.abort();
  }, [accessAllowed, isGuardianUser, loadStudent, parsedId]);

  // Confirm guardian users can access this student.
  useEffect(() => {
    if (!Number.isFinite(parsedId)) {
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

    loadGuardianStudents(guardianId, controller.signal)
      .then((data) => {
        const allowed = (data ?? []).some(
          (entry) => entry.studentId === parsedId
        );
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
  }, [guardianId, isGuardianUser, loadGuardianStudents, parsedId]);

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

  // Load guardians once the student is available.
  useEffect(() => {
    if (!Number.isFinite(parsedId) || !canViewGuardians) {
      setGuardians([]);
      return;
    }

    const controller = new AbortController();
    setGuardiansLoading(true);
    setGuardiansError(null);

    loadGuardians(parsedId, controller.signal)
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
  }, [applyGuardianList, canViewGuardians, loadGuardians, parsedId]);

  // Save core student updates.
  const handleStudentSave = async () => {
    if (!student || !canEditStudent) return;

    setSavingStudent(true);
    setStudentError(null);

    try {
      const payload = {
        upn: formValues.upn.trim(),
        firstName: formValues.firstName.trim(),
        lastName: formValues.lastName.trim(),
        dateOfBirth: formValues.dateOfBirth,
        gender: formValues.gender.trim(),
        status: formValues.status,
      };

      await updateStudent(student.id, payload);

      const refreshed = await loadStudent(student.id);
      setStudent(refreshed);
      setEditingStudent(false);
    } catch (err: unknown) {
      setStudentError(getErrorMessage(err, "Failed to update student."));
    } finally {
      setSavingStudent(false);
    }
  };

  // Save guardian relationship edits.
  const handleGuardianSave = async (guardianId: number) => {
    if (!student || !canEditGuardians) return;

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

        await updateStudentGuardianLink(student.id, currentPrimaryId, {
          relationship: currentPrimaryRelationship.trim(),
          isPrimary: false,
        });
      }

      await updateStudentGuardianLink(student.id, guardianId, {
        relationship: edit.relationship.trim(),
        isPrimary: primaryGuardianId === guardianId,
      });

      setGuardianSaveSuccess("Guardian link updated.");
      const refreshed = await loadGuardians(student.id);
      applyGuardianList(refreshed);
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
  };

  const handlePrimaryChange = async (guardianId: number) => {
    if (!student || !canEditGuardians) return;

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
        await updateStudentGuardianLink(student.id, currentPrimaryId, {
          relationship: getRelationship(currentPrimaryId).trim(),
          isPrimary: false,
        });
      }

      await updateStudentGuardianLink(student.id, guardianId, {
        relationship: nextRelationship.trim(),
        isPrimary: true,
      });

      setGuardianSaveSuccess("Primary guardian updated.");
      const refreshed = await loadGuardians(student.id);
      applyGuardianList(refreshed);
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
  };

  // Link a new guardian to the student.
  const handleGuardianLink = async () => {
    if (!student || !selectedGuardian || !canEditGuardians) return;
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

        await updateStudentGuardianLink(student.id, currentPrimaryId, {
          relationship: currentPrimaryRelationship.trim(),
          isPrimary: false,
        });
      }

      await updateStudentGuardianLink(student.id, selectedGuardian.id, {
        relationship: linkRelationship.trim(),
        isPrimary: linkIsPrimary,
      });

      setLinkSuccess("Guardian linked.");
      setSelectedGuardian(null);
      setLinkRelationship("");
      setLinkIsPrimary(false);
      setShowAddGuardian(false);
      setAddResetKey((prev) => prev + 1);

      const refreshed = await loadGuardians(student.id);
      applyGuardianList(refreshed);
    } catch (err: unknown) {
      setLinkError(getErrorMessage(err, "Failed to link guardian."));
    } finally {
      setLinking(false);
    }
  };

  const handleGuardianRemove = async (guardianId: number) => {
    if (!student || !canEditGuardians) return;
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
      await deleteStudentGuardianLink(student.id, guardianId);
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
  };

  // Load attendance summary for the selected range.
  useEffect(() => {
    if (!Number.isFinite(parsedId) || !canViewAttendance) {
      setAttendanceSummary(null);
      return;
    }

    if (isGuardianUser && accessAllowed !== true) {
      setAttendanceSummary(null);
      return;
    }

    const controller = new AbortController();
    const { from, to, label } = getAttendanceRangeDates(attendanceRange);

    (async () => {
      setAttendanceLoading(true);
      setAttendanceError(null);

      try {
        const year = await getCurrentAcademicYear(controller.signal);

        const enrolments = await getStudentEnrolments(
          parsedId,
          year.id,
          controller.signal
        );

        const classIds = Array.from(
          new Set((enrolments ?? []).map((item) => item.classId))
        );

        if (classIds.length === 0) {
          setAttendanceSummary({
            label,
            present: 0,
            late: 0,
            absent: 0,
            total: 0,
            percent: "0%",
            note: "No classes enrolled for this range.",
          });
          return;
        }

        const sessionLists = await Promise.all(
          classIds.map((classId) =>
            getAttendanceSessionsForClass(classId, from, to, controller.signal)
          )
        );

        const sessions = sessionLists.flat();
        if (sessions.length === 0) {
          setAttendanceSummary({
            label,
            present: 0,
            late: 0,
            absent: 0,
            total: 0,
            percent: "0%",
            note: "No attendance sessions recorded.",
          });
          return;
        }

        const recordLists = await Promise.all(
          sessions.map((session) =>
            getAttendanceRecordsForSession(session.id, controller.signal)
          )
        );

        const records = recordLists.flat();
        const studentRecords = records.filter(
          (record) => record.studentId === parsedId
        );

        const present = studentRecords.filter(
          (record) => record.status === "PRESENT"
        ).length;
        const late = studentRecords.filter(
          (record) => record.status === "LATE"
        ).length;
        const absent = studentRecords.filter(
          (record) => record.status === "ABSENT"
        ).length;

        const total = present + late + absent;
        const percent =
          total === 0
            ? "0%"
            : `${Math.round(((present + late) / total) * 100)}%`;

        setAttendanceSummary({
          label,
          present,
          late,
          absent,
          total,
          percent,
          note:
            total === 0
              ? "No attendance records in range."
              : `Based on ${total} recorded sessions.`,
        });
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setAttendanceError(
            getErrorMessage(err, "Failed to load attendance summary.")
          );
        }
      } finally {
        setAttendanceLoading(false);
      }
    })();

    return () => controller.abort();
  }, [
    accessAllowed,
    attendanceRange,
    canViewAttendance,
    isGuardianUser,
    parsedId,
  ]);

  // Hide page if student id is invalid.
  if (!Number.isFinite(parsedId)) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
        Invalid student id.
      </div>
    );
  }

  if (isGuardianUser) {
    if (accessChecking || accessAllowed === null) {
      return (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 px-6 py-4 text-sm text-slate-200">
          Checking student access...
        </div>
      );
    }

    if (accessError) {
      return (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
          {accessError}
        </div>
      );
    }

    if (accessAllowed === false) {
      return (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
          You do not have permission to access this student.
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      {/* Page heading block. */}
      <div className="space-y-2">
        {/* Section label. */}
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Student Detail
        </p>
        {/* Page title. */}
        <h1 className="text-3xl font-semibold text-white">Profile</h1>
        {/* Subtitle text. */}
        <p className="text-sm text-slate-300">
          Student record, guardians, and attendance overview.
        </p>
      </div>

      {/* Main status and identity row. */}
      <section className="grid gap-4">
        {/* Student summary card. */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 text-sm text-slate-200 shadow-2xl shadow-black/30">
          {/* Header row for name and actions. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Student name and id. */}
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Student
              </p>
              <h2 className="text-2xl font-semibold text-white">
                {student?.firstName ?? "Loading"} {student?.lastName ?? ""}
              </h2>
              <p className="text-xs text-slate-400">ID: {student?.id ?? "-"}</p>
            </div>

            {/* Edit controls for student details. */}
            {canEditStudent && (
              <div className="flex flex-wrap items-center gap-2">
                {!editingStudent && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditingStudent(true)}
                    disabled={studentLoading || !student}
                  >
                    Edit details
                  </Button>
                )}
                {editingStudent && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleStudentSave}
                      disabled={savingStudent}
                    >
                      {savingStudent ? "Saving..." : "Save changes"}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        if (student) {
                          setFormValues({
                            upn: student.upn ?? "",
                            firstName: student.firstName ?? "",
                            lastName: student.lastName ?? "",
                            dateOfBirth: student.dateOfBirth ?? "",
                            gender: student.gender ?? "",
                            status: student.status ?? "ACTIVE",
                          });
                        }
                        setEditingStudent(false);
                      }}
                      disabled={savingStudent}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Loading banner for student details. */}
          {studentLoading && (
            <div className="mt-4 text-sm text-slate-400">
              Loading student details...
            </div>
          )}

          {/* Error banner for student errors. */}
          {studentError && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
              {studentError}
            </div>
          )}

          {/* Student detail grid. */}
          {!studentLoading && student && (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {/* Identity info block. */}
              <div className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Identity
                </p>
                <div className="grid gap-3">
                  {/* First name field. */}
                  {renderField({
                    label: "First name",
                    value: student.firstName,
                    editing: editingStudent,
                    inputValue: formValues.firstName,
                    onChange: (value) =>
                      setFormValues((prev) => ({ ...prev, firstName: value })),
                  })}
                  {/* Last name field. */}
                  {renderField({
                    label: "Last name",
                    value: student.lastName,
                    editing: editingStudent,
                    inputValue: formValues.lastName,
                    onChange: (value) =>
                      setFormValues((prev) => ({ ...prev, lastName: value })),
                  })}
                  {/* UPN field. */}
                  {renderField({
                    label: "UPN",
                    value: student.upn,
                    editing: editingStudent,
                    inputValue: formValues.upn,
                    onChange: (value) =>
                      setFormValues((prev) => ({ ...prev, upn: value })),
                  })}
                </div>
              </div>

              {/* Enrollment info block. */}
              <div className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Enrollment
                </p>
                <div className="grid gap-3">
                  {/* Date of birth field. */}
                  {renderField({
                    label: "Date of birth",
                    value: formatDate(student.dateOfBirth),
                    editing: editingStudent,
                    inputValue: formValues.dateOfBirth,
                    type: "date",
                    onChange: (value) =>
                      setFormValues((prev) => ({
                        ...prev,
                        dateOfBirth: value,
                      })),
                  })}
                  {/* Gender field. */}
                  {renderField({
                    label: "Gender",
                    value: student.gender,
                    editing: editingStudent,
                    inputValue: formValues.gender,
                    onChange: (value) =>
                      setFormValues((prev) => ({ ...prev, gender: value })),
                  })}
                  {/* Status field with select. */}
                  <div className="grid gap-1.5">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Status
                    </p>
                    {editingStudent ? (
                      <SelectDropdown
                        value={formValues.status}
                        options={[
                          { value: "ACTIVE", label: "Active" },
                          { value: "INACTIVE", label: "Inactive" },
                          { value: "WITHDRAWN", label: "Withdrawn" },
                        ]}
                        onChange={(value) =>
                          setFormValues((prev) => ({
                            ...prev,
                            status: value,
                          }))
                        }
                        className="w-full"
                      />
                    ) : (
                      <p className="text-sm text-slate-100">
                        {student.status ?? "-"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Audit metadata block. */}
          {!studentLoading && student && (
            <div className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-xs uppercase tracking-[0.2em] text-slate-400">
              Created: {formatDateTime(student.createdAt)} | Updated:{" "}
              {formatDateTime(student.updatedAt)}
            </div>
          )}
        </div>

      </section>

      {/* Guardian management section. */}
      {canViewGuardians && (
        <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 text-sm text-slate-200 shadow-2xl shadow-black/30">
          {/* Section header for guardians. */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Guardians
              </p>
              <h2 className="text-xl font-semibold text-white">
                Parents and guardians
              </h2>
              <p className="text-xs text-slate-400">
                Add, edit, and mark a primary guardian.
              </p>
            </div>
            {canEditGuardians && (
              <Button
                size="sm"
                onClick={() => {
                  setShowAddGuardian(true);
                  setLinkError(null);
                  setLinkSuccess(null);
                }}
              >
                Add guardian
              </Button>
            )}
          </div>

          {/* Guardian error banner. */}
          {guardiansError && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
              {guardiansError}
            </div>
          )}

          {/* Guardian save banner. */}
          {guardianSaveError && (
            <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
              {guardianSaveError}
            </div>
          )}
          {guardianSaveSuccess && (
            <div className="mt-4 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-200">
              {guardianSaveSuccess}
            </div>
          )}

          {/* Guardian list cards. */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {guardians.map((guardian) => {
              const edit = guardianEdits[guardian.guardianId];
              const isSaving = guardianSaveState[guardian.guardianId];
              const isPrimary = primaryGuardianId === guardian.guardianId;

              return (
                <div
                  key={guardian.guardianId}
                  className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4"
                >
                  {/* Guardian header row. */}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {guardian.guardianFirstName} {guardian.guardianLastName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {guardian.relationship || "Relationship unknown"}
                      </p>
                    </div>
                    {/* Primary selector control. */}
                    {canEditGuardians && (
                      <label
                        className={`flex items-center gap-2 text-xs ${
                          isPrimary
                            ? "text-amber-200 font-semibold"
                            : "text-slate-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name="primaryGuardian"
                          checked={isPrimary}
                          onChange={() =>
                            handlePrimaryChange(guardian.guardianId)
                          }
                          className="h-4 w-4 accent-amber-400 focus:ring-0"
                        />
                        Primary
                      </label>
                    )}
                  </div>

                  {/* Relationship edit row. */}
                  {canEditGuardians && (
                    <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
                      Relationship
                      <TextField
                        value={edit?.relationship ?? ""}
                        onChange={(event) =>
                          setGuardianEdits((prev) => ({
                            ...prev,
                            [guardian.guardianId]: {
                              relationship: event.target.value,
                              isPrimary:
                                prev[guardian.guardianId]?.isPrimary ??
                                guardian.isPrimary,
                            },
                          }))
                        }
                      />
                    </label>
                  )}

                  {/* Quick action buttons. */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        navigate(`/guardians/${guardian.guardianId}`)
                      }
                    >
                      View guardian
                    </Button>
                    {canEditGuardians && (
                      <Button
                        size="sm"
                        onClick={() => handleGuardianSave(guardian.guardianId)}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save link"}
                      </Button>
                    )}
                    {canEditGuardians && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          handleGuardianRemove(guardian.guardianId)
                        }
                        disabled={
                          guardian.isPrimary ||
                          guardianRemoveState[guardian.guardianId]
                        }
                      >
                        {guardianRemoveState[guardian.guardianId]
                          ? "Removing..."
                          : "Remove"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Guardian list empty state. */}
          {!guardiansLoading && guardians.length === 0 && (
            <div className="mt-6 text-sm text-slate-400">
              No guardians linked yet.
            </div>
          )}

          {/* Guardian list loading state. */}
          {guardiansLoading && (
            <div className="mt-6 text-sm text-slate-400">
              Loading guardians...
            </div>
          )}
        </section>
      )}

      {/* Attendance section with range control. */}
      <section className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-6 text-sm text-slate-200 shadow-2xl shadow-black/30">
        {/* Attendance heading and range selector. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Attendance
            </p>
            <h2 className="text-xl font-semibold text-white">Attendance</h2>
            <p className="text-xs text-slate-400">
              Filter attendance by time range.
            </p>
          </div>
          {/* Range selector for attendance summaries. */}
          <label className="space-y-1 text-xs text-slate-400">
            Range
            <SelectDropdown
              value={attendanceRange}
              options={[
                { value: "last-week", label: "Last week" },
                { value: "last-month", label: "Last month" },
              ]}
              onChange={(value) =>
                setAttendanceRange(value as AttendanceRange)
              }
              disabled={!canViewAttendance}
              className="w-full"
            />
          </label>
        </div>

        {/* Attendance loading banner. */}
        {attendanceLoading && (
          <div className="mt-4 text-sm text-slate-400">
            Loading attendance summary...
          </div>
        )}

        {/* Attendance error banner. */}
        {attendanceError && (
          <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
            {attendanceError}
          </div>
        )}

        {/* Attendance summary cards. */}
        {!attendanceLoading && canViewAttendance && (
          <>
            <div className="mt-6 grid gap-4 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Present
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {attendanceSummary?.present ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Late
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {attendanceSummary?.late ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Absent
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {attendanceSummary?.absent ?? 0}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Percentage
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">
                  {attendanceSummary?.percent ?? "0%"}
                </p>
              </div>
            </div>

            {/* Attendance notes for the selected range. */}
            <div className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Notes
              </p>
              <p className="mt-2 text-sm text-slate-200">
                {attendanceSummary?.note ?? "No attendance data available."}
              </p>
            </div>
          </>
        )}
      </section>

      {canEditGuardians &&
        showAddGuardian &&
        createPortal(
          <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/60 px-6 py-8 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-slate-800/80 bg-slate-950 p-6 text-slate-200 shadow-2xl shadow-black/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Add guardian
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Search and link
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddGuardian(false);
                    setSelectedGuardian(null);
                    setLinkRelationship("");
                    setLinkIsPrimary(false);
                    setLinkError(null);
                    setLinkSuccess(null);
                    setAddResetKey((prev) => prev + 1);
                  }}
                >
                  Close
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <SearchSelect
                  label="Find guardian"
                  placeholder="Search by name or email"
                  selected={selectedGuardian}
                  onSelect={setSelectedGuardian}
                  fetchOptions={fetchGuardianMatches}
                  getOptionKey={(guardian) => guardian.id}
                  getOptionLabel={(guardian) =>
                    `${guardian.firstName} ${guardian.lastName}${
                      guardian.email ? ` (${guardian.email})` : ""
                    }`
                  }
                  resetKey={addResetKey}
                  maxResults={5}
                />

                <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
                  Relationship
                  <TextField
                    value={linkRelationship}
                    onChange={(event) =>
                      setLinkRelationship(event.target.value)
                    }
                    placeholder="e.g., Mother"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-400">
                  <input
                    type="checkbox"
                    checked={linkIsPrimary}
                    onChange={(event) => setLinkIsPrimary(event.target.checked)}
                    className="h-3 w-3 accent-slate-200"
                  />
                  Primary guardian
                </label>

                {linkError && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                    {linkError}
                  </div>
                )}

                {linkSuccess && (
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-xs text-emerald-200">
                    {linkSuccess}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedGuardian(null);
                      setLinkRelationship("");
                      setLinkIsPrimary(false);
                      setLinkError(null);
                      setLinkSuccess(null);
                      setAddResetKey((prev) => prev + 1);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleGuardianLink}
                    disabled={!selectedGuardian || linking}
                  >
                    {linking ? "Linking..." : "Link guardian"}
                  </Button>
                </div>
              </div>
            </div>
          </div>,
          document.getElementById("modal-root") ?? document.body
        )}
    </div>
  );
}

// Render a read-only or editable field.
function renderField({
  label,
  value,
  editing,
  inputValue,
  onChange,
  type = "text",
}: {
  label: string;
  value?: string | null;
  editing: boolean;
  inputValue: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  if (editing) {
    if (type === "date") {
      return (
        <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
          {label}
          <DatePicker value={inputValue} onChange={onChange} />
        </label>
      );
    }

    return (
      <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
        {label}
        <TextField
          type={type}
          value={inputValue}
          onChange={(event) => onChange(event.target.value)}
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

// Format a short date string for display.
function formatDate(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString();
}

// Format a full date/time string for display.
function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}

// Build date range values for attendance queries.
function getAttendanceRangeDates(range: AttendanceRange) {
  const today = new Date();
  const to = formatDateInput(today);
  const days = range === "last-week" ? 7 : 30;
  const fromDate = new Date(today);
  fromDate.setDate(fromDate.getDate() - days);
  const from = formatDateInput(fromDate);

  return {
    from,
    to,
    label: range === "last-week" ? "Last 7 days" : "Last 30 days",
  };
}

// Format a date for query params (YYYY-MM-DD).
function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
