import { useState } from "react";
import { RotateCcw, X } from "lucide-react";
import type { Order } from "./types";
import { REFUND_REASONS } from "./types";

export function RefundModal({
  order,
  onClose,
  onSubmit,
}: {
  order: Order;
  onClose: () => void;
  onSubmit: (orderId: string, reason: string, note: string) => void;
}) {
  const [reason, setReason] = useState<string>(REFUND_REASONS[0]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    onSubmit(order.id, reason, note);
    setSubmitted(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-text">
              {submitted ? "Refund Diajukan" : "Ajukan Refund"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-background hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center">
            <p className="text-sm font-medium text-text">
              Pengajuan refund untuk pesanan #{order.id} berhasil dikirim.
            </p>
            <p className="mt-1.5 text-xs text-text-secondary">
              Kamu bisa melihat statusnya di tab "Refund".
            </p>
            <button
              onClick={onClose}
              className="mt-6 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90">
              Tutup
            </button>
          </div>
        ) : (
          <>
            <div className="mt-4 rounded-lg border border-border bg-background p-3.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-text-secondary">Pesanan:</span>
                <span className="font-semibold text-text">#{order.id}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-xs">
                <span className="text-text-secondary">Total:</span>
                <span className="font-semibold text-text">
                  Rp {order.grand_total.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Alasan Refund
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none">
                {REFUND_REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Catatan Tambahan (opsional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Ceritakan lebih detail kendalanya..."
                className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <button
                onClick={onClose}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text hover:bg-background">
                Batal
              </button>
              <button
                onClick={handleSubmit}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90">
                Kirim Pengajuan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
