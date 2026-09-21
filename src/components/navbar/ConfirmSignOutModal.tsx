import { useEffect } from "react";
import { createPortal } from "react-dom";

interface ConfirmSignOutModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmSignOutModal({
  open,
  onConfirm,
  onCancel,
}: ConfirmSignOutModalProps) {
  useEffect(() => {
    if (!open) return;

    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
      role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="signout-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-lg">
        <h2 id="signout-title" className="text-base font-semibold text-text">
          Apakah anda yakin ingin keluar?
        </h2>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-border/40">
            Tidak
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700">
            Ya
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
