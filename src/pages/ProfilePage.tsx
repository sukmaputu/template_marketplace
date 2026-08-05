import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Package, Phone, User } from "lucide-react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";

type TabKey = "data-diri" | "riwayat-pembelian";

interface OrderItem {
  id: string | number;
  productName: string;
  variant: string;
  image?: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  quantity: number;
}

interface Order {
  id: string | number;
  status: "Selesai" | "Dikirim" | "Diproses" | "Dibatalkan";
  date: string;
  items: OrderItem[];
}

const ORDERS: Order[] = [
  {
    id: "ORD-001",
    status: "Selesai",
    date: "12 Juli 2026",
    items: [
      {
        id: 1,
        productName: "Pelatihan Design Grafis",
        variant: "Begineer",
        price: 85000,
        originalPrice: 169000,
        discountPercent: 50,
        quantity: 2,
      },
    ],
  },
  {
    id: "ORD-002",
    status: "Dikirim",
    date: "20 Juli 2026",
    items: [
      {
        id: 2,
        productName: "UI/UX Mastery",
        variant: "Advance",
        price: 250000,
        quantity: 1,
      },
    ],
  },
];

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function statusBadgeClass(status: Order["status"]) {
  switch (status) {
    case "Selesai":
      return "bg-secondary/15 text-secondary";
    case "Dikirim":
      return "bg-primary/15 text-primary";
    case "Diproses":
      return "bg-accent/15 text-accent";
    case "Dibatalkan":
      return "bg-red-100 text-red-600";
  }
}

function OrderCard({ order }: { order: Order }) {
  const total = order.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <span className="text-xs text-text-secondary">Pesanan #{order.id}</span>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(
            order.status,
          )}`}>
          {order.status}
        </span>
      </div>

      <div className="divide-y divide-border">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-4 px-4 py-3">
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-background">
              {item.discountPercent ? (
                <span className="absolute left-0 top-0 rounded-br-md bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {item.discountPercent}%
                </span>
              ) : null}
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.productName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <Package className="h-6 w-6 text-text-secondary" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-text">
                {item.productName}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {item.variant}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-text">
                {formatRupiah(item.price)}
              </p>
              {item.originalPrice ? (
                <p className="text-xs text-text-secondary line-through">
                  {formatRupiah(item.originalPrice)}
                </p>
              ) : null}
              <p className="mt-0.5 text-xs text-text-secondary">
                x{item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-text-secondary">{order.date}</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-text-secondary">
            Total{" "}
            <span className="font-semibold text-text">
              {formatRupiah(total)}
            </span>
          </span>
          <button className="rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-white hover:opacity-90">
            Beli Lagi
          </button>
        </div>
      </div>
    </div>
  );
}

function DataDiriTab() {
  const fields = [
    { label: "Nama", value: "I Putu Sukma", icon: User },
    { label: "No. Telepon", value: "+62 812 3456 7890", icon: Phone },
    {
      label: "Alamat Rumah",
      value: "Jl. Contoh Alamat No. 123, Jakarta Selatan",
      icon: MapPin,
    },
    { label: "Alamat Email", value: "sukma@email.com", icon: Mail },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-text">Data Diri</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Informasi pribadi yang digunakan untuk transaksi dan pengiriman.
      </p>

      <div className="mt-6 space-y-5">
        {fields.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-background">
              <Icon className="h-4 w-4 text-text-secondary" />
            </span>
            <div>
              <p className="text-xs text-text-secondary">{label}</p>
              <p className="text-sm font-medium text-text">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <button className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
        Edit Data Diri
      </button>
    </div>
  );
}

function RiwayatPembelianTab() {
  if (ORDERS.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-10 text-center">
        <p className="text-sm text-text-secondary">
          Belum ada riwayat pembelian.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {ORDERS.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("data-diri");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "data-diri", label: "Data Diri" },
    { key: "riwayat-pembelian", label: "Riwayat Pembelian" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <div className="flex flex-col gap-6 lg:flex-row">
          <aside className="w-full shrink-0 lg:w-64">
            <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-6">
              <div className="flex flex-col items-center text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white">
                  <User className="h-8 w-8" />
                </span>
                <p className="mt-3 text-sm font-semibold text-text">
                  I Putu Sukma
                </p>
                <p className="text-xs text-text-secondary">sukma@email.com</p>
              </div>

              <nav className="mt-6 space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      activeTab === tab.key
                        ? "bg-primary/10 text-primary"
                        : "text-text-secondary hover:bg-background"
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          <div className="flex-1">
            {activeTab === "data-diri" ? (
              <DataDiriTab />
            ) : (
              <RiwayatPembelianTab />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
