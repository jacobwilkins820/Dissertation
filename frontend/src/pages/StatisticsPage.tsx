import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PieChart } from "../components/charts/PieChart";
import { LineChart } from "../components/charts/LineChart";
import { SelectDropdown } from "../components/SelectDropdown";
import { getErrorMessage } from "../utils/utilFuncs";
import { formatDateInput } from "../utils/date";
import { AlertBanner } from "../components/AlertBanner";
import { PageHeader } from "../components/PageHeader";
import { SectionCard } from "../components/SectionCard";
import type { ClassResponse } from "../utils/responses";
import {
  getAttendanceRecordsForSession,
  getAttendanceSessionsForClass,
  getClass,
} from "../services/backend";

export default function StatisticsPage() {
  const { classId } = useParams();
  const parsedId = Number(classId);
  const [clazz, setClazz] = useState<ClassResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attendanceCounts, setAttendanceCounts] = useState({
    present: 0,
    late: 0,
    absent: 0,
  });
  const [weeks, setWeeks] = useState(12);
  const [weeklyLabels, setWeeklyLabels] = useState<string[]>([]);
  const [weeklyCounts, setWeeklyCounts] = useState({
    present: [] as number[],
    late: [] as number[],
    absent: [] as number[],
  });
  const chartData = useMemo(
    () => ({
      labels: ["Present", "Late", "Absent"],
      datasets: [
        {
          data: [
            attendanceCounts.present,
            attendanceCounts.late,
            attendanceCounts.absent,
          ],
          backgroundColor: ["#fbbf24", "#38bdf8", "#fb7185"],
          borderColor: ["#f59e0b", "#0ea5e9", "#f43f5e"],
          borderWidth: 1,
        },
      ],
    }),
    [attendanceCounts]
  );
  const lineChartData = useMemo(
    () => ({
      labels: weeklyLabels,
      datasets: [
        {
          label: "Present",
          data: weeklyCounts.present,
          borderColor: "#f59e0b",
          backgroundColor: "rgba(245, 158, 11, 0.25)",
          tension: 0.35,
        },
        {
          label: "Late",
          data: weeklyCounts.late,
          borderColor: "#0ea5e9",
          backgroundColor: "rgba(14, 165, 233, 0.25)",
          tension: 0.35,
        },
        {
          label: "Absent",
          data: weeklyCounts.absent,
          borderColor: "#f43f5e",
          backgroundColor: "rgba(244, 63, 94, 0.25)",
          tension: 0.35,
        },
      ],
    }),
    [weeklyCounts, weeklyLabels]
  );

  useEffect(() => {
    if (!Number.isFinite(parsedId)) {
      setError("Invalid class id.");
      return;
    }

    const controller = new AbortController();

    async function loadClass() {
      setLoading(true);
      setError(null);

      try {
        const payload = await getClass(parsedId, controller.signal);
        setClazz(payload);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(getErrorMessage(err, "Failed to load class details."));
        }
      } finally {
        setLoading(false);
      }
    }

    loadClass();
    return () => controller.abort();
  }, [parsedId]);

  useEffect(() => {
    if (!Number.isFinite(parsedId)) {
      return;
    }

    const controller = new AbortController();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7 - 1));
    const labels = buildWeekLabels(startDate, weeks);

    const to = formatDateInput(today);
    const from = formatDateInput(startDate);

    (async () => {
      try {
        const sessions = await getAttendanceSessionsForClass(
          parsedId,
          from,
          to,
          controller.signal
        );

        const recordLists = await Promise.all(
          sessions.map((session) =>
            getAttendanceRecordsForSession(session.id, controller.signal)
          )
        );

        const totals = { present: 0, late: 0, absent: 0 };
        const weekly = {
          present: Array(weeks).fill(0),
          late: Array(weeks).fill(0),
          absent: Array(weeks).fill(0),
        };

        recordLists.forEach((records, index) => {
          const session = sessions[index];
          if (!session) return;
          const sessionDate = parseLocalDate(session.sessionDate);
          if (!sessionDate) return;
          const diffDays = Math.floor(
            (sessionDate.getTime() - startDate.getTime()) / 86400000
          );
          if (diffDays < 0 || diffDays >= weeks * 7) return;
          const bucket = Math.floor(diffDays / 7);

          records.forEach((record) => {
            if (record.status === "PRESENT") {
              totals.present += 1;
              weekly.present[bucket] += 1;
              return;
            }
            if (record.status === "LATE") {
              totals.late += 1;
              weekly.late[bucket] += 1;
              return;
            }
            totals.absent += 1;
            weekly.absent[bucket] += 1;
          });
        });

        setWeeklyLabels(labels);
        setWeeklyCounts(weekly);
        setAttendanceCounts(totals);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          console.error("Failed to load attendance records:", err);
        }
      }
    })();

    return () => controller.abort();
  }, [parsedId, weeks]);

  if (error) {
    return <AlertBanner variant="error">{error}</AlertBanner>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Statistics"
        title={clazz?.name ?? (loading ? "Loading class..." : "Class statistics")}
        subtitle={`${clazz?.code ? `${clazz.code} - ` : ""}${
          clazz?.teacherName
            ? `Teacher: ${clazz.teacherName}`
            : "Teacher unassigned"
        }`}
      >
        <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
          <span className="sr-only">Select weeks range</span>
          <SelectDropdown
            size="sm"
            value={weeks}
            onChange={(value) => setWeeks(Number(value))}
            options={[
              { value: 2, label: "2 weeks" },
              { value: 4, label: "4 weeks" },
              { value: 8, label: "8 weeks" },
              { value: 12, label: "12 weeks" },
            ]}
            className="w-40"
          />
        </label>
      </PageHeader>

      <SectionCard padding="none">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 text-sm text-slate-300">
          <span>Attendance overview</span>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Last {weeks} weeks for {clazz?.name ?? "this class"}
          </span>
        </div>
        <div className="px-6 py-6">
          <PieChart data={chartData} className="h-[320px]" />
        </div>
      </SectionCard>

      <SectionCard padding="none">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 text-sm text-slate-300">
          <span>Weekly attendance trends</span>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Week by week
          </span>
        </div>

        <div className="px-6 py-6">
          <LineChart data={lineChartData} className="h-[320px]" />
        </div>
      </SectionCard>
    </div>
  );
}


function parseLocalDate(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

function buildWeekLabels(startDate: Date, weeks: number) {
  const labels: string[] = [];
  for (let index = 0; index < weeks; index += 1) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + index * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    labels.push(`${formatMonthDay(weekStart)}-${formatMonthDay(weekEnd)}`);
  }
  return labels;
}

function formatMonthDay(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}`;
}
