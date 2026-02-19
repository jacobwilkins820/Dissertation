import { createPortal } from "react-dom";
import { Button } from "../ui/Button";
import { SearchSelect } from "../ui/SearchSelect";
import { AlertBanner } from "../ui/AlertBanner";
import type { StudentResponse } from "../../utils/responses";

type AddStudentModalProps = {
  open: boolean;
  selectedStudent: StudentResponse | null;
  onSelectStudent: (student: StudentResponse | null) => void;
  fetchStudentMatches: (query: string, signal: AbortSignal) => Promise<StudentResponse[]>;
  addError: string | null;
  onClear: () => void;
  onClose: () => void;
  onSubmit: () => void;
  adding: boolean;
  resetKey: number;
};

export default function AddStudentModal({
  open,
  selectedStudent,
  onSelectStudent,
  fetchStudentMatches,
  addError,
  onClear,
  onClose,
  onSubmit,
  adding,
  resetKey,
}: AddStudentModalProps) {
  if (!open) return null;

  return createPortal(
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
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <SearchSelect
            label="Find student"
            placeholder="Search by name or UPN"
            selected={selectedStudent}
            onSelect={onSelectStudent}
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
            resetKey={resetKey}
            maxResults={5}
          />

          {addError && <AlertBanner variant="error">{addError}</AlertBanner>}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="secondary" onClick={onClear}>
              Clear
            </Button>
            <Button onClick={onSubmit} disabled={!selectedStudent || adding}>
              {adding ? "Adding..." : "Add to class"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") ?? document.body
  );
}
