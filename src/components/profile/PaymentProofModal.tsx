import { useState, useRef, useEffect } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";
import type { Order } from "./types";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";

interface BankAccount {
  bank: string;
  number: string;
  name: string;
}

const DEFAULT_BANKS: BankAccount[] = [
  { bank: "BCA", number: "8001234567", name: "PT Nadrical Compro" },
  { bank: "Mandiri", number: "1370012345678", name: "PT Nadrical Compro" },
  { bank: "BRI", number: "012301001234567", name: "PT Nadrical Compro" },
];

function resolveProofUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const apiBase = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080/api/v1").replace(/\/api\/v1\/?$/, "");
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function PaymentProofModal({
  order,
  onClose,
  onSubmitted,
}: {
  order: Order;
  onClose: () => void;
  onSubmitted: () => void;
}) {
  const payment = order.payment;
  const isPaid = order.status === "completed" || payment?.status === "PAID";
  const isRejected = payment?.status === "REJECTED";
  const hasProof = Boolean(payment?.payment_proof_url);
  const isPending = !isPaid && hasProof && !isRejected;

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(DEFAULT_BANKS);
  const [showUploadForm, setShowUploadForm] = useState(!hasProof || isRejected);
  const [senderName, setSenderName] = useState(payment?.sender_name || "");
  const [senderBank, setSenderBank] = useState(payment?.sender_bank || "BCA");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api
      .get("/ecommerce/payment-methods?is_enabled=true")
      .then((res) => {
        const data = res.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          const manual = data
            .filter((m) => (m.gateway_code === "manual" || m.category === "BANK_TRANSFER") && m.account_number)
            .map((m) => ({
              bank: m.bank_name || m.name,
              number: m.account_number || "",
              name: m.account_holder_name || m.account_holder || "PT Nadrical Compro",
            }));
          if (manual.length > 0) setBankAccounts(manual);
        }
      })
      .catch(() => {});
  }, []);

  const copyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => {
      showToast(`${label} berhasil disalin!`);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("Ukuran file maksimal 5MB");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderName.trim()) {
      showToast("Nama pemilik rekening pengirim wajib diisi");
      return;
    }
    if (!selectedFile && !hasProof) {
      showToast("Silakan pilih foto atau screenshot bukti transfer");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("sender_name", senderName.trim());
      formData.append("sender_bank", senderBank.trim());
      formData.append("amount_paid", String(order.grand_total));
      if (selectedFile) {
        formData.append("payment_proof", selectedFile);
      }

      const targetId = order.uuid || order.id;
      await api.post(`/ecommerce/orders/${targetId}/payments`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      showToast("Bukti transfer berhasil diunggah! Menunggu approval admin.");
      setShowUploadForm(false);
      setSelectedFile(null);
      onSubmitted();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengunggah bukti pembayaran";
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-sm max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <h3 className="text-base font-semibold text-text">
              Pembayaran Transfer Bank Manual
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-background hover:text-text">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Alert */}
        <div className="mt-4">
          {isPaid ? (
            <div className="flex items-start gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-800 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              <div>
                <p className="font-semibold">Pembayaran Terverifikasi (Lunas)</p>
                <p className="mt-0.5 text-text-secondary">
                  Pembayaran pesanan ini telah disetujui oleh admin toko.
                </p>
              </div>
            </div>
          ) : isPending && !showUploadForm ? (
            <div className="flex items-start justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-900 dark:text-blue-300">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-semibold">Bukti Sedang Diverifikasi Admin</p>
                  <p className="mt-0.5 text-text-secondary">
                    Pengirim: <strong>{payment?.sender_name}</strong> ({payment?.sender_bank})
                  </p>
                </div>
              </div>
              {payment?.payment_proof_url && (
                <a
                  href={resolveProofUrl(payment.payment_proof_url)}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 rounded border border-border p-1 hover:border-primary"
                  title="Lihat Bukti">
                  <img
                    src={resolveProofUrl(payment.payment_proof_url)}
                    alt="Bukti Transfer"
                    className="h-10 w-10 object-cover rounded"
                  />
                </a>
              )}
            </div>
          ) : isRejected ? (
            <div className="flex items-start gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-900 dark:text-red-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <p className="font-semibold">Bukti Pembayaran Ditolak</p>
                <p className="mt-0.5">
                  Alasan: {payment?.rejection_reason || "Bukti transfer tidak terbaca atau nominal tidak sesuai."}
                </p>
                <p className="mt-1 text-[11px] underline">Harap unggah ulang bukti transfer yang sah.</p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
              <Clock className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="font-semibold">Menunggu Pembayaran</p>
                <p className="mt-0.5 text-text-secondary">
                  Silakan transfer tepat sesuai total tagihan, lalu unggah struk bukti bayar di bawah ini.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rekening Tujuan Transfer */}
        {!isPaid && (
          <div className="mt-4 rounded-lg border border-border bg-background p-3.5">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-semibold text-text">Rekening Resmi Toko</span>
              <span className="font-bold text-primary">
                Total: Rp{Number(order.grand_total).toLocaleString("id-ID")}
              </span>
            </div>
            <div className="grid gap-2">
              {bankAccounts.map((acc) => (
                <div
                  key={acc.bank}
                  className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-xs">
                  <div>
                    <span className="font-bold text-primary uppercase">{acc.bank}</span>
                    <p className="font-mono font-semibold text-text">{acc.number}</p>
                    <p className="text-[11px] text-text-secondary">{acc.name}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(acc.number.replace(/-/g, ""), `No. Rekening ${acc.bank}`)}
                    className="flex items-center gap-1 rounded bg-background border border-border px-2 py-1 text-[11px] font-medium text-text hover:border-primary">
                    <Copy className="h-3 w-3" /> Salin
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Form */}
        {!isPaid && showUploadForm && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary">
                Nama Pemilik Rekening Pengirim <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary">
                Bank Pengirim <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={senderBank}
                onChange={(e) => setSenderBank(e.target.value)}
                placeholder="Contoh: BCA, Mandiri, BRI, BNI, dll"
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary">
                Foto / Screenshot Bukti Transfer <span className="text-red-500">*</span>
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current?.click()}
                className="mt-1 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-background p-4 text-center hover:border-primary transition-colors">
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-32 object-contain rounded"
                    />
                    <p className="mt-2 text-[11px] text-text-secondary">Klik untuk mengganti foto</p>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="h-8 w-8 text-text-secondary" />
                    <p className="mt-1 text-xs font-medium text-text">Pilih Gambar Bukti Transfer</p>
                    <p className="text-[10px] text-text-secondary">JPG, PNG, WEBP, PDF (Maks. 5MB)</p>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              {hasProof && (
                <button
                  type="button"
                  onClick={() => setShowUploadForm(false)}
                  className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text hover:bg-background">
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50">
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-3 w-3 animate-spin" /> Mengunggah...
                  </>
                ) : (
                  <>
                    <UploadCloud className="h-3.5 w-3.5" /> Kirim Bukti Pembayaran
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* If already has proof and not showing form, allow re-upload */}
        {!isPaid && !showUploadForm && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => setShowUploadForm(true)}
              className="flex items-center gap-1 text-xs text-primary font-medium hover:underline">
              <RefreshCw className="h-3 w-3" /> Unggah Ulang Bukti Transfer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
