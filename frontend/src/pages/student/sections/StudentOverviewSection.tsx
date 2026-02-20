import { Button } from "../../../components/ui/Button";
import { DatePicker } from "../../../components/ui/DatePicker";
import { SelectDropdown } from "../../../components/ui/SelectDropdown";
import { TextField } from "../../../components/ui/TextField";
import { AlertBanner } from "../../../components/ui/AlertBanner";
import { SectionCard } from "../../../components/ui/SectionCard";
import type { Student } from "../../../utils/responses";
import { formatDate, formatDateTime } from "../../../utils/date";
import type { StudentForm } from "../../../hooks/useStudentRecord";

// Props for the student profile panel.
type StudentOverviewSectionProps = {
  student: Student | null;
  studentLoading: boolean;
  studentError: string | null;
  canEditStudent: boolean;
  editingStudent: boolean;
  savingStudent: boolean;
  formValues: StudentForm;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onFormChange: (patch: Partial<StudentForm>) => void;
};

// Student identity/enrolment panel with optional edit mode.
export function StudentOverviewSection({
  student,
  studentLoading,
  studentError,
  canEditStudent,
  editingStudent,
  savingStudent,
  formValues,
  onEdit,
  onCancel,
  onSave,
  onFormChange,
}: StudentOverviewSectionProps) {
  return (
    <SectionCard padding="md" className="text-sm text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Student
          </p>
          <h2 className="text-2xl font-semibold text-white">
            {student?.firstName ?? "Loading"} {student?.lastName ?? ""}
          </h2>
          <p className="text-xs text-slate-400">ID: {student?.id ?? "-"}</p>
        </div>

        {canEditStudent && (
          <div className="flex flex-wrap items-center gap-2">
            {!editingStudent && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onEdit}
                disabled={studentLoading || !student}
              >
                Edit details
              </Button>
            )}
            {editingStudent && (
              <>
                <Button size="sm" onClick={onSave} disabled={savingStudent}>
                  {savingStudent ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onCancel}
                  disabled={savingStudent}
                >
                  Cancel
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {studentLoading && (
        <div className="mt-4 text-sm text-slate-400">
          Loading student details...
        </div>
      )}

      {studentError && (
        <div className="mt-4">
          <AlertBanner variant="error">{studentError}</AlertBanner>
        </div>
      )}

      {!studentLoading && student && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Identity
            </p>
            <div className="grid gap-3">
              <FieldRow
                label="First name"
                value={student.firstName}
                editing={editingStudent}
                inputValue={formValues.firstName}
                onChange={(value) => onFormChange({ firstName: value })}
              />
              <FieldRow
                label="Last name"
                value={student.lastName}
                editing={editingStudent}
                inputValue={formValues.lastName}
                onChange={(value) => onFormChange({ lastName: value })}
              />
              <FieldRow
                label="UPN"
                value={student.upn}
                editing={editingStudent}
                inputValue={formValues.upn}
                onChange={(value) => onFormChange({ upn: value })}
              />
            </div>
          </div>

          <div className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Enrollment
            </p>
            <div className="grid gap-3">
              <FieldRow
                label="Date of birth"
                value={formatDate(student.dateOfBirth)}
                editing={editingStudent}
                inputValue={formValues.dateOfBirth}
                type="date"
                onChange={(value) => onFormChange({ dateOfBirth: value })}
              />
              <FieldRow
                label="Gender"
                value={student.gender}
                editing={editingStudent}
                inputValue={formValues.gender}
                onChange={(value) => onFormChange({ gender: value })}
              />
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
                    onChange={(value) => onFormChange({ status: value })}
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

      {!studentLoading && student && (
        <div className="mt-6 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4 text-xs uppercase tracking-[0.2em] text-slate-400">
          Created: {formatDateTime(student.createdAt)} | Updated:{" "}
          {formatDateTime(student.updatedAt)}
        </div>
      )}
    </SectionCard>
  );
}

type FieldRowProps = {
  label: string;
  value?: string | null;
  editing: boolean;
  inputValue: string;
  onChange: (value: string) => void;
  type?: string;
};

// Reusable read/edit field row used in identity and enrolment sections.
function FieldRow({
  label,
  value,
  editing,
  inputValue,
  onChange,
  type = "text",
}: FieldRowProps) {
  if (editing) {
    // Date fields use shared DatePicker to keep format and UX consistent.
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
