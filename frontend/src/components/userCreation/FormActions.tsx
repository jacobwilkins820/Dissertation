import { Button } from "../ui/Button";

// Standard submit/reset action row for account creation forms.
type Props = {
  submitting: boolean;
  submitLabel: string;
  submittingLabel: string;
  disableSubmit?: boolean;
  onReset: () => void;
};

export function FormActions({
  submitting,
  submitLabel,
  submittingLabel,
  disableSubmit = false,
  onReset,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      {/* Disable submit while request is in flight to avoid duplicate creates. */}
      <Button type="submit" disabled={submitting || disableSubmit}>
        {submitting ? submittingLabel : submitLabel}
      </Button>

      {/* Reset stays local and  does not submit form. */}
      <Button variant="secondary" disabled={submitting} onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}
