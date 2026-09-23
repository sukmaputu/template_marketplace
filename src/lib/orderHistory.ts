import type { Order, OrderStatus } from "@/components/profile/types";
import { api } from "@/lib/api";
import { websocketService } from "@/lib/websocket";

const ORDER_HISTORY_KEY = "marketplace-order-history";

interface BackendOrderItem {
  uuid?: string;
  product_uuid?: string;
  product_name_snapshot?: string;
  variant_name_snapshot?: string;
  unit_price?: number;
  price?: number;
  quantity?: number;
  product_image_snapshot?: string;
  product?: {
    image?: string;
    name?: string;
  };
}

interface BackendOrder {
  uuid?: string;
  order_number?: string;
  recipient_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  shipping_province?: string;
  shipping_courier?: string;
  tracking_number?: string;
  total?: number;
  order_status?: string;
  created_at?: string;
  placed_at?: string;
  paid_at?: string;
  order_items?: BackendOrderItem[];
}

function mapBackendStatus(status?: string, paidAt?: string | null): OrderStatus {
  const s = (status || "").toUpperCase();
  if (s === "COMPLETED") return "completed";
  if (s === "DELIVERING") return "shipping";
  if (s === "CANCELED") return "cancelled";
  if (s === "PROCESSING" || s === "WAITING_CONFIRMATION" || paidAt) return "processing";
  return "pending_payment";
}

function mapBackendOrder(bo: BackendOrder): Order {
  const status = mapBackendStatus(bo.order_status, bo.paid_at);
  const dateStr = bo.placed_at || bo.created_at || new Date().toISOString();
  let formattedDate: string;
  try {
    formattedDate = new Date(dateStr).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    formattedDate = dateStr;
  }

  return {
    id: bo.order_number || bo.uuid || "ORD",
    status,
    date: formattedDate,
    grand_total: Number(bo.total ?? 0),
    courierName: bo.shipping_courier,
    trackingNumber: bo.tracking_number,
    shippingAddress: {
      recipientName: bo.recipient_name ?? "",
      phone: bo.phone ?? "",
      addressLine: bo.address ?? "",
      city: bo.city ?? "",
      province: bo.shipping_province ?? "",
      postalCode: bo.postal_code ?? "",
    },
    items: (bo.order_items || []).map((item, idx) => ({
      id: item.uuid || `item-${idx}`,
      productId: item.product_uuid,
      product_name_snapshot:
        item.product_name_snapshot || item.product?.name || "Produk",
      variant_name_snapshot: item.variant_name_snapshot || "Standar",
      unit_price: Number(item.unit_price ?? item.price ?? 0),
      quantity: Number(item.quantity ?? 1),
      image: item.product_image_snapshot || item.product?.image || "",
    })),
  };
}

export function getStoredOrders(): Order[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.localStorage.getItem(ORDER_HISTORY_KEY);
    if (!value) return [];

    const orders = JSON.parse(value) as unknown;
    return Array.isArray(orders) ? (orders as Order[]) : [];
  } catch {
    return [];
  }
}

export function saveOrder(order: Order) {
  if (typeof window === "undefined") return;

  const orders = getStoredOrders().filter((item) => item.id !== order.id);
  const updatedOrders = [order, ...orders];
  window.localStorage.setItem(ORDER_HISTORY_KEY, JSON.stringify(updatedOrders));

  // 1. Dispatch DOM event for current page
  window.dispatchEvent(new Event("order-history-updated"));

  // 2. Broadcast to other tabs & other browsers via WebSocket + BroadcastChannel
  websocketService.broadcastLocal({
    type: "order_created",
    payload: order,
  });
}

export async function fetchOrdersFromBackend(): Promise<Order[]> {
  try {
    const res = await api.get("/ecommerce/orders", {
      params: { limit: 50 },
    });
    const items = res.data?.data;
    if (Array.isArray(items)) {
      const backendOrders = items.map(mapBackendOrder);
      const localOrders = getStoredOrders();

      // Merge backend orders with local orders without duplicating ID
      const seen = new Set<string>();
      const combined: Order[] = [];

      for (const bo of backendOrders) {
        if (!seen.has(bo.id)) {
          seen.add(bo.id);
          combined.push(bo);
        }
      }

      for (const lo of localOrders) {
        if (!seen.has(lo.id)) {
          seen.add(lo.id);
          combined.push(lo);
        }
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          ORDER_HISTORY_KEY,
          JSON.stringify(combined),
        );
      }
      return combined;
    }
  } catch {
    // Return stored orders on network failure or unauthorized
  }

  return getStoredOrders();
}
