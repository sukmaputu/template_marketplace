import type { Order, OrderStatus } from "./types";

export const MOCK_ORDERS: Order[] = [
  {
    id: "ORD-2026-001",
    status: "processing",
    date: "21 Agu 2026 14:30",
    grand_total: 50000,
    cancelDeadline: new Date(Date.now() + 1000 * 60 * 74).toISOString(),
    courierName: "SPX Express Standard",
    trackingNumber: "SPXID09823411",
    items: [
      {
        id: "ORD-2026-001-item-1",
        product_name_snapshot: "Pelatihan Desain Grafis",
        variant_name_snapshot: "Full Course Access",
        unit_price: 50000,
        quantity: 1,
      },
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
    status: "shipped",
    date: "20 Agu 2026 09:12",
    grand_total: 120000,
    courierName: "J&T Regular",
    trackingNumber: "JT8829103948",
    items: [
      {
        id: "ORD-2026-002-item-1",
        product_name_snapshot: "Kelas UI/UX Design Sprint",
        variant_name_snapshot: "Pro Plan",
        unit_price: 120000,
        quantity: 1,
      },
    ],
    trackingTimeline: [
      {
        title: "Paket Sedang Diantar",
        description:
          "Kurir sedang menuju alamat penerima (Budi - Jakarta Selatan)",
        time: "21 Agu 2026 08:30",
        completed: true,
      },
      {
        title: "Paket Telah Diterima di Hub Transit",
        description: "Jakarta Selatan Distribution Center",
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
      {
        id: "ORD-2026-003-item-1",
        product_name_snapshot: "Pelatihan Power BI Data Analyst",
        variant_name_snapshot: "Video Mentoring",
        unit_price: 100000,
        quantity: 1,
      },
    ],
  },
  ...[
    { name: "Manajemen Pajak", price: 90000 },
    { name: "RAB (Rencana Anggaran Biaya)", price: 110000 },
    { name: "Akuntansi Dasar untuk Bisnis", price: 85000 },
    { name: "Perencanaan Keuangan Pribadi", price: 75000 },
    { name: "Analisis Laporan Keuangan", price: 130000 },
    { name: "Manajemen Asuransi", price: 95000 },
    { name: "Gambar Teknik", price: 115000 },
    { name: "Dasar Mekanika Mesin", price: 100000 },
    { name: "Pengantar CNC dan Manufaktur", price: 150000 },
  ].map((prod, idx) => {
    const orderId = `ORD-2026-00${idx + 4}`;
    return {
      id: orderId,
      status: "completed" as OrderStatus,
      date: `${10 - idx} Agu 2026`,
      grand_total: prod.price,
      refundDeadline: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * (idx < 2 ? 1 : -1),
      ).toISOString(),
      items: [
        {
          id: `${orderId}-item-1`,
          product_name_snapshot: prod.name,
          variant_name_snapshot: "Digital License",
          unit_price: prod.price,
          quantity: 1,
        },
      ],
    };
  }),
];
