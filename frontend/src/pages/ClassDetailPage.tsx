import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../auth/UseAuth";
import { SearchSelect } from "../components/SearchSelect";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import { getErrorMessage } from "../utils/utilFuncs";
import { AlertBanner } from "../components/AlertBanner";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import { StateMessage } from "../components/StateMessage";
import { StatusBadge } from "../components/StatusBadge";
import type {
  AcademicYearResponse,
  ClassResponse,
  EnrolmentListItemResponse,
  StudentResponse,
} from "../utils/responses";
import {
  createEnrolment,
  deleteEnrolment,
  getClass,
  getClassEnrolments,
  getCurrentAcademicYear,
  getStudent,
  getStudentEnrolments,
  searchStudents,
  updateClass,
} from "../services/backend";

const AddStudentModal = lazy(() => import("../components/AddStudentModal"));
const RemoveStudentModal = lazy(() => import("../components/RemoveStudentModal"));

// Class detail page with roster + enrolment modal.
export default function ClassDetailPage() {
  const { classId } = useParams();
  const parsedId = Number(classId);
  const { user } = useAuth();
  const isAdmin = (user?.roleName ?? "").toUpperCase() === "ADMIN";
  const canAddStudent = isAdmin;

  const [clazz, setClazz] = useState<ClassResponse | null>(null);
  const [academicYear, setAcademicYear] = useState<AcademicYearResponse | null>(
    null
  );
  const [enrolments, setEnrolments] = useState<EnrolmentListItemResponse[]>([]);
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [showRemoveStudent, setShowRemoveStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentResponse | null>(null);
  const [selectedRemoveStudent, setSelectedRemoveStudent] =
    useState<StudentResponse | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [addResetKey, setAddResetKey] = useState(0);
  const [removeResetKey, setRemoveResetKey] = useState(0);
  const navigate = useNavigate();

  const accessDenied = useMemo(() => {
    if (!clazz || isAdmin) return false;
    if (!user?.id) return true;
    return clazz.teacherId !== user.id;
  }, [clazz, isAdmin, user?.id]);

  const filteredStudents = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return students;
    return students.filter((student) => {
      const label = `${student.firstName ?? ""} ${student.lastName ?? ""} ${
        student.upn ?? ""
      }`;
      return label.toLowerCase().includes(q);
    });
  }, [searchInput, students]);

  const fetchStudentMatches = useCallback(
    async (query: string, signal: AbortSignal) => {
      return searchStudents<StudentResponse>(query, signal);
    },
    []
  );

  const fetchRosterMatches = useCallback(
    async (query: string, signal: AbortSignal) => {
      if (signal.aborted) return [];
      const q = query.trim().toLowerCase();
      return students.filter((student) => {
        const label = `${student.firstName ?? ""} ${student.lastName ?? ""} ${
          student.upn ?? ""
        }`;
        return label.toLowerCase().includes(q);
      });
    },
    [students]
  );

  const loadClassData = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const [classPayload, yearPayload] = await Promise.all([
          getClass(parsedId, signal),
          getCurrentAcademicYear(signal),
        ]);

        setClazz(classPayload);
        setAcademicYear(yearPayload);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(getErrorMessage(err, "Failed to load class details."));
        }
      } finally {
        setLoading(false);
      }
    },
    [parsedId]
  );

  const loadStudents = useCallback(
    async (signal: AbortSignal) => {
      if (!clazz || !academicYear || accessDenied) return;

      setLoading(true);
      setError(null);

      try {
        const classEnrolments = await getClassEnrolments(
          clazz.id,
          academicYear.id,
          signal
        );
        const studentIds = Array.from(
          new Set((classEnrolments ?? []).map((e) => e.studentId))
        );

        const studentDetails = await Promise.all(
          studentIds.map((id) => getStudent(id, signal))
        );

        setEnrolments(classEnrolments ?? []);
        setStudents(studentDetails);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(getErrorMessage(err, "Failed to load class roster."));
        }
      } finally {
        setLoading(false);
      }
    },
    [academicYear, accessDenied, clazz]
  );

  useEffect(() => {
    if (!Number.isFinite(parsedId)) {
      setError("Invalid class id.");
      return;
    }

    const controller = new AbortController();
    loadClassData(controller.signal);
    return () => controller.abort();
  }, [loadClassData, parsedId]);

  useEffect(() => {
    const controller = new AbortController();
    loadStudents(controller.signal);
    return () => controller.abort();
  }, [loadStudents]);

  const handleAddStudent = async () => {
    if (!selectedStudent || !clazz || !academicYear) return;
    setAddError(null);
    setAdding(true);

    const body = {
      studentId: selectedStudent.id,
      classId: clazz.id,
      academicYearId: academicYear.id,
      startDate: academicYear.startsOn,
      endDate: null,
    };

    try {
      const enrolments = await getStudentEnrolments(
        selectedStudent.id,
        academicYear.id
      );
      const alreadyEnrolled =
        Array.isArray(enrolments) &&
        enrolments.some((enrolment) => enrolment.classId === clazz.id);

      if (alreadyEnrolled) {
        setAddError("Student already in class");
        return;
      }

      await createEnrolment(body);
      setSelectedStudent(null);
      setShowAddStudent(false);
      const controller = new AbortController();
      await loadStudents(controller.signal);
    } catch (err: unknown) {
      setAddError(getErrorMessage(err, "Failed to add student."));
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!selectedRemoveStudent || !clazz || !academicYear) return;
    setRemoveError(null);
    setRemoving(true);

    const enrolment = enrolments.find(
      (item) => item.studentId === selectedRemoveStudent.id
    );
    if (!enrolment) {
      setRemoveError("No enrolment found for this student.");
      setRemoving(false);
      return;
    }

    try {
      await deleteEnrolment(enrolment.id);
      setSelectedRemoveStudent(null);
      setShowRemoveStudent(false);
      setStudents((prev) =>
        prev.filter((student) => student.id !== enrolment.studentId)
      );
      setEnrolments((prev) => prev.filter((item) => item.id !== enrolment.id));
    } catch (err: unknown) {
      setRemoveError(getErrorMessage(err, "Failed to remove student."));
    } finally {
      setRemoving(false);
    }
  };

  const handleToggleActive = async () => {
    if (!clazz || !isAdmin) return;
    setStatusUpdating(true);
    setError(null);

    try {
      const updated = await updateClass(clazz.id, { active: !clazz.active });
      setClazz(updated);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to update class status."));
    } finally {
      setStatusUpdating(false);
    }
  };

  if (error) {
    return <AlertBanner variant="error">{error}</AlertBanner>;
  }

  if (accessDenied) {
    return (
      <AlertBanner variant="error">
        You do not have permission to access this class.
      </AlertBanner>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Class"
        title={clazz?.name ?? "Loading class..."}
        subtitle={`${clazz?.code ? `${clazz.code} · ` : ""}${
          clazz?.teacherName
            ? `Teacher: ${clazz.teacherName}`
            : "Teacher unassigned"
        }`}
      />

      <div className="grid gap-4 md:grid-cols-3">
        <SectionCard padding="sm" className="text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Status
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <p className="text-lg text-white">
              {clazz?.active ? "Active" : "Inactive"}
            </p>
            {isAdmin && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleToggleActive}
                disabled={statusUpdating || !clazz}
              >
                {statusUpdating
                  ? "Updating..."
                  : clazz?.active
                    ? "Set inactive"
                    : "Set active"}
              </Button>
            )}
          </div>
        </SectionCard>
        <SectionCard padding="sm" className="text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Academic year
          </p>
          <p className="mt-2 text-lg text-white">
            {academicYear?.name ?? "Loading..."}
          </p>
        </SectionCard>
        <SectionCard padding="sm" className="text-sm text-slate-300">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Students
          </p>
          <p className="mt-2 text-lg text-white">
            {loading ? "Loading..." : students.length}
          </p>
        </SectionCard>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-[20rem]">
          <SearchSelect
            label="Search roster"
            placeholder="Search by name or UPN"
            selected={null}
            onSelect={() => {}}
            onQueryChange={setSearchInput}
            fetchOptions={async () => []}
            getOptionKey={() => "na"}
            getOptionLabel={() => ""}
            minChars={2}
            idleLabel="Type at least 2 characters."
            loadingLabel="Searching..."
            resultsLabel="Matches"
            emptyLabel="No matches."
            showSelectedSummary={false}
            showResults={false}
          />
        </div>
        {canAddStudent && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => setShowAddStudent(true)}
            >
              Add student
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={() => {
                setShowRemoveStudent(true);
                setRemoveError(null);
              }}
              disabled={loading || students.length === 0}
            >
              Remove student
            </Button>
          </div>
        )}
      </div>

      <SectionCard padding="none">
        <div className="border-b border-slate-800/80 px-6 py-4 text-sm text-slate-300">
          Class roster
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">UPN</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr
                  key={student.id}
                  className="relative border-t border-slate-800/60 hover:bg-slate-900/50"
                >
                  <td className="px-4 py-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute inset-0 h-full w-full rounded-none px-0 py-0"
                      onClick={() => navigate(`/student/${student.id}`)}
                      aria-label={`Select ${student.firstName} ${student.lastName}`}
                    >
                      <span className="sr-only">
                        Select {student.firstName} {student.lastName}
                      </span>
                    </Button>

                    <div className="relative z-10 pointer-events-none">
                      <div className="font-medium text-white">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-slate-400">
                        ID: {student.id}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 relative z-10 pointer-events-none">
                    {student.upn ?? "-"}
                  </td>
                  <td className="px-6 py-4 relative z-10 pointer-events-none">
                    <StatusBadge value={student.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredStudents.length === 0 && (
            <StateMessage>
              {students.length === 0
                ? "No students are enrolled in this class."
                : "No students match your search."}
            </StateMessage>
          )}
        </div>
      </SectionCard>

      {canAddStudent && (
        <Suspense fallback={null}>
          <AddStudentModal
            open={showAddStudent}
            selectedStudent={selectedStudent}
            onSelectStudent={setSelectedStudent}
            fetchStudentMatches={fetchStudentMatches}
            addError={addError}
            onClear={() => {
              setSelectedStudent(null);
              setAddError(null);
              setAddResetKey((prev) => prev + 1);
            }}
            onClose={() => {
              setShowAddStudent(false);
              setSelectedStudent(null);
              setAddError(null);
            }}
            onSubmit={handleAddStudent}
            adding={adding}
            resetKey={addResetKey}
          />
          <RemoveStudentModal
            open={showRemoveStudent}
            selectedStudent={selectedRemoveStudent}
            onSelectStudent={setSelectedRemoveStudent}
            fetchStudentMatches={fetchRosterMatches}
            removeError={removeError}
            onClear={() => {
              setSelectedRemoveStudent(null);
              setRemoveError(null);
              setRemoveResetKey((prev) => prev + 1);
            }}
            onClose={() => {
              setShowRemoveStudent(false);
              setSelectedRemoveStudent(null);
              setRemoveError(null);
              setRemoveResetKey((prev) => prev + 1);
            }}
            onSubmit={handleRemoveStudent}
            removing={removing}
            resetKey={removeResetKey}
          />
        </Suspense>
      )}
    </div>
  );
}
