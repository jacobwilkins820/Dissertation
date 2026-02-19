import { useEffect, useState } from "react";
import {
  getAttendanceRecordsForSession,
  getAttendanceSessionsForClass,
  getCurrentAcademicYear,
  getStudentEnrolments,
} from "../services/backend";
import {
  getAnalyticsDateWindow,
  type AnalyticsRange,
} from "../utils/analyticsDateRange";
import { getErrorMessage } from "../utils/utilFuncs";

export type AttendanceSummary = {
  label: string;
  present: number;
  late: number;
  absent: number;
  total: number;
  percent: string;
  note: string;
};

export type AttendanceRange = AnalyticsRange;

export function useAttendanceSummary(
  studentId: number,
  canViewAttendance: boolean,
  accessAllowed: boolean | null,
  isGuardianUser: boolean
) {
  const [attendanceRange, setAttendanceRange] = useState<AttendanceRange>(
    "week"
  );
  const [attendanceSummary, setAttendanceSummary] =
    useState<AttendanceSummary | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(studentId) || !canViewAttendance) {
      setAttendanceSummary(null);
      return;
    }

    if (isGuardianUser && accessAllowed !== true) {
      setAttendanceSummary(null);
      return;
    }

    const controller = new AbortController();

    (async () => {
      setAttendanceLoading(true);
      setAttendanceError(null);

      try {
        const year = await getCurrentAcademicYear(controller.signal);
        const { from, to, label } = getAnalyticsDateWindow(attendanceRange, {
          academicYear: year,
        });

        const enrolments = await getStudentEnrolments(
          studentId,
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
            note: "No classes enrolled for this period.",
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
          (record) => record.studentId === studentId
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
              ? "No attendance records in this period."
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
    studentId,
  ]);

  return {
    attendanceRange,
    setAttendanceRange,
    attendanceSummary,
    attendanceLoading,
    attendanceError,
  };
}
