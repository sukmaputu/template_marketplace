import { useState } from "react";
import {
  RotateCcw,
  X,
  Upload,
  FileImage,
  FileVideo,
  Trash2,
} from "lucide-react";
import type { Order } from "./types";
import { REFUND_REASONS } from "./types";
import { useCurrency } from "@/components/navbar/CurrencySwitcher";

export function RefundModal({
  order,
  onClose,
  onSubmit,
}: {
  order: Order;
  onClose: () => void;
  onSubmit: (
    orderId: string,
    reason: string,
    note: string,
    evidence: File[],
  ) => void;
}) {
  const { formatPrice } = useCurrency();
  const [reason, setReason] = useState<string>(REFUND_REASONS[0]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [evidence, setEvidence] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setEvidence((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setEvidence((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit(order.id, reason, note, evidence);
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
              Pengajuan akan diproses oleh admin terlebih dahulu.
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
                  {formatPrice(order.grand_total)}
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

            <div className="mt-4">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                Bukti Foto / Video
              </label>
              <label
                htmlFor="refund-evidence"
                className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-3 py-5 text-center hover:bg-surface">
                <Upload className="h-5 w-5 text-text-secondary" />
                <span className="text-xs font-medium text-text">
                  Klik untuk unggah foto/video
                </span>
                <span className="text-[11px] text-text-secondary">
                  JPG, PNG, MP4 (bisa lebih dari satu file)
                </span>
                <input
                  id="refund-evidence"
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {evidence.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {evidence.map((file, index) => (
                    <li
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between rounded-lg border border-border bg-background px-3 py-2">
                      <div className="flex min-w-0 items-center gap-2">
                        {file.type.startsWith("video") ? (
                          <FileVideo className="h-4 w-4 shrink-0 text-text-secondary" />
                        ) : (
                          <FileImage className="h-4 w-4 shrink-0 text-text-secondary" />
                        )}
                        <span className="truncate text-xs text-text">
                          {file.name}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="shrink-0 rounded p-1 text-text-secondary hover:bg-surface hover:text-text">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
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
