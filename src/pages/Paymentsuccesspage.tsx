import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { ArrowRight, Download } from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { MarketplaceFooter } from "@/components/MarketplaceFooter";
import { ProductCard } from "@/components/ProductCard";
import { ProductQuickViewModal } from "@/components/Productquickviewmodal";
import {
  InvoiceDocument,
  type InvoiceItem,
  type InvoiceCustomer,
} from "@/components/Invoicedocument";
import { PRODUCTS } from "@/lib/products";
import type { Product } from "@/lib/products";

const RECOMMENDATION_COUNT = 4;

function formatRupiah(value: number) {
  return `Rp${(value || 0).toLocaleString("id-ID")}`;
}

function pickRandomProducts(excludeIds: (string | number)[], count: number) {
  const pool = PRODUCTS.filter((p) => !excludeIds.includes(p.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export default function PaymentSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const orderState = location.state as
    | {
        totalPaid?: number;
        itemIds?: (string | number)[];
        orderId?: string;
        items?: InvoiceItem[];
        subtotal?: number;
        packagingFee?: number;
        customer?: InvoiceCustomer;
      }
    | undefined;

  const totalPaid = orderState?.totalPaid ?? 0;
  const invoiceItems = orderState?.items ?? [];
  const invoiceSubtotal = orderState?.subtotal ?? 0;
  const invoicePackagingFee = orderState?.packagingFee ?? 0;

  const extraFees = totalPaid - (invoiceSubtotal + invoicePackagingFee);

  const invoiceCustomer = orderState?.customer ?? {
    name: "-",
    email: "-",
    phone: "-",
  };

  const [orderId] = useState(
    () => orderState?.orderId ?? `INV-M-${Date.now()}`,
  );

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
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center rounded-xl border border-border bg-surface px-6 py-12 text-center">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className="relative flex h-20 w-20 items-center justify-center rounded-full bg-secondary">
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

            <motion.span
              className="absolute inset-0 rounded-full border-2 border-secondary"
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
            Pembayaran Berhasil!
          </motion.h1>

          <motion.p
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="mt-2 max-w-sm text-sm text-text-secondary">
            Terima kasih! Pesananmu sudah kami terima dan sedang diproses.
            Detail pesanan bisa dilihat di halaman profil kamu.
          </motion.p>

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
              <span className="text-text-secondary">Total Dibayar</span>
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
                  packagingFee={invoicePackagingFee + extraFees}
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
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <MarketplaceFooter />

      <ProductQuickViewModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />
    </div>
  );
}
