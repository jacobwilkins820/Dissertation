import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/env";
import { useAuth } from "../auth/UseAuth";
import { SearchSelect } from "../components/SearchSelect";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import {
  extractErrorMessage,
  getAuthHeader,
  getErrorMessage,
  safeReadJson,
} from "../utils/utilFuncs";

type ClassResponse = {
  id: number;
  teacherId?: number | null;
  teacherName?: string | null;
  name: string;
  code?: string | null;
  active: boolean;
};

type AcademicYearResponse = {
  id: number;
  name: string;
  startsOn: string;
  endsOn: string;
};

type EnrolmentListItemResponse = {
  id: number;
  studentId: number;
  classId: number;
  startDate: string;
  endDate?: string | null;
};

type StudentResponse = {
  id: number;
  upn?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  status?: string | null;
};

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
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentResponse | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addResetKey, setAddResetKey] = useState(0);
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
      const params = new URLSearchParams();
      params.set("q", query);
      params.set("page", "0");
      params.set("size", "10");

      const res = await fetch(
        `${API_BASE_URL}/api/students?${params.toString()}`,
        {
          headers: {
            ...getAuthHeader(),
          },
          signal,
        }
      );

      if (!res.ok) {
        const payload = await safeReadJson(res);
        throw new Error(extractErrorMessage(payload));
      }

      const payload = (await safeReadJson(res)) as {
        content?: StudentResponse[];
      } | null;
      if (!payload || !Array.isArray(payload.content)) {
        return [];
      }
      return payload.content;
    },
    []
  );

  const loadClassData = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      setError(null);

      try {
        const [classRes, yearRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/classes/${parsedId}`, {
            headers: { ...getAuthHeader() },
            signal,
          }),
          fetch(`${API_BASE_URL}/api/academic-years/current`, {
            headers: { ...getAuthHeader() },
            signal,
          }),
        ]);

        if (!classRes.ok) {
          const payload = await safeReadJson(classRes);
          throw new Error(extractErrorMessage(payload));
        }

        if (!yearRes.ok) {
          const payload = await safeReadJson(yearRes);
          throw new Error(extractErrorMessage(payload));
        }

        const classPayload = (await safeReadJson(classRes)) as ClassResponse;
        const yearPayload = (await safeReadJson(
          yearRes
        )) as AcademicYearResponse;

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
        const res = await fetch(
          `${API_BASE_URL}/api/enrolments/classes/${clazz.id}/enrolments?academicYearId=${academicYear.id}`,
          {
            headers: { ...getAuthHeader() },
            signal,
          }
        );

        if (!res.ok) {
          const payload = await safeReadJson(res);
          throw new Error(extractErrorMessage(payload));
        }

        const enrolments = (await safeReadJson(
          res
        )) as EnrolmentListItemResponse[];
        const studentIds = Array.from(
          new Set((enrolments ?? []).map((e) => e.studentId))
        );

        const studentDetails = await Promise.all(
          studentIds.map(async (id) => {
            const studentRes = await fetch(
              `${API_BASE_URL}/api/students/${id}`,
              {
                headers: { ...getAuthHeader() },
                signal,
              }
            );

            if (!studentRes.ok) {
              const payload = await safeReadJson(studentRes);
              throw new Error(extractErrorMessage(payload));
            }

            return (await safeReadJson(studentRes)) as StudentResponse;
          })
        );

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
      const enrolmentRes = await fetch(
        `${API_BASE_URL}/api/enrolments/students/${selectedStudent.id}/enrolments?academicYearId=${academicYear.id}`,
        {
          method: "GET",
          headers: {
            ...getAuthHeader(),
          },
        }
      );

      if (!enrolmentRes.ok) {
        const payload = await safeReadJson(enrolmentRes);
        throw new Error(extractErrorMessage(payload));
      }

      const enrolments = (await safeReadJson(enrolmentRes)) as
        | EnrolmentListItemResponse[]
        | null;
      const alreadyEnrolled =
        Array.isArray(enrolments) &&
        enrolments.some((enrolment) => enrolment.classId === clazz.id);

      if (alreadyEnrolled) {
        setAddError("Student already in class");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/enrolments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const payload = await safeReadJson(res);
        throw new Error(extractErrorMessage(payload));
      }

      await safeReadJson(res);
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

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
        You do not have permission to access this class.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Class
        </p>
        <h1 className="text-3xl font-semibold text-white">
          {clazz?.name ?? "Loading class..."}
        </h1>
        <p className="text-sm text-slate-300">
          {clazz?.code ? `${clazz.code} · ` : ""}
          {clazz?.teacherName
            ? `Teacher: ${clazz.teacherName}`
            : "Teacher unassigned"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4 text-sm text-slate-300 shadow-2xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Status
          </p>
          <p className="mt-2 text-lg text-white">
            {clazz?.active ? "Active" : "Inactive"}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4 text-sm text-slate-300 shadow-2xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Academic year
          </p>
          <p className="mt-2 text-lg text-white">
            {academicYear?.name ?? "Loading..."}
          </p>
        </div>
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4 text-sm text-slate-300 shadow-2xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Students
          </p>
          <p className="mt-2 text-lg text-white">
            {loading ? "Loading..." : students.length}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <SearchSelect
            label="Search roster"
            placeholder="Search by name, UPN, status"
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
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowAddStudent(true)}
          >
            Add student
          </Button>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-2xl shadow-black/30">
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
                    <span className="rounded-full border border-slate-600/40 bg-slate-800/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                      {student.status ?? "UNKNOWN"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && filteredStudents.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-slate-400">
              {students.length === 0
                ? "No students are enrolled in this class."
                : "No students match your search."}
            </div>
          )}
        </div>
      </div>

      {canAddStudent &&
        showAddStudent &&
        createPortal(
          <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/60 px-6 py-8 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-3xl border border-slate-800/80 bg-slate-950 p-6 text-slate-200 shadow-2xl shadow-black/40">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                    Add student
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold text-white">
                    Search and enrol
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddStudent(false);
                    setSelectedStudent(null);
                    setAddError(null);
                  }}
                >
                  Close
                </Button>
              </div>

              <div className="mt-6 space-y-4">
                <SearchSelect
                  label="Find student"
                  placeholder="Search by name or UPN"
                  selected={selectedStudent}
                  onSelect={setSelectedStudent}
                  fetchOptions={fetchStudentMatches}
                  getOptionKey={(student) => student.id}
                  getOptionLabel={(student) =>
                    `${student.firstName ?? ""} ${student.lastName ?? ""}${
                      student.upn ? ` · ${student.upn}` : ""
                    }`
                  }
                  minChars={2}
                  idleLabel="Type at least 2 characters."
                  loadingLabel="Searching..."
                  resultsLabel="Matches"
                  emptyLabel="No matches."
                  resetKey={addResetKey}
                  maxResults={5}
                />

                {addError && (
                  <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-200">
                    {addError}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-end gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedStudent(null);
                      setAddError(null);
                      setAddResetKey((prev) => prev + 1);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={handleAddStudent}
                    disabled={!selectedStudent || adding}
                  >
                    {adding ? "Adding..." : "Add to class"}
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
