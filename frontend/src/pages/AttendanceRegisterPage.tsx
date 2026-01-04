import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { API_BASE_URL } from "../config/env";
import { Button } from "../components/Button";
import { TextField } from "../components/TextField";
import {
  extractErrorMessage,
  getAuthHeader,
  getErrorMessage,
  safeReadJson,
} from "../utils/utilFuncs";
import type {
  AcademicYearResponse,
  AttendanceRecordListItemResponse,
  AttendanceRecordResponse,
  AttendanceSessionResponse,
  ClassResponse,
  EnrolmentListItemResponse,
  SessionPart,
  StudentResponse,
} from "../types/responses";

type AttendanceRecordState = {
  id?: number;
  status?: "PRESENT" | "ABSENT" | "LATE";
  reason?: string;
};

function getLocalDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AttendanceRegisterPage() {
  const { classId } = useParams();
  const parsedId = Number(classId);
  const [clazz, setClazz] = useState<ClassResponse | null>(null);
  const [academicYear, setAcademicYear] = useState<AcademicYearResponse | null>(
    null
  );
  const [students, setStudents] = useState<StudentResponse[]>([]);
  const [sessionPart, setSessionPart] = useState<SessionPart>("AM");
  const [sessionDate, setSessionDate] = useState(getLocalDateString());
  const [session, setSession] = useState<AttendanceSessionResponse | null>(
    null
  );
  const [records, setRecords] = useState<Record<number, AttendanceRecordState>>(
    {}
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

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
      if (!clazz || !academicYear) return;

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
    [academicYear, clazz]
  );

  const loadRecords = useCallback(
    async (sessionId: number, signal: AbortSignal) => {
      const res = await fetch(
        `${API_BASE_URL}/api/attendance-sessions/${sessionId}/attendance-records`,
        {
          headers: { ...getAuthHeader() },
          signal,
        }
      );

      if (!res.ok) {
        const payload = await safeReadJson(res);
        throw new Error(extractErrorMessage(payload));
      }

      const payload = (await safeReadJson(
        res
      )) as AttendanceRecordListItemResponse[];
      const nextRecords: Record<number, AttendanceRecordState> = {};
      const lateRecords = (payload ?? []).filter((r) => r.status === "LATE");

      (payload ?? []).forEach((record) => {
        nextRecords[record.studentId] = {
          id: record.id,
          status: record.status,
          reason: "",
        };
      });

      if (lateRecords.length > 0) {
        const lateDetails = await Promise.all(
          lateRecords.map(async (record) => {
            const detailRes = await fetch(
              `${API_BASE_URL}/api/attendance-records/${record.id}`,
              { headers: { ...getAuthHeader() }, signal }
            );

            if (!detailRes.ok) {
              const payload = await safeReadJson(detailRes);
              throw new Error(extractErrorMessage(payload));
            }

            return (await safeReadJson(detailRes)) as AttendanceRecordResponse;
          })
        );

        lateDetails.forEach((detail) => {
          nextRecords[detail.studentId] = {
            id: detail.id,
            status: detail.status,
            reason: detail.reason ?? "",
          };
        });
      }

      setRecords(nextRecords);
    },
    []
  );

  const loadSession = useCallback(
    async (signal: AbortSignal) => {
      if (!Number.isFinite(parsedId)) return;

      setLoading(true);
      setError(null);
      setSaveMessage(null);

      try {
        const params = new URLSearchParams({
          classId: String(parsedId),
          from: sessionDate,
          to: sessionDate,
        });
        const res = await fetch(
          `${API_BASE_URL}/api/attendance-sessions?${params.toString()}`,
          { headers: { ...getAuthHeader() }, signal }
        );

        if (!res.ok) {
          const payload = await safeReadJson(res);
          throw new Error(extractErrorMessage(payload));
        }

        const payload = (await safeReadJson(
          res
        )) as AttendanceSessionResponse[];
        const match = (payload ?? []).find(
          (item) => item.session === sessionPart
        );

        setSession(match ?? null);
        if (match) {
          await loadRecords(match.id, signal);
        } else {
          setRecords({});
        }
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(getErrorMessage(err, "Failed to load attendance session."));
        }
      } finally {
        setLoading(false);
      }
    },
    [loadRecords, parsedId, sessionDate, sessionPart]
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

  useEffect(() => {
    const controller = new AbortController();
    loadSession(controller.signal);
    return () => controller.abort();
  }, [loadSession]);

  const ensureSession = useCallback(async () => {
    if (session) return session;

    const res = await fetch(`${API_BASE_URL}/api/attendance-sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeader(),
      },
      body: JSON.stringify({
        classId: parsedId,
        sessionDate,
        session: sessionPart,
      }),
    });

    if (!res.ok) {
      const payload = await safeReadJson(res);
      throw new Error(extractErrorMessage(payload));
    }

    const created = (await safeReadJson(res)) as AttendanceSessionResponse;
    setSession(created);
    return created;
  }, [parsedId, session, sessionDate, sessionPart]);

  const handleStatusClick = async (
    studentId: number,
    status: "PRESENT" | "ABSENT" | "LATE"
  ) => {
    setSaveMessage(null);
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
        reason: status === "LATE" ? (prev[studentId]?.reason ?? "") : "",
      },
    }));
  };

  const handleReasonChange = (studentId: number, value: string) => {
    setSaveMessage(null);
    setRecords((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason: value,
      },
    }));
  };

  const handleSaveAttendance = async () => {
    setError(null);
    setSaveMessage(null);
    setSaving(true);
    try {
      const activeSession = await ensureSession();
      const entries = Object.entries(records)
        .map(([id, record]) => ({ studentId: Number(id), record }))
        .filter((item) => item.record.status);

      const updates = await Promise.all(
        entries.map(async ({ studentId, record }) => {
          const status = record.status!;
          const payload = {
            status,
            reason:
              status === "LATE"
                ? record.reason?.trim()
                  ? record.reason.trim()
                  : null
                : null,
          };

          if (record.id) {
            const res = await fetch(
              `${API_BASE_URL}/api/attendance-records/${record.id}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                  ...getAuthHeader(),
                },
                body: JSON.stringify(payload),
              }
            );

            if (!res.ok) {
              const responsePayload = await safeReadJson(res);
              throw new Error(extractErrorMessage(responsePayload));
            }

            const updated = (await safeReadJson(
              res
            )) as AttendanceRecordResponse;
            return {
              studentId,
              record: {
                id: updated.id,
                status: updated.status,
                reason: updated.reason ?? "",
              } as AttendanceRecordState,
            };
          }

          const res = await fetch(`${API_BASE_URL}/api/attendance-records`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...getAuthHeader(),
            },
            body: JSON.stringify({
              attendanceSessionId: activeSession.id,
              studentId,
              ...payload,
            }),
          });

          if (!res.ok) {
            const responsePayload = await safeReadJson(res);
            throw new Error(extractErrorMessage(responsePayload));
          }

          const created = (await safeReadJson(res)) as AttendanceRecordResponse;
          return {
            studentId,
            record: {
              id: created.id,
              status: created.status,
              reason: created.reason ?? "",
            } as AttendanceRecordState,
          };
        })
      );

      if (updates.length > 0) {
        setRecords((prev) => {
          const next = { ...prev };
          updates.forEach((update) => {
            next[update.studentId] = update.record;
          });
          return next;
        });
      }

      setSaveMessage("Attendance saved.");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Failed to save attendance records."));
    } finally {
      setSaving(false);
    }
  };

  const roster = useMemo(() => students, [students]);

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-6 py-4 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Attendance register
        </p>
        <h1 className="text-3xl font-semibold text-white">
          {clazz?.name ?? "Loading class..."}
        </h1>
        <p className="text-sm text-slate-300">
          {clazz?.code ? `${clazz.code} - ` : ""}
          {clazz?.teacherName
            ? `Teacher: ${clazz.teacherName}`
            : "Teacher unassigned"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 p-4 text-sm text-slate-300 shadow-2xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Session date
          </p>
          <div className="mt-2 max-w-xs">
            <TextField
              type="date"
              size="md"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              disabled={loading || saving}
            />
          </div>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
            {academicYear?.name ?? "Loading academic year"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSaveMessage(null);
              setRecords((prev) => {
                const next: Record<number, AttendanceRecordState> = { ...prev };
                roster.forEach((student) => {
                  next[student.id] = {
                    ...next[student.id],
                    status: "PRESENT",
                    reason: "",
                  };
                });
                return next;
              });
            }}
            disabled={saving || loading || roster.length === 0}
          >
            Mark all present
          </Button>
          <Button
            variant={sessionPart === "AM" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSessionPart("AM")}
          >
            AM
          </Button>
          <Button
            variant={sessionPart === "PM" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setSessionPart("PM")}
          >
            PM
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 shadow-2xl shadow-black/30">
        <div className="border-b border-slate-800/80 px-6 py-4 text-sm text-slate-300">
          {loading
            ? "Loading students..."
            : `Students in class (${roster.length})`}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-200">
            <thead className="bg-slate-950/60 text-xs uppercase tracking-[0.3em] text-slate-400">
              <tr>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">UPN</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Mark</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((student) => {
                const record = records[student.id];
                const status = record?.status;

                return (
                  <tr key={student.id} className="border-t border-slate-800/60">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {student.firstName} {student.lastName}
                      </div>
                      <div className="text-xs text-slate-400">
                        ID: {student.id}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {student.upn ?? "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full border border-slate-600/40 bg-slate-800/60 px-3 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                        {status ?? "UNMARKED"}
                      </span>
                      {status === "LATE" && (
                        <div className="mt-3">
                          <TextField
                            size="sm"
                            placeholder="Reason for late arrival"
                            value={record?.reason ?? ""}
                            onChange={(e) =>
                              handleReasonChange(student.id, e.target.value)
                            }
                            disabled={saving}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={
                            status === "PRESENT" ? "primary" : "secondary"
                          }
                          size="sm"
                          onClick={() =>
                            handleStatusClick(student.id, "PRESENT")
                          }
                          disabled={saving}
                        >
                          Present
                        </Button>
                        <Button
                          variant={status === "ABSENT" ? "danger" : "secondary"}
                          size="sm"
                          onClick={() =>
                            handleStatusClick(student.id, "ABSENT")
                          }
                          disabled={saving}
                        >
                          Absent
                        </Button>
                        <Button
                          variant={status === "LATE" ? "primary" : "secondary"}
                          size="sm"
                          onClick={() => handleStatusClick(student.id, "LATE")}
                          disabled={saving}
                        >
                          Late
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && roster.length === 0 && (
            <div className="px-6 py-8 text-center text-sm text-slate-400">
              No students are enrolled in this class.
            </div>
          )}
        </div>
      </div>

      {saveMessage && (
        <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-6 py-4 text-sm text-emerald-200">
          {saveMessage}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={handleSaveAttendance} disabled={saving || loading}>
          {saving ? "Saving..." : "Save attendance"}
        </Button>
      </div>
    </div>
  );
}
