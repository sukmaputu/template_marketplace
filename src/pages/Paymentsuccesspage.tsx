import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import {
  ArrowRight,
  Download,
  Copy,
  Check,
  Clock,
  Upload,
  Building2,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { ProductCard } from "@/components/ProductCard";
import {
  InvoiceDocument,
  type InvoiceItem,
  type InvoiceCustomer,
} from "@/components/Invoicedocument";
import { PRODUCTS } from "@/lib/products";
import { saveOrder } from "@/lib/orderHistory";
import type { Order } from "@/components/profile/types";
import { useAuth } from "@/components/auth/UseAuth";
import { PaymentProofModal } from "@/components/profile/PaymentProofModal";
import { showToast } from "@/lib/toast";

type PurchasedItem = InvoiceItem & {
  productId: string;
  variant: string;
  image?: string;
};

const RECOMMENDATION_COUNT = 4;

function formatRupiah(value: number) {
  return `Rp${(value || 0).toLocaleString("id-ID")}`;
}

function pickRandomProducts(excludeIds: string[], count: number) {
  const pool = PRODUCTS.filter((p) => !excludeIds.includes(p.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, addLoyaltyPoints } = useAuth();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const orderState = location.state as
    | {
        totalPaid?: number;
        itemIds?: string[];
        orderId?: string;
        items?: PurchasedItem[];
        subtotal?: number;
        packagingFee?: number;
        taxAmount?: number;
        taxLabel?: string;
        discountAmount?: number;
        voucherCode?: string;
        customer?: InvoiceCustomer;
        loyaltyPointsEarned?: number;
        paymentMethod?: {
          name: string;
          gateway_code: string;
          bank_name?: string;
          account_number?: string;
          account_holder?: string;
          account_holder_name?: string;
          instructions?: string;
        };
        isManual?: boolean;
        paymentFee?: number;
      }
    | undefined;

  const totalPaid = orderState?.totalPaid ?? 0;
  const invoiceItems = orderState?.items ?? [];
  const invoiceSubtotal = orderState?.subtotal ?? 0;
  const invoicePackagingFee = orderState?.packagingFee ?? 0;
  const discountAmount = orderState?.discountAmount ?? 0;
  const taxAmount = orderState?.taxAmount ?? 0;
  const extraFees = totalPaid - (invoiceSubtotal + invoicePackagingFee + taxAmount);

  const invoiceCustomer = orderState?.customer ?? {
    name: "-",
    email: "-",
    phone: "-",
  };

  const [orderId] = useState(
    () => orderState?.orderId ?? `INV-M-${Date.now()}`,
  );
  const rewardAppliedRef = useRef(false);

  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [isProofSubmitted, setIsProofSubmitted] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  useEffect(() => {
    if (!orderState?.items?.length) return;

    if (user && orderState.loyaltyPointsEarned && !rewardAppliedRef.current) {
      addLoyaltyPoints(orderState.loyaltyPointsEarned);
      rewardAppliedRef.current = true;
    }

    const isManual = Boolean(orderState?.isManual);

    const order: Order = {
      id: orderId,
      uuid: orderId,
      status: isManual ? "pending_payment" : "processing",
      cancelDeadline: new Date(Date.now() + 1000 * 60 * 74).toISOString(),
      date: new Date().toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      grand_total: totalPaid,
      payment: orderState?.paymentMethod
        ? {
            payment_method: orderState.paymentMethod.name,
            payment_status: isManual ? "pending" : "paid",
            sender_bank:
              orderState.paymentMethod.bank_name ||
              orderState.paymentMethod.name,
            amount_paid: totalPaid,
          }
        : undefined,
      items: orderState.items.map((item, index) => ({
        id: `${orderId}-item-${index + 1}`,
        product_name_snapshot: item.name,
        variant_name_snapshot: item.variant,
        unit_price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
    };

    saveOrder(order);
  }, [
    orderId,
    orderState?.items,
    orderState?.loyaltyPointsEarned,
    orderState?.isManual,
    orderState?.paymentMethod,
    totalPaid,
    user,
    addLoyaltyPoints,
  ]);

  const [invoiceDate] = useState(() =>
    new Date().toLocaleString("id-ID", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  );

  const [recommendations] = useState(() =>
    pickRandomProducts(orderState?.itemIds ?? [], RECOMMENDATION_COUNT),
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplaceHeader />

      <div className="mx-auto max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-6 py-12 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className={`relative flex h-20 w-20 items-center justify-center rounded-full ${
              orderState?.isManual && !isProofSubmitted
                ? "bg-amber-500"
                : "bg-secondary"
            }`}>
            {orderState?.isManual && !isProofSubmitted ? (
              <Clock className="h-10 w-10 text-white" />
            ) : (
              <motion.svg
                viewBox="0 0 24 24"
                className="h-10 w-10"
                initial="hidden"
                animate="visible">
                <motion.path
                  d="M5 13l4 4L19 7"
                  fill="none"
                  stroke="white"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  variants={{
                    hidden: { pathLength: 0, opacity: 0 },
                    visible: {
                      pathLength: 1,
                      opacity: 1,
                      transition: { delay: 0.3, duration: 0.5, ease: "easeOut" },
                    },
                  }}
                />
              </motion.svg>
            )}

            <motion.span
              className={`absolute inset-0 rounded-full border-2 ${
                orderState?.isManual && !isProofSubmitted
                  ? "border-amber-500"
                  : "border-secondary"
              }`}
              initial={{ scale: 1, opacity: 0.6 }}
              animate={{ scale: 1.6, opacity: 0 }}
              transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
            />
          </motion.div>

          <motion.h1
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="mt-6 text-2xl font-bold text-text">
            {orderState?.isManual
              ? isProofSubmitted
                ? "Bukti Bayar Berhasil Diunggah!"
                : "Pesanan Dibuat — Menunggu Pembayaran"
              : "Pembayaran Berhasil!"}
          </motion.h1>

          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-2 max-w-sm text-sm text-text-secondary">
            {orderState?.isManual
              ? isProofSubmitted
                ? "Terima kasih! Bukti transfer Anda sudah kami terima dan menunggu verifikasi admin. Detail pesanan dapat dipantau di halaman profil."
                : "Pesanan Anda berhasil dibuat. Silakan transfer tepat sejumlah tagihan ke rekening di bawah ini dan unggah bukti transfer agar segera diproses."
              : "Terima kasih! Pesananmu sudah kami terima dan sedang diproses. Detail pesanan bisa dilihat di halaman profil kamu."}
          </motion.p>

          {orderState?.isManual && orderState.paymentMethod && (
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.4 }}
              className="mt-6 w-full max-w-md rounded-xl border border-border bg-background p-4 text-left shadow-xs">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-text uppercase tracking-wide">
                    Rekening Pembayaran
                  </p>
                  <p className="text-sm font-bold text-text">
                    {orderState.paymentMethod.bank_name || orderState.paymentMethod.name}
                  </p>
                </div>
              </div>

              {orderState.paymentMethod.account_number && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-surface border border-border p-3">
                  <div>
                    <span className="text-xs text-text-secondary block">Nomor Rekening</span>
                    <span className="text-base font-mono font-bold text-text">
                      {orderState.paymentMethod.account_number}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(orderState.paymentMethod?.account_number || "");
                      setCopiedAccount(orderState.paymentMethod?.account_number || "");
                      showToast("Nomor rekening disalin!");
                      setTimeout(() => setCopiedAccount(null), 2000);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold text-primary hover:bg-border/30">
                    {copiedAccount === orderState.paymentMethod.account_number ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Salin Rekening
                      </>
                    )}
                  </button>
                </div>
              )}

              <div className="mt-3 flex items-center justify-between text-xs text-text-secondary">
                <span>Atas Nama</span>
                <span className="font-semibold text-text">
                  {orderState.paymentMethod.account_holder ||
                    orderState.paymentMethod.account_holder_name ||
                    "Official Store"}
                </span>
              </div>

              <div className="mt-2 flex items-center justify-between text-xs text-text-secondary">
                <span>Total Ditransfer</span>
                <span className="font-bold text-sm text-primary">
                  {formatRupiah(totalPaid)}
                </span>
              </div>

              <div className="mt-4 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsProofModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-xs font-semibold text-white shadow-sm hover:opacity-90">
                  <Upload className="h-4 w-4" />
                  {isProofSubmitted ? "Lihat / Ganti Bukti Bayar" : "Unggah Bukti Bayar Sekarang"}
                </button>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.4 }}
            className="mt-6 w-full max-w-xs rounded-lg border border-border bg-background px-4 py-3 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary">No. Pesanan</span>
              <span className="font-medium text-text">{orderId}</span>
            </div>
            <div className="mt-1.5 flex items-center justify-between text-sm">
              <span className="text-text-secondary">Total Tagihan</span>
              <span className="font-semibold text-primary">
                {formatRupiah(totalPaid)}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.65, duration: 0.4 }}
            className="mt-4">
            <PDFDownloadLink
              document={
                <InvoiceDocument
                  orderId={orderId}
                  date={invoiceDate}
                  customer={invoiceCustomer}
                  items={invoiceItems}
                  subtotal={invoiceSubtotal}
                  packagingFee={
                    invoicePackagingFee + Math.max(0, extraFees) + discountAmount
                  }
                  taxAmount={taxAmount}
                  taxLabel={orderState?.taxLabel}
                  discountAmount={discountAmount}
                  voucherCode={orderState?.voucherCode}
                />
              }
              fileName={`invoice-${orderId}.pdf`}
              className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-text hover:border-primary">
              {({ loading }) => (
                <>
                  <Download className="h-4 w-4" />
                  {loading ? "Menyiapkan invoice..." : "Download Invoice"}
                </>
              )}
            </PDFDownloadLink>
          </motion.div>

          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/profile"
              className="rounded-full border border-border px-6 py-2.5 text-sm font-semibold text-text hover:border-primary">
              Lihat Pesanan
            </Link>
            <Link
              to="/"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90">
              Lanjut Belanja
            </Link>
          </motion.div>
        </div>

        {recommendations.length > 0 ? (
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-text">Mungkin Kamu Suka</h2>
              <button
                onClick={() => navigate("/")}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:opacity-80">
                Lihat semua
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {recommendations.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <MarketplaceFooter />

      {isProofModalOpen && (
        <PaymentProofModal
          order={{
            id: orderId,
            uuid: orderId,
            grand_total: totalPaid,
            status: "pending_payment",
            date: "",
            items: [],
            payment: orderState?.paymentMethod
              ? {
                  payment_method: orderState.paymentMethod.name,
                  payment_status: "pending",
                  sender_bank:
                    orderState.paymentMethod.bank_name ||
                    orderState.paymentMethod.name,
                  amount_paid: totalPaid,
                }
              : undefined,
          }}
          onClose={() => setIsProofModalOpen(false)}
          onSubmitted={() => {
            setIsProofModalOpen(false);
            setIsProofSubmitted(true);
            showToast("Bukti pembayaran berhasil diunggah! Menunggu verifikasi admin.");
          }}
        />
      )}
    </div>
  );
}
