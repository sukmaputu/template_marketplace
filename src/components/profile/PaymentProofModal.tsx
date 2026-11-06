import { useState, useRef, useEffect } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  X,
} from "lucide-react";
import type { Order } from "./types";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { formatCheckoutPrice } from "@/lib/checkoutFlow";

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
  const apiBase = (
    import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8080/api/v1"
  ).replace(/\/api\/v1\/?$/, "");
  return `${apiBase}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function PaymentProofModal({
  order,
  onClose,
  onSubmitted,
  currency = "IDR",
  exchangeRate,
}: {
  order: Order;
  onClose: () => void;
  onSubmitted: () => void;
  currency?: "IDR" | "USD";
  exchangeRate?: number | null;
}) {
  const payment = order.payment;
  const isPaid = order.status === "completed" || payment?.status === "PAID";
  const isRejected = payment?.status === "REJECTED";
  const hasProof = Boolean(payment?.payment_proof_url);
  const isPending = !isPaid && hasProof && !isRejected;

  const [bankAccounts, setBankAccounts] =
    useState<BankAccount[]>(DEFAULT_BANKS);
  const [selectedBankIdx, setSelectedBankIdx] = useState(0);
  const [showUploadForm, setShowUploadForm] = useState(!hasProof);
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
            .filter(
              (m) =>
                (m.gateway_code === "manual" ||
                  m.category === "BANK_TRANSFER") &&
                m.account_number,
            )
            .map((m) => ({
              bank: m.bank_name || m.name,
              number: m.account_number || "",
              name:
                m.account_holder_name ||
                m.account_holder ||
                "PT Nadrical Compro",
            }));
          if (manual.length > 0) {
            setBankAccounts(manual);
            setSelectedBankIdx(0);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Bersihkan object URL preview agar tidak bocor memori
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Kunci scroll halaman di belakang modal + tutup dengan Escape
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose, isSubmitting]);

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
      setPreviewUrl(
        file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      );
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
    if (!order.uuid) {
      showToast(
        "UUID pesanan tidak tersedia, bukti pembayaran belum dapat dikirim.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const targetId = order.uuid;
      let proofUrl = payment?.payment_proof_url;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const uploadResponse = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const uploadData = uploadResponse.data?.data;
        proofUrl =
          typeof uploadData === "string"
            ? uploadData
            : uploadData?.url ||
              uploadData?.file_url ||
              uploadData?.image_url ||
              uploadData?.path;
        if (!proofUrl) {
          throw new Error("Server tidak mengembalikan URL bukti pembayaran.");
        }
      }

      await api.post(
        `/ecommerce/orders/${encodeURIComponent(targetId)}/payments`,
        {
          sender_name: senderName.trim(),
          sender_bank: senderBank.trim(),
          amount_paid: order.grand_total,
          payment_date: new Date().toISOString(),
          payment_proof_url: proofUrl,
        },
      );

      showToast("Bukti transfer berhasil diunggah! Menunggu approval admin.");
      setShowUploadForm(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      onSubmitted();
    } catch (err: unknown) {
      const apiError = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      const msg =
        apiError.response?.data?.error ||
        apiError.response?.data?.message ||
        (err instanceof Error
          ? err.message
          : "Gagal mengunggah bukti pembayaran");
      showToast(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeBank = bankAccounts[selectedBankIdx] ?? bankAccounts[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
      onClick={() => !isSubmitting && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="payment-modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[96dvh] w-full ${
          showUploadForm ? "max-w-4xl" : "max-w-xl"
        } flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl transition-[max-width] duration-300`}>
        {/* Header (tetap, selalu terlihat) */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Building2 className="h-5 w-5 shrink-0 text-primary" />
            <h3
              id="payment-modal-title"
              className="truncate text-sm font-semibold text-text sm:text-base">
              Pembayaran Transfer Bank Manual
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Tutup"
            className="rounded-lg p-1 text-text-secondary hover:bg-background hover:text-text disabled:opacity-50">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body: 1 kolom di mobile, 2 kolom di desktop agar tidak memanjang ke bawah.
            overflow-y-auto hanya sebagai jaring pengaman untuk layar yang sangat pendek. */}
        <div
          className={`grid min-h-0 gap-3 overflow-y-auto p-3 sm:p-5 lg:gap-5 ${
            showUploadForm ? "lg:grid-cols-2" : "grid-cols-1"
          }`}>
          {/* ===== Kolom kiri: status + rekening ===== */}
          <div className="flex flex-col gap-3">
            {/* Status */}
            {isPaid ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-300">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold">
                    Pembayaran Terverifikasi (Lunas)
                  </p>
                  <p className="mt-0.5 text-text-secondary">
                    Pembayaran pesanan ini telah disetujui oleh admin toko.
                  </p>
                </div>
              </div>
            ) : isPending ? (
              <div className="flex items-start justify-between gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-2.5 text-xs text-blue-900 dark:text-blue-300">
                <div className="flex min-w-0 items-start gap-2.5">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                  <div className="min-w-0">
                    <p className="font-semibold">
                      Bukti Sedang Diverifikasi Admin
                    </p>
                    <p className="mt-0.5 truncate text-text-secondary">
                      Pengirim: <strong>{payment?.sender_name}</strong> (
                      {payment?.sender_bank})
                    </p>
                  </div>
                </div>
                {payment?.payment_proof_url && (
                  <a
                    href={resolveProofUrl(payment.payment_proof_url)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Lihat bukti transfer di tab baru"
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-md border border-blue-500/20 bg-white/50 px-2 text-[11px] font-medium text-blue-800 hover:border-blue-500 hover:bg-white dark:bg-slate-900/30 dark:text-blue-200 dark:hover:bg-slate-900">
                    <span className="whitespace-nowrap">Lihat Bukti</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            ) : isRejected ? (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-900 dark:text-red-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <div className="min-w-0">
                  <p className="font-semibold">Bukti Pembayaran Ditolak</p>
                  <p className="mt-0.5 line-clamp-2">
                    Alasan:{" "}
                    {payment?.rejection_reason ||
                      "Bukti transfer tidak terbaca atau nominal tidak sesuai."}
                  </p>
                  <p className="mt-1 text-[11px] underline">
                    Harap unggah ulang bukti transfer yang sah.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:text-amber-200">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-semibold">Menunggu Pembayaran</p>
                  <p className="mt-0.5 text-text-secondary">
                    Transfer tepat sesuai total tagihan, lalu unggah bukti
                    bayar.
                  </p>
                </div>
              </div>
            )}

            {/* Rekening tujuan: pilih bank lewat tab, hanya 1 detail tampil → hemat tinggi */}
            {!isPaid && activeBank && (
              <div className="rounded-lg border border-border bg-background p-2.5 sm:p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-text">
                    Rekening Resmi Toko
                  </span>
                  <span className="font-bold text-primary">
                    Total:{" "}
                    {formatCheckoutPrice(
                      Number(order.grand_total),
                      currency,
                      exchangeRate,
                    )}
                  </span>
                </div>

                <div
                  className="flex flex-wrap gap-1.5"
                  role="tablist"
                  aria-label="Pilih bank tujuan">
                  {bankAccounts.map((acc, idx) => (
                    <button
                      key={`${acc.bank}-${idx}`}
                      type="button"
                      role="tab"
                      aria-selected={idx === selectedBankIdx}
                      onClick={() => setSelectedBankIdx(idx)}
                      className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase transition-colors ${
                        idx === selectedBankIdx
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-surface text-text hover:border-primary"
                      }`}>
                      {acc.bank}
                    </button>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-semibold text-text sm:text-base">
                      {activeBank.number}
                    </p>
                    <p className="truncate text-[11px] text-text-secondary">
                      a.n. {activeBank.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      copyText(
                        activeBank.number.replace(/-/g, ""),
                        `No. Rekening ${activeBank.bank}`,
                      )
                    }
                    className="flex shrink-0 items-center gap-1 rounded border border-border bg-background px-2 py-1 text-[11px] font-medium text-text hover:border-primary">
                    <Copy className="h-3 w-3" /> Salin
                  </button>
                </div>
              </div>
            )}

            {!isPaid && hasProof && !showUploadForm && (
              <button
                type="button"
                onClick={() => setShowUploadForm(true)}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-primary px-3 py-2 text-xs font-medium text-primary hover:bg-primary/5">
                <RefreshCw className="h-3 w-3" />
                Unggah Ulang Bukti Transfer
              </button>
            )}
          </div>

          {/* ===== Kolom kanan: form unggah ===== */}
          {!isPaid && showUploadForm && (
            <div className="flex flex-col">
              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="min-w-0">
                      <label className="block text-xs font-medium text-text-secondary">
                        Nama Pengirim <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={senderName}
                        onChange={(e) => setSenderName(e.target.value)}
                        placeholder="Budi Santoso"
                        required
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="block text-xs font-medium text-text-secondary">
                        Bank Pengirim <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={senderBank}
                        onChange={(e) => setSenderBank(e.target.value)}
                        placeholder="BCA, Mandiri, BNI"
                        required
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-text focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-text-secondary">
                      Bukti Transfer <span className="text-red-500">*</span>
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    {/* Area unggah horizontal & pendek: ikon/preview di kiri, teks di kanan */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-1 flex h-20 w-full items-center gap-3 rounded-lg border-2 border-dashed border-border bg-background px-3 text-left transition-colors hover:border-primary sm:h-24 lg:h-28">
                      {previewUrl ? (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-14 w-14 shrink-0 rounded object-cover sm:h-16 sm:w-16 lg:h-20 lg:w-20"
                        />
                      ) : (
                        <UploadCloud className="h-7 w-7 shrink-0 text-text-secondary" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-text">
                          {selectedFile
                            ? selectedFile.name
                            : "Pilih Bukti Transfer"}
                        </p>
                        <p className="text-[10px] text-text-secondary">
                          {selectedFile
                            ? "Klik untuk mengganti file"
                            : "JPG, PNG, WEBP, PDF (Maks. 5MB)"}
                        </p>
                      </div>
                    </button>
                  </div>

                  <div className="flex justify-end gap-2 pt-0.5">
                    {hasProof && (
                      <button
                        type="button"
                        onClick={() => setShowUploadForm(false)}
                        disabled={isSubmitting}
                        className="rounded-lg border border-border px-3 py-2 text-xs font-medium text-text hover:bg-background disabled:opacity-50">
                        Batal
                      </button>
                    )}
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 sm:flex-none">
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />{" "}
                          Mengunggah...
                        </>
                      ) : (
                        <>
                          <UploadCloud className="h-3.5 w-3.5" /> Kirim Bukti
                          Pembayaran
                        </>
                      )}
                    </button>
                  </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
