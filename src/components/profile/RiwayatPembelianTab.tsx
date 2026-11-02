import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Package, Star, X } from "lucide-react";
import type { Order, OrderItem, OrderStatus } from "./types";
import { ORDER_STATUS_CONFIG } from "./types";
import { MOCK_ORDERS } from "./MockData";
import { OrderCard } from "./OrderCard";
import { TrackingModal } from "./TrackingModal";
import { RefundModal } from "./RefundModal";
import { ConfirmModal } from "./ConfirmModal";
import { PaymentProofModal } from "./PaymentProofModal";
import {
  fetchOrdersFromBackend,
  getStoredOrders,
  updateOrderStatusInBackend,
} from "@/lib/orderHistory";
import {
  fetchProductReviews,
  saveProductReview,
  submitProductReview,
  type ProductReview,
} from "@/lib/products";
import { saveOrder } from "@/lib/orderHistory";
import { showToast } from "@/lib/toast";
import { websocketService, type WSEvent } from "@/lib/websocket";
import { useAuth } from "@/components/auth/UseAuth";

type FilterKey = "ALL" | OrderStatus;

export function RiwayatPembelianTab() {
  const { user, refreshProfile } = useAuth();
  const [orders, setOrders] = useState<Order[]>(() => {
    const stored = getStoredOrders();
    return stored.length > 0 ? stored : user ? [] : MOCK_ORDERS;
  });
  const [selectedStatus, setSelectedStatus] = useState<FilterKey>("ALL");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedOrderForTracking, setSelectedOrderForTracking] =
    useState<Order | null>(null);
  const [selectedOrderForProof, setSelectedOrderForProof] =
    useState<Order | null>(null);
  const [selectedOrderForRefund, setSelectedOrderForRefund] =
    useState<Order | null>(null);
  const [selectedOrderForCancel, setSelectedOrderForCancel] =
    useState<Order | null>(null);
  const [selectedReview, setSelectedReview] = useState<{
    order: Order;
    item: OrderItem;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    let cancelled = false;

    async function loadOrders() {
      try {
        const fetched = await fetchOrdersFromBackend();
        if (!cancelled && fetched.length > 0) {
          const productIds = [
            ...new Set(
              fetched.flatMap((order) =>
                order.status === "completed"
                  ? order.items
                      .filter((item) => !item.review)
                      .map((item) => item.productId)
                      .filter((id): id is string => Boolean(id))
                  : [],
              ),
            ),
          ];
          const fetchedReviews = await Promise.all(
            productIds.map((productId) =>
              fetchProductReviews(productId, { limit: 100 }),
            ),
          );
          if (cancelled) return;

          const reviewsByOrderItem = new Map<string, ProductReview>();
          for (const result of fetchedReviews) {
            for (const review of result.items) {
              if (review.orderItemUuid) {
                reviewsByOrderItem.set(review.orderItemUuid, review);
              }
            }
          }

          setOrders(
            fetched.map((order) => ({
              ...order,
              items: order.items.map((item) => {
                if (item.review) return item;
                const review = reviewsByOrderItem.get(item.id);
                return review
                  ? {
                      ...item,
                      review: {
                        rating: review.rating,
                        comment: review.comment,
                        createdAt: review.createdAt,
                      },
                    }
                  : item;
              }),
            })),
          );
          return;
        }
      } catch {
        // ignore
      }
      if (!cancelled) {
        const stored = getStoredOrders();
        setOrders(user ? stored : stored.length > 0 ? stored : MOCK_ORDERS);
      }
    }

    loadOrders();

    const refreshOrders = () => {
      loadOrders();
    };

    window.addEventListener("order-history-updated", refreshOrders);
    window.addEventListener("focus", refreshOrders);

    const unsub1 = websocketService.on("order_updated", refreshOrders);
    const unsub2 = websocketService.on("order_status_updated", refreshOrders);
    const unsub3 = websocketService.on("data_updated", (payload: WSEvent) => {
      if (!payload || payload.resource === "orders" || payload.resource === "pesanan") {
        refreshOrders();
      }
    });

    return () => {
      cancelled = true;
      window.removeEventListener("order-history-updated", refreshOrders);
      window.removeEventListener("focus", refreshOrders);
      unsub1();
      unsub2();
      unsub3();
    };
  }, [user]);

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

  const handleMarkReceived = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    const targetId = target?.uuid || orderId;
    const updated = await updateOrderStatusInBackend(targetId, "COMPLETED");
    if (!updated) {
      showToast("Pesanan belum dapat diperbarui di server.");
      return;
    }
    const completedOrder: Order = { ...target, status: "completed" };
    setOrders((previous) =>
      previous.map((order) =>
        order.id === orderId ? completedOrder : order,
      ),
    );
    saveOrder(completedOrder);
    if (refreshProfile) {
      void refreshProfile();
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    const targetId = target?.uuid || orderId;
    const updated = await updateOrderStatusInBackend(targetId, "CANCELED");
    if (!updated) {
      showToast("Pesanan belum dapat dibatalkan di server.");
      return;
    }
    const cancelledOrder: Order = { ...target, status: "cancelled" };
    setOrders((previous) =>
      previous.map((order) =>
        order.id === orderId ? cancelledOrder : order,
      ),
    );
    saveOrder(cancelledOrder);
    setSelectedOrderForCancel(null);
  };

  const handleRefundSubmit = (
    orderId: string,
    reason: string,
    note: string,
    evidence: File[],
  ): boolean => {
    void orderId;
    void reason;
    void note;
    void evidence;
    return false;
  };

  const handleSubmitReview = async () => {
    if (!selectedReview || selectedReview.item.review) return;
    const { order, item } = selectedReview;
    if (!item.productId) {
      showToast("ID produk tidak tersedia, ulasan tidak dapat dikirim.");
      return;
    }
    if (item.id.startsWith("item-")) {
      showToast("ID item pesanan dari server tidak tersedia, ulasan belum dapat dikirim.");
      return;
    }

    const comment = reviewComment.trim();
    if (!comment) {
      showToast("Tulis ulasan terlebih dahulu.");
      return;
    }
    setIsSubmittingReview(true);
    try {
      await submitProductReview(String(item.productId), {
        rating: reviewRating,
        comment,
        order_item_uuid: item.id,
      });

      const createdAt = new Date().toISOString();
      const review: ProductReview = {
        id: `review-${order.id}-${item.id}`,
        productId: String(item.productId),
        orderItemUuid: item.id,
        userName: user?.full_name || "Anda",
        rating: reviewRating,
        comment,
        createdAt,
        isVerified: true,
      };
      saveProductReview(review);

      const updatedOrder: Order = {
        ...order,
        items: order.items.map((orderItem) =>
          orderItem.id === item.id
            ? {
                ...orderItem,
                review: { rating: review.rating, comment, createdAt },
              }
            : orderItem,
        ),
      };
      setOrders((previous) =>
        previous.map((candidate) =>
          candidate.id === updatedOrder.id ? updatedOrder : candidate,
        ),
      );
      saveOrder(updatedOrder);
      setSelectedReview({
        order: updatedOrder,
        item: { ...item, review: { rating: review.rating, comment, createdAt } },
      });
      showToast("Ulasan berhasil dikirim");
    } catch (error) {
      const apiError = error as {
        response?: { data?: { error?: string; message?: string } };
      };
      showToast(
        apiError.response?.data?.message ||
          apiError.response?.data?.error ||
          "Gagal mengirim ulasan. Silakan coba lagi.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-nowrap gap-1.5 overflow-x-auto rounded-xl border border-border bg-surface p-1.5">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition-colors sm:px-4 sm:py-2 sm:text-xs ${
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
              onUploadProofClick={(ord) => setSelectedOrderForProof(ord)}
              onMarkReceived={handleMarkReceived}
              onCancelClick={(ord) => setSelectedOrderForCancel(ord)}
              onRefundClick={(ord) => setSelectedOrderForRefund(ord)}
              onReviewClick={(ord, item) => {
                setSelectedReview({ order: ord, item });
                setReviewRating(item.review?.rating ?? 5);
                setReviewComment(item.review?.comment ?? "");
              }}
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

      {selectedOrderForProof && (
        <PaymentProofModal
          order={selectedOrderForProof}
          onClose={() => setSelectedOrderForProof(null)}
          onSubmitted={() => {
            setSelectedOrderForProof(null);
            window.dispatchEvent(new Event("order-history-updated"));
          }}
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

      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-text">
                {selectedReview.item.review
                  ? "Ulasan Produk"
                  : "Beri Ulasan Produk"}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="rounded-lg p-1 text-text-secondary hover:bg-background hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4">
              <p className="text-sm text-text-secondary">Produk</p>
              <p className="mt-1 text-sm font-medium text-text">
                {selectedReview.item.product_name_snapshot}
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
                    disabled={Boolean(selectedReview.item.review)}
                    aria-label={`Beri rating ${star}`}
                    className="text-2xl disabled:cursor-default">
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
                readOnly={Boolean(selectedReview.item.review)}
                rows={4}
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                placeholder="Ceritakan pengalaman kamu membeli produk ini..."
              />
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text hover:bg-background">
                Tutup
              </button>
              {!selectedReview.item.review && (
                <button
                  type="button"
                  onClick={() => void handleSubmitReview()}
                  disabled={isSubmittingReview || !reviewComment.trim()}
                  className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                  {isSubmittingReview ? "Mengirim..." : "Simpan Ulasan"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
