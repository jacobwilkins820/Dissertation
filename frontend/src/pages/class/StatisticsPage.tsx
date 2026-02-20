import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { PieChart } from "../../components/statistics/PieChart";
import { LineChart } from "../../components/statistics/LineChart";
import { SelectDropdown } from "../../components/ui/SelectDropdown";
import { getErrorMessage } from "../../utils/utilFuncs";
import { AlertBanner } from "../../components/ui/AlertBanner";
import { PageHeader } from "../../components/ui/PageHeader";
import { SectionCard } from "../../components/ui/SectionCard";
import type { ClassResponse } from "../../utils/responses";
import {
  getAttendanceRecordsForSession,
  getAttendanceSessionsForClass,
  getClass,
  getCurrentAcademicYear,
} from "../../services/backend";
import {
  ANALYTICS_RANGE_OPTIONS,
  getAnalyticsDateWindow,
  getInclusiveDayCount,
  type AnalyticsRange,
} from "../../utils/analyticsDateRange";

// Class statistics dashboard:
// - pie chart for total status distribution
// - line chart for daily/weekly trend
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
  const [selectedRange, setSelectedRange] = useState<AnalyticsRange>("week");
  const [rangeLabel, setRangeLabel] = useState("Week to date");
  const [weeklyLabels, setWeeklyLabels] = useState<string[]>([]);
  const [weeklyCounts, setWeeklyCounts] = useState({
    present: [] as number[],
    late: [] as number[],
    absent: [] as number[],
  });
  const chartData = useMemo(
    // Pie chart reflects overall totals for the current range.
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
    [attendanceCounts],
  );
  const lineChartData = useMemo(
    // Line chart shows trend over computed day/week buckets.
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
    [weeklyCounts, weeklyLabels],
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

    (async () => {
      try {
        // Derive date window and labels from analytics helper.
        const year = await getCurrentAcademicYear(controller.signal);
        const window = getAnalyticsDateWindow(selectedRange, {
          academicYear: year,
        });
        const startDate = parseLocalDate(window.from);
        const endDate = parseLocalDate(window.to);
        if (!startDate || !endDate) {
          throw new Error("Invalid analytics date range.");
        }

        const totalDays = getInclusiveDayCount(startDate, endDate);
        const bucketSizeDays = selectedRange === "week" ? 1 : 7;
        const bucketCount = Math.max(1, Math.ceil(totalDays / bucketSizeDays));
        const labels =
          selectedRange === "week"
            ? buildDayLabels(startDate, bucketCount)
            : buildWeekLabels(startDate, endDate, bucketCount);

        const sessions = await getAttendanceSessionsForClass(
          parsedId,
          window.from,
          window.to,
          controller.signal,
        );

        const recordLists = await Promise.all(
          sessions.map((session) =>
            getAttendanceRecordsForSession(session.id, controller.signal),
          ),
        );

        const totals = { present: 0, late: 0, absent: 0 };
        const weekly = {
          present: Array(bucketCount).fill(0),
          late: Array(bucketCount).fill(0),
          absent: Array(bucketCount).fill(0),
        };

        recordLists.forEach((records, index) => {
          const session = sessions[index];
          if (!session) return;
          const sessionDate = parseLocalDate(session.sessionDate);
          if (!sessionDate) return;
          const diffDays = Math.floor(
            (sessionDate.getTime() - startDate.getTime()) / 86400000,
          );
          if (diffDays < 0 || diffDays >= totalDays) return;
          const bucket = Math.floor(diffDays / bucketSizeDays);
          if (bucket < 0 || bucket >= bucketCount) return;

          // Reduce each record into both overall totals and bucket totals.
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

        setRangeLabel(window.label);
        setWeeklyLabels(labels);
        setWeeklyCounts(weekly);
        setAttendanceCounts(totals);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          // Keep page usable even if analytics fetch fails
          console.error("Failed to load attendance records:", err);
        }
      }
    })();

    return () => controller.abort();
  }, [parsedId, selectedRange]);

  if (error) {
    return <AlertBanner variant="error">{error}</AlertBanner>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        label="Statistics"
        title={
          clazz?.name ?? (loading ? "Loading class..." : "Class statistics")
        }
        subtitle={`${clazz?.code ? `${clazz.code} - ` : ""}${
          clazz?.teacherName
            ? `Teacher: ${clazz.teacherName}`
            : "Teacher unassigned"
        }`}
      >
        <label className="text-xs uppercase tracking-[0.2em] text-slate-400">
          <span className="sr-only">Select analytics range</span>
          <SelectDropdown
            size="sm"
            value={selectedRange}
            onChange={(value) => setSelectedRange(value as AnalyticsRange)}
            options={ANALYTICS_RANGE_OPTIONS}
            className="w-48"
          />
        </label>
      </PageHeader>

      <SectionCard padding="none">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 text-sm text-slate-300">
          <span>Attendance overview</span>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {rangeLabel} for {clazz?.name ?? "this class"}
          </span>
        </div>
        <div className="px-6 py-6">
          <PieChart data={chartData} className="h-[320px]" />
        </div>
      </SectionCard>

      <SectionCard padding="none">
        <div className="flex items-center justify-between border-b border-slate-800/80 px-6 py-4 text-sm text-slate-300">
          <span>
            {selectedRange === "week"
              ? "Daily attendance trends"
              : "Weekly attendance trends"}
          </span>
          <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
            {selectedRange === "week"
              ? "Day by day for selected week"
              : "Week by week for selected period"}
          </span>
        </div>

        <div className="px-6 py-6">
          <LineChart data={lineChartData} className="h-[320px]" />
        </div>
      </SectionCard>
    </div>
  );
}

// Parses YYYY-MM-DD into a local Date at midnight for the bucket math.
function parseLocalDate(value: string) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
}

// Builds per-day x-axis labels for week view.
function buildDayLabels(startDate: Date, buckets: number) {
  const labels: string[] = [];
  for (let index = 0; index < buckets; index += 1) {
    const day = new Date(startDate);
    day.setDate(startDate.getDate() + index);
    labels.push(formatWeekdayMonthDay(day));
  }
  return labels;
}

// Builds week-range labels for longer windows.
function buildWeekLabels(startDate: Date, endDate: Date, buckets: number) {
  const labels: string[] = [];
  for (let index = 0; index < buckets; index += 1) {
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + index * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    if (weekEnd.getTime() > endDate.getTime()) {
      weekEnd.setTime(endDate.getTime());
    }

    labels.push(`${formatMonthDay(weekStart)}-${formatMonthDay(weekEnd)}`);
  }
  return labels;
}

// Compact axis label: "Mon 14/09".
function formatWeekdayMonthDay(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
  });
}

// label helper for week ranges.
function formatMonthDay(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${day}/${month}`;
}
