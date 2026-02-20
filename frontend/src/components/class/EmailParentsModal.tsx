import { createPortal } from "react-dom";
import { AlertBanner } from "../ui/AlertBanner";
import { Button } from "../ui/Button";
import { TextField } from "../ui/TextField";

// Modal for composing and sending class-wide  emails.
type EmailParentsModalProps = {
  open: boolean;
  subject: string;
  message: string;
  error: string | null;
  sending: boolean;
  onSubjectChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function EmailParentsModal({
  open,
  subject,
  message,
  error,
  sending,
  onSubjectChange,
  onMessageChange,
  onClear,
  onClose,
  onSubmit,
}: EmailParentsModalProps) {
  if (!open) return null;

  // Prevent empty subject/body submissions and duplicate sends while pending.
  const canSend =
    subject.trim().length > 0 && message.trim().length > 0 && !sending;

  // Modal thats returned.
  return createPortal(
    <div className="fixed inset-0 z-[99] flex items-center justify-center bg-black/60 px-6 py-8 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800/80 bg-slate-950 p-6 text-slate-200 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Class tools
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">
              Email parents
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={sending}
          >
            Close
          </Button>
        </div>

        <p className="mt-4 text-sm text-slate-300">
          Sends to all parent emails linked to students currently enrolled in
          this class.
        </p>

        <div className="mt-5 space-y-4">
          <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">
            Subject
            <TextField
              className="mt-2"
              value={subject}
              onChange={(e) => onSubjectChange(e.target.value)}
              placeholder="Trip reminder for Monday"
              maxLength={160}
            />
          </label>

          <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">
            Message
            <textarea
              className="mt-2 min-h-44 w-full rounded-2xl border border-slate-800/80 bg-slate-950/70 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 transition focus:border-amber-400/40 focus:outline-none focus:ring-2 focus:ring-amber-400/40"
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              placeholder="Write the message to parents..."
              maxLength={5000}
            />
          </label>

          {error && <AlertBanner variant="error">{error}</AlertBanner>}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <Button variant="secondary" onClick={onClear} disabled={sending}>
              Clear
            </Button>
            <Button onClick={onSubmit} disabled={!canSend}>
              {sending ? "Sending..." : "Send to parents"}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root") ?? document.body,
  );
}
