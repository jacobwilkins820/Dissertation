import type { StudentGuardianResponse } from "../../../utils/responses";
import type { GuardianEditState } from "../../../hooks/useStudentGuardians";
import { Button } from "../../../components/Button";
import { TextField } from "../../../components/TextField";
import { AlertBanner } from "../../../components/AlertBanner";
import { SectionCard } from "../../../components/SectionCard";
import { StateMessage } from "../../../components/StateMessage";

type GuardianSectionProps = {
  guardians: StudentGuardianResponse[];
  guardiansLoading: boolean;
  guardiansError: string | null;
  guardianEdits: Record<number, GuardianEditState>;
  primaryGuardianId: number | null;
  guardianSaveState: Record<number, boolean>;
  guardianRemoveState: Record<number, boolean>;
  guardianSaveError: string | null;
  guardianSaveSuccess: string | null;
  canEditGuardians: boolean;
  canViewGuardians: boolean;
  onOpenAddGuardian: () => void;
  onSaveGuardian: (guardianId: number) => void;
  onPrimaryChange: (guardianId: number) => void;
  onRemoveGuardian: (guardianId: number) => void;
  onNavigateGuardian: (guardianId: number) => void;
  onRelationshipChange: (guardianId: number, value: string) => void;
};

export function GuardianSection({
  guardians,
  guardiansLoading,
  guardiansError,
  guardianEdits,
  primaryGuardianId,
  guardianSaveState,
  guardianRemoveState,
  guardianSaveError,
  guardianSaveSuccess,
  canEditGuardians,
  canViewGuardians,
  onOpenAddGuardian,
  onSaveGuardian,
  onPrimaryChange,
  onRemoveGuardian,
  onNavigateGuardian,
  onRelationshipChange,
}: GuardianSectionProps) {
  if (!canViewGuardians) return null;

  return (
    <SectionCard padding="md" className="text-sm text-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Guardians
          </p>
          <h2 className="text-xl font-semibold text-white">
            Parents and guardians
          </h2>
          <p className="text-xs text-slate-400">
            Add, edit, and mark a primary guardian.
          </p>
        </div>
        {canEditGuardians && (
          <Button size="sm" onClick={onOpenAddGuardian}>
            Add guardian
          </Button>
        )}
      </div>

      {guardiansError && (
        <div className="mt-4">
          <AlertBanner variant="error">{guardiansError}</AlertBanner>
        </div>
      )}

      {guardianSaveError && (
        <div className="mt-4">
          <AlertBanner variant="error">{guardianSaveError}</AlertBanner>
        </div>
      )}
      {guardianSaveSuccess && (
        <div className="mt-4">
          <AlertBanner variant="success">{guardianSaveSuccess}</AlertBanner>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {guardians.map((guardian) => {
          const edit = guardianEdits[guardian.guardianId];
          const isSaving = guardianSaveState[guardian.guardianId];
          const isPrimary = primaryGuardianId === guardian.guardianId;

          return (
            <div
              key={guardian.guardianId}
              className="space-y-3 rounded-2xl border border-slate-800/70 bg-slate-950/60 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {guardian.guardianFirstName} {guardian.guardianLastName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {guardian.relationship || "Relationship unknown"}
                  </p>
                </div>
                {canEditGuardians && (
                  <label
                    className={`flex items-center gap-2 text-xs ${
                      isPrimary
                        ? "text-amber-200 font-semibold"
                        : "text-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="primaryGuardian"
                      checked={isPrimary}
                      onChange={() => onPrimaryChange(guardian.guardianId)}
                      className="h-4 w-4 accent-amber-400 focus:ring-0"
                    />
                    Primary
                  </label>
                )}
              </div>

              {canEditGuardians && (
                <label className="grid gap-1.5 text-xs uppercase tracking-[0.2em] text-slate-300">
                  Relationship
                  <TextField
                    value={edit?.relationship ?? ""}
                    onChange={(event) =>
                      onRelationshipChange(guardian.guardianId, event.target.value)
                    }
                  />
                </label>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigateGuardian(guardian.guardianId)}
                >
                  View guardian
                </Button>
                {canEditGuardians && (
                  <Button
                    size="sm"
                    onClick={() => onSaveGuardian(guardian.guardianId)}
                    disabled={isSaving}
                  >
                    {isSaving ? "Saving..." : "Save link"}
                  </Button>
                )}
                {canEditGuardians && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => onRemoveGuardian(guardian.guardianId)}
                    disabled={
                      guardian.isPrimary ||
                      guardianRemoveState[guardian.guardianId]
                    }
                  >
                    {guardianRemoveState[guardian.guardianId]
                      ? "Removing..."
                      : "Remove"}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!guardiansLoading && guardians.length === 0 && (
        <div className="mt-6">
          <StateMessage inline>No guardians linked yet.</StateMessage>
        </div>
      )}

      {guardiansLoading && (
        <div className="mt-6">
          <StateMessage inline>Loading guardians...</StateMessage>
        </div>
      )}
    </SectionCard>
  );
}
