import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, Package, Phone, User, AtSign } from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { ProfileSkeleton } from "@/components/skeleton/ProfileSkeleton";
import { useAuth } from "@/components/auth/UseAuth";

type TabKey = "data-diri" | "riwayat-pembelian";

interface OrderItem {
  id: string | number;
  product_name_snapshot: string;
  variant_name_snapshot: string;
  unit_price: number;
  quantity: number;
  image?: string;
}

interface Order {
  id: string | number;
  status: "PENDING" | "PAID" | "SHIPPED" | "COMPLETED" | "CANCELLED";
  date: string;
  grand_total: number;
  items: OrderItem[];
}

const ORDERS: Order[] = [
  {
    id: "ORD-001",
    status: "COMPLETED",
    date: "12 Juli 2026",
    grand_total: 170000,
    items: [
      {
        id: 1,
        product_name_snapshot: "Pelatihan Design Grafis",
        variant_name_snapshot: "Beginner",
        unit_price: 85000,
        quantity: 2,
      },
    ],
  },
  {
    id: "ORD-002",
    status: "SHIPPED",
    date: "20 Juli 2026",
    grand_total: 250000,
    items: [
      {
        id: 2,
        product_name_snapshot: "UI/UX Mastery",
        variant_name_snapshot: "Advance",
        unit_price: 250000,
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
    case "COMPLETED":
      return "bg-secondary/15 text-secondary";
    case "SHIPPED":
      return "bg-primary/15 text-primary";
    case "PAID":
    case "PENDING":
      return "bg-accent/15 text-accent";
    case "CANCELLED":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function OrderCard({ order }: { order: Order }) {
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
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-background border border-border">
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.product_name_snapshot}
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
                {item.product_name_snapshot}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {item.variant_name_snapshot}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-text">
                {formatRupiah(item.unit_price)}
              </p>
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
              {formatRupiah(order.grand_total)}
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
  const { user } = useAuth();

  const fields = [
    { label: "Nama Lengkap", value: user?.full_name, icon: User },
    {
      label: "Username",
      value: user?.username || "Belum diatur",
      icon: AtSign,
    },
    { label: "No. Telepon", value: user?.phone || "Belum diatur", icon: Phone },
    { label: "Alamat Email", value: user?.email, icon: Mail },
  ];

  return (
    <div className="rounded-xl border border-border bg-surface p-6">
      <h2 className="text-base font-semibold text-text">Data Diri</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Informasi pribadi akun Anda sesuai data sistem.
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
        Edit Profil
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
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("data-diri");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

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

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="flex flex-col gap-6 lg:flex-row">
            <aside className="w-full shrink-0 lg:w-64">
              <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-6">
                <div className="flex flex-col items-center text-center">
                  <span className="flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white">
                    <User className="h-8 w-8" />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-text">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-text-secondary">{user?.email}</p>
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
        )}
      </div>
    </div>
  );
}
