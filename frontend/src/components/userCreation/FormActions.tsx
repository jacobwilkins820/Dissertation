import { Button } from "../ui/Button";

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
      <Button type="submit" disabled={submitting || disableSubmit}>
        {submitting ? submittingLabel : submitLabel}
      </Button>

      <Button variant="secondary" disabled={submitting} onClick={onReset}>
        Reset
      </Button>
    </div>
  );
}

