import { useState } from "react";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { OrderCard } from "@/components/profile/OrderCard";
import { PaymentProofModal } from "@/components/profile/PaymentProofModal";
import type { Order } from "@/components/profile/types";

const previewProofUrl =
  "data:image/svg+xml," +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">
    <rect width="640" height="800" rx="32" fill="#f8fafc"/>
    <rect x="48" y="48" width="544" height="704" rx="24" fill="white" stroke="#cbd5e1" stroke-width="4"/>
    <text x="320" y="160" text-anchor="middle" font-family="Arial" font-size="32" font-weight="700" fill="#0f172a">BUKTI TRANSFER</text>
    <text x="96" y="260" font-family="Arial" font-size="22" fill="#475569">Bank Pengirim</text>
    <text x="96" y="300" font-family="Arial" font-size="28" font-weight="700" fill="#0f172a">BCA</text>
    <text x="96" y="390" font-family="Arial" font-size="22" fill="#475569">Nama Pengirim</text>
    <text x="96" y="430" font-family="Arial" font-size="28" font-weight="700" fill="#0f172a">Pelanggan Preview</text>
    <text x="96" y="520" font-family="Arial" font-size="22" fill="#475569">Jumlah Transfer</text>
    <text x="96" y="570" font-family="Arial" font-size="36" font-weight="700" fill="#2563eb">Rp 2.460.700</text>
    <text x="320" y="680" text-anchor="middle" font-family="Arial" font-size="20" fill="#64748b">Contoh untuk preview UI</text>
  </svg>`);

const previewOrder: Order = {
  id: "ORD-20261106-577907DB",
  status: "processing",
  date: "6 Nov 2026, 11.53",
  grand_total: 2460700,
  payment: {
    status: "PAID",
    payment_status: "paid",
    payment_method: "Transfer Bank",
    sender_name: "Pelanggan Preview",
    sender_bank: "BCA",
    amount_paid: 2460700,
    payment_proof_url: previewProofUrl,
    verified_at: new Date().toISOString(),
  },
  items: [
    {
      id: "preview-item-1",
      product_name_snapshot: "Linen Bedding Set — Queen",
      variant_name_snapshot: "Standar",
      unit_price: 2200000,
      quantity: 1,
      image: "/products/data.jpg",
    },
  ],
};

export default function PaymentProofPreviewPage() {
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplaceHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary">
            Preview lokal: Riwayat Pembelian
          </p>
          <p className="mt-1 text-xs leading-relaxed text-text-secondary">
            Contoh pesanan sudah dikonfirmasi admin. Tekan tombol “Bukti Bayar”
            untuk melihat modal. Tidak ada pembayaran atau unggahan sungguhan.
          </p>
        </div>

        <div className="space-y-3">
          <OrderCard
            order={previewOrder}
            onTrackClick={() => undefined}
            onMarkReceived={() => undefined}
            onCancelClick={() => undefined}
            onRefundClick={() => undefined}
            onUploadProofClick={() => setIsProofModalOpen(true)}
          />
        </div>
      </main>
      <MarketplaceFooter />

      {isProofModalOpen && (
        <PaymentProofModal
          order={previewOrder}
          previewOnly
          onClose={() => setIsProofModalOpen(false)}
          onSubmitted={() => setIsProofModalOpen(false)}
        />
      )}
    </div>
  );
}
