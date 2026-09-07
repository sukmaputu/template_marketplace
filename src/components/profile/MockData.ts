import type { Order, OrderStatus } from "./types";
import { PRODUCTS, type Product } from "@/lib/products";

const DEFAULT_SCHEDULES = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const DEFAULT_LEVELS = ["Pemula", "Menengah", "Tingkat Lanjut"];

function createOrderItem(orderId: string, product: Product, variant: string) {
  return {
    id: `${orderId}-item-1`,
    product_name_snapshot: product.name,
    variant_name_snapshot: variant,
    unit_price: product.basePrice,
    quantity: 1,
    image: product.image,
  };
}

export const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-2026-001",
    status: "processing",
    date: "21 Agu 2026 14:30",
    grand_total: 50000,
    cancelDeadline: new Date(Date.now() + 1000 * 60 * 74).toISOString(),
    courierName: "SPX Express Standard",
    trackingNumber: "SPXID09823411",
    estimatedDelivery: "23-25 Agu 2026",
    shippingAddress: {
      recipientName: "Budi Santoso",
      phone: "0812-3456-7890",
      addressLine: "Jl. Merdeka No. 12, RT 03/RW 05",
      city: "Jakarta Selatan",
      province: "DKI Jakarta",
      postalCode: "12345",
    },
    items: [
      createOrderItem(
        "ORD-2026-001",
        PRODUCTS[0],
        `${DEFAULT_SCHEDULES[0]} • ${DEFAULT_LEVELS[0]}`,
      ),
    ],
    trackingTimeline: [
      {
        title: "Pesanan Dikonfirmasi",
        description: "Penjual sedang menyiapkan pesanan Anda",
        time: "21 Agu 2026 14:35",
        completed: true,
      },
      {
        title: "Menunggu Penyerahan ke Kurir",
        description: "Kurir akan menjemput paket dalam 2-4 jam",
        time: "21 Agu 2026 15:00",
        completed: false,
      },
    ],
  },
  {
    id: "ORD-2026-002",
    status: "shipping",
    date: "20 Agu 2026 09:12",
    grand_total: 120000,
    courierName: "J&T Regular",
    trackingNumber: "JT8829103948",
    estimatedDelivery: "22 Agu 2026",
    shippingAddress: {
      recipientName: "Siti Aminah",
      phone: "0821-9988-7766",
      addressLine: "Jl. Kebon Jeruk No. 45",
      city: "Jakarta Barat",
      province: "DKI Jakarta",
      postalCode: "11530",
    },
    items: [
      createOrderItem(
        "ORD-2026-002",
        PRODUCTS[2],
        `${DEFAULT_SCHEDULES[1]} • ${DEFAULT_LEVELS[1]}`,
      ),
    ],
    trackingTimeline: [
      {
        title: "Paket Sedang Diantar",
        description:
          "Kurir sedang menuju alamat penerima (Siti - Jakarta Barat)",
        time: "21 Agu 2026 08:30",
        completed: true,
      },
      {
        title: "Paket Telah Diterima di Hub Transit",
        description: "Jakarta Barat Distribution Center",
        time: "20 Agu 2026 21:00",
        completed: true,
      },
      {
        title: "Pesanan Dikirim",
        description: "Paket telah diserahkan ke J&T",
        time: "20 Agu 2026 13:00",
        completed: true,
      },
    ],
  },
  {
    id: "ORD-2026-003",
    status: "pending_payment",
    date: "21 Agu 2026 19:10",
    grand_total: 100000,
    cancelDeadline: new Date(Date.now() + 1000 * 60 * 1).toISOString(),
    items: [
      createOrderItem(
        "ORD-2026-003",
        PRODUCTS[1],
        `${DEFAULT_SCHEDULES[2]} • ${DEFAULT_LEVELS[2]}`,
      ),
    ],
  },
  ...[
    PRODUCTS[3],
    PRODUCTS[4],
    PRODUCTS[5],
    PRODUCTS[6],
    PRODUCTS[7],
    PRODUCTS[8],
    PRODUCTS[12],
    PRODUCTS[13],
    PRODUCTS[15],
  ].map((product, idx) => {
    const orderId = `ORD-2026-00${idx + 4}`;
    return {
      id: orderId,
      status: "completed" as OrderStatus,
      date: `${10 - idx} Agu 2026`,
      grand_total: product.basePrice,
      refundDeadline: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * (idx < 2 ? 1 : -1),
      ).toISOString(),
      items: [
        createOrderItem(
          orderId,
          product,
          `${DEFAULT_SCHEDULES[idx % DEFAULT_SCHEDULES.length]} • ${
            DEFAULT_LEVELS[idx % DEFAULT_LEVELS.length]
          }`,
        ),
      ],
    };
  }),
];
