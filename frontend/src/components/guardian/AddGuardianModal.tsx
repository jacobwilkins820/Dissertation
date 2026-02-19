import { createPortal } from "react-dom";
import { Button } from "../ui/Button";
import { SearchSelect } from "../ui/SearchSelect";
import { TextField } from "../ui/TextField";
import { AlertBanner } from "../ui/AlertBanner";
import type { GuardianSearch } from "../../utils/responses";

type AddGuardianModalProps = {
  open: boolean;
  selectedGuardian: GuardianSearch | null;
  onSelectGuardian: (guardian: GuardianSearch | null) => void;
  fetchGuardianMatches: (query: string, signal: AbortSignal) => Promise<GuardianSearch[]>;
  linkRelationship: string;
  onRelationshipChange: (value: string) => void;
  linkIsPrimary: boolean;
  onIsPrimaryChange: (value: boolean) => void;
  linkError: string | null;
  linkSuccess: string | null;
  onClear: () => void;
  onClose: () => void;
  onSubmit: () => void;
  linking: boolean;
  resetKey: number;
};

export default function AddGuardianModal({
  open,
  selectedGuardian,
  onSelectGuardian,
  fetchGuardianMatches,
  linkRelationship,
  onRelationshipChange,
  linkIsPrimary,
  onIsPrimaryChange,
  linkError,
  linkSuccess,
  onClear,
  onClose,
  onSubmit,
  linking,
  resetKey,
}: AddGuardianModalProps) {
  if (!open) return null;

  return createPortal(
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
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="mt-6 space-y-4">
          <SearchSelect
            label="Find guardian"
            placeholder="Search by name or email"
            selected={selectedGuardian}
            onSelect={onSelectGuardian}
            fetchOptions={fetchGuardianMatches}
            getOptionKey={(guardian) => guardian.id}
            getOptionLabel={(guardian) =>
              `${guardian.firstName} ${guardian.lastName}${
                guardian.email ? ` (${guardian.email})` : ""
              }`
            }
            resetKey={resetKey}
            maxResults={5}
          />

          <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
            Relationship
            <TextField
              value={linkRelationship}
              onChange={(event) => onRelationshipChange(event.target.value)}
              placeholder="e.g., Mother"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={linkIsPrimary}
              onChange={(event) => onIsPrimaryChange(event.target.checked)}
              className="h-3 w-3 accent-slate-200"
            />
            Primary guardian
          </label>

          {linkError && <AlertBanner variant="error">{linkError}</AlertBanner>}

          {linkSuccess && (
            <AlertBanner variant="success">{linkSuccess}</AlertBanner>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="secondary" onClick={onClear}>
              Clear
            </Button>
            <Button onClick={onSubmit} disabled={!selectedGuardian || linking}>
              {linking ? "Linking..." : "Link guardian"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") ?? document.body
  );
}
