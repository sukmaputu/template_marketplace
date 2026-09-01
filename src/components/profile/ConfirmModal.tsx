import { AlertTriangle, X } from "lucide-react";

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Ya",
  cancelLabel = "Tidak",
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
            </span>
            <h3 className="text-sm font-semibold text-text">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-background hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-text-secondary">{message}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text hover:bg-background">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-destructive px-4 py-2 text-xs font-medium text-white hover:opacity-90">
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
