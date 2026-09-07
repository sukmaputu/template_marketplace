import type { Product } from "@/lib/products";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "processing"
  | "shipping"
  | "completed"
  | "cancelled"
  | "refunded";

export const ORDER_STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    filterLabel: string;
    badgeClassName: string;

    showInFilter?: boolean;
  }
> = {
  pending_payment: {
    label: "Belum Bayar",
    filterLabel: "Belum Bayar",
    badgeClassName: "bg-destructive/15 text-destructive",
    showInFilter: true,
  },
  paid: {
    label: "Sudah Dibayar",
    filterLabel: "Dibayar",
    badgeClassName: "bg-secondary/15 text-secondary",
    showInFilter: false,
  },
  processing: {
    label: "Perlu Dikirim",
    filterLabel: "Diproses",
    badgeClassName: "bg-accent/15 text-accent",
    showInFilter: true,
  },
  shipping: {
    label: "Sedang Dikirim",
    filterLabel: "Dikirim",
    badgeClassName: "bg-primary/15 text-primary",
    showInFilter: true,
  },
  completed: {
    label: "Selesai",
    filterLabel: "Selesai",
    badgeClassName: "bg-secondary/15 text-secondary",
    showInFilter: true,
  },
  cancelled: {
    label: "Dibatalkan",
    filterLabel: "Dibatalkan",
    badgeClassName: "bg-destructive/10 text-destructive",
    showInFilter: true,
  },
  refunded: {
    label: "Dikembalikan",
    filterLabel: "Refund",
    badgeClassName: "bg-destructive/10 text-destructive",
    showInFilter: true,
  },
};

export interface OrderItem {
  id: string;
  productId?: string;
  product_name_snapshot: string;
  variant_name_snapshot: string;
  unit_price: number;
  quantity: number;
  image?: string;
}

export interface TrackingStep {
  title: string;
  description: string;
  time: string;
  completed: boolean;
}

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface Order {
  id: string;
  status: OrderStatus;
  date: string;
  grand_total: number;
  items: OrderItem[];
  cancelDeadline?: string;
  refundDeadline?: string;
  courierName?: string;
  trackingNumber?: string;
  trackingTimeline?: TrackingStep[];
  shippingAddress?: ShippingAddress;
  estimatedDelivery?: string;
  refundReason?: string;
  refundNote?: string;
}

export const REFUND_REASONS = [
  "Produk/akses tidak sesuai deskripsi",
  "Tidak jadi digunakan",
  "Masalah teknis, tidak bisa diakses",
  "Salah beli",
  "Alasan lainnya",
] as const;

export type TabKey = "data-diri" | "riwayat-pembelian" | "voucher" | "wishlist";

export type VoucherStatus = "aktif" | "terpakai" | "kadaluarsa";

export interface Voucher {
  id: string;
  code: string;
  title: string;
  discount_label: string;
  discount_amount?: number;
  min_purchase?: string;
  min_purchase_amount?: number;
  expires_at: string;
  status: VoucherStatus;
}

export interface WishlistItem {
  id: string;
  product: Product;
  added_at?: string;
}
