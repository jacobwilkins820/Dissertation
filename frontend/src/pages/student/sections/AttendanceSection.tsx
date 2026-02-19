import { SelectDropdown } from "../../../components/ui/SelectDropdown";
import { AlertBanner } from "../../../components/ui/AlertBanner";
import { SectionCard } from "../../../components/ui/SectionCard";
import { StateMessage } from "../../../components/ui/StateMessage";
import { ANALYTICS_RANGE_OPTIONS } from "../../../utils/analyticsDateRange";
import type { AttendanceRange, AttendanceSummary } from "../../../hooks/useAttendanceSummary";

type AttendanceSectionProps = {
  canViewAttendance: boolean;
  attendanceRange: AttendanceRange;
  setAttendanceRange: (value: AttendanceRange) => void;
  attendanceSummary: AttendanceSummary | null;
  attendanceLoading: boolean;
  attendanceError: string | null;
};

export function AttendanceSection({
  canViewAttendance,
  attendanceRange,
  setAttendanceRange,
  attendanceSummary,
  attendanceLoading,
  attendanceError,
}: AttendanceSectionProps) {
  return (
    <SectionCard padding="md" className="text-sm text-slate-200">
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
        <label className="space-y-1 text-xs text-slate-400">
          Range
          <SelectDropdown
            value={attendanceRange}
            options={ANALYTICS_RANGE_OPTIONS}
            onChange={(value) => setAttendanceRange(value as AttendanceRange)}
            disabled={!canViewAttendance}
            className="w-full"
          />
        </label>
      </div>

      {attendanceLoading && (
        <div className="mt-4">
          <StateMessage inline>Loading attendance summary...</StateMessage>
        </div>
      )}

      {attendanceError && (
        <div className="mt-4">
          <AlertBanner variant="error">{attendanceError}</AlertBanner>
        </div>
      )}

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
    </SectionCard>
  );
}
