import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Package, Star, X } from "lucide-react";
import type { Order, OrderStatus } from "./types";
import { ORDER_STATUS_CONFIG } from "./types";
import { MOCK_ORDERS } from "./MockData";
import { OrderCard } from "./OrderCard";
import { TrackingModal } from "./TrackingModal";
import { RefundModal } from "./RefundModal";
import { ConfirmModal } from "./ConfirmModal";
import { getStoredOrders } from "@/lib/orderHistory";
import { showToast } from "@/lib/toast";

type FilterKey = "ALL" | OrderStatus;

export function RiwayatPembelianTab() {
  const [orders, setOrders] = useState<Order[]>(() => [
    ...getStoredOrders(),
    ...MOCK_ORDERS,
  ]);
  const [selectedStatus, setSelectedStatus] = useState<FilterKey>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedOrderForTracking, setSelectedOrderForTracking] =
    useState<Order | null>(null);
  const [selectedOrderForRefund, setSelectedOrderForRefund] =
    useState<Order | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] =
    useState<Order | null>(null);
  const [selectedOrderForReview, setSelectedOrderForReview] =
    useState<Order | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    const refreshOrders = () => {
      setOrders([...getStoredOrders(), ...MOCK_ORDERS]);
    };

    window.addEventListener("order-history-updated", refreshOrders);
    return () =>
      window.removeEventListener("order-history-updated", refreshOrders);
  }, []);

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: "ALL", label: "Semua" },
    ...(
      Object.entries(ORDER_STATUS_CONFIG) as [
        OrderStatus,
        (typeof ORDER_STATUS_CONFIG)[OrderStatus],
      ][]
    )
      .filter(([, config]) => config.showInFilter !== false)
      .map(([status, config]) => ({
        key: status,
        label: config.filterLabel,
      })),
  ];

  const filteredOrders = orders.filter((order) => {
    if (selectedStatus === "ALL") return true;
    return order.status === selectedStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedOrders = filteredOrders.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const handleFilterChange = (status: FilterKey) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  const handleMarkReceived = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "completed" } : o)),
    );
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "cancelled" } : o)),
    );
    setSelectedOrderForCancel(null);
  };

  const handleRefundSubmit = (
    orderId: string,
    reason: string,
    note: string,
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, refundReason: reason, refundNote: note } : o,
      ),
    );
  };

  const handleSubmitReview = () => {
    if (!selectedOrderForReview) return;

    const orderItems = selectedOrderForReview.items ?? [];
    const validItems = orderItems.filter(
      (item) => item.productId || item.product_name_snapshot,
    );

    if (!validItems.length) return;

    const productId =
      validItems[0].productId ?? validItems[0].product_name_snapshot;
    const reviewPayload = {
      id: `review-${selectedOrderForReview.id}-${Date.now()}`,
      productId: String(productId),
      userName: "Anda",
      rating: reviewRating,
      comment: reviewComment.trim() || "Produk sangat bagus.",
      createdAt: new Date().toISOString(),
    };

    const existing = JSON.parse(
      window.localStorage.getItem("marketplace-product-reviews") ?? "[]",
    ) as Array<Record<string, unknown>>;

    const nextReviews = [
      reviewPayload,
      ...existing.filter((item) => {
        const itemProductId = String(item.productId ?? "");
        return (
          itemProductId !== String(reviewPayload.productId) ||
          item.userName !== "Anda"
        );
      }),
    ];

    window.localStorage.setItem(
      "marketplace-product-reviews",
      JSON.stringify(nextReviews),
    );
    window.dispatchEvent(new Event("product-reviews-updated"));
    showToast("Ulasan berhasil dikirim");

    setSelectedOrderForReview(null);
    setReviewComment("");
    setReviewRating(5);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-surface p-1.5">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-4 sm:py-2 sm:text-xs ${
              selectedStatus === tab.key
                ? "bg-primary text-white"
                : "text-text-secondary hover:bg-background hover:text-text"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {paginatedOrders.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-12 text-center">
          <Package className="mx-auto h-10 w-10 text-text-secondary/60 mb-2" />
          <p className="text-sm font-medium text-text">Belum ada pesanan</p>
          <p className="text-xs text-text-secondary mt-1">
            Pesanan pada kategori ini belum ditemukan.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onTrackClick={(ord) => setSelectedOrderForTracking(ord)}
              onMarkReceived={handleMarkReceived}
              onCancelClick={(ord) => setSelectedOrderForCancel(ord)}
              onRefundClick={(ord) => setSelectedOrderForRefund(ord)}
              onReviewClick={(ord) => setSelectedOrderForReview(ord)}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-text-secondary">
            Menampilkan{" "}
            <span className="font-semibold text-text">{startIndex + 1}</span> -{" "}
            <span className="font-semibold text-text">
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredOrders.length)}
            </span>{" "}
            dari{" "}
            <span className="font-semibold text-text">
              {filteredOrders.length}
            </span>{" "}
            pesanan
          </p>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background disabled:opacity-40 disabled:pointer-events-none">
              <ChevronLeft className="h-4 w-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors ${
                    currentPage === pageNum
                      ? "bg-primary text-white"
                      : "border border-border text-text hover:bg-background"
                  }`}>
                  {pageNum}
                </button>
              ),
            )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-text-secondary hover:bg-background disabled:opacity-40 disabled:pointer-events-none">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {selectedOrderForTracking && (
        <TrackingModal
          order={selectedOrderForTracking}
          onClose={() => setSelectedOrderForTracking(null)}
        />
      )}

      {selectedOrderForRefund && (
        <RefundModal
          order={selectedOrderForRefund}
          onClose={() => setSelectedOrderForRefund(null)}
          onSubmit={handleRefundSubmit}
        />
      )}

      {selectedOrderForCancel && (
        <ConfirmModal
          title="Batalkan Pesanan"
          message="Apakah tidak jadi melakukan pembelian?"
          confirmLabel="Ya"
          cancelLabel="Tidak"
          onClose={() => setSelectedOrderForCancel(null)}
          onConfirm={() => handleCancelOrder(selectedOrderForCancel.id)}
        />
      )}

      {selectedOrderForReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text">
                Beri Ulasan Produk
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrderForReview(null)}
                className="rounded-lg p-1 text-text-secondary hover:bg-background hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-text-secondary">Produk</p>
              <p className="mt-1 text-sm font-medium text-text">
                {selectedOrderForReview.items?.[0]?.product_name_snapshot ??
                  "Produk pesanan"}
              </p>
            </div>

            <div className="mt-4">
              <p className="text-sm text-text-secondary">Rating</p>
              <div className="mt-2 flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    aria-label={`Beri rating ${star}`}
                    className="text-2xl transition-transform hover:scale-110">
                    <Star
                      className={`h-7 w-7 ${
                        star <= reviewRating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm text-text-secondary">Review</label>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                placeholder="Ceritakan pengalaman kamu membeli produk ini..."
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrderForReview(null)}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text hover:bg-background">
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90">
                Simpan Ulasan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
