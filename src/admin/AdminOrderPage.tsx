import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";

interface OrderRow {
  id: number;
  productName: string;
  quantity: number;
  buyerName: string;
  address: string;
  totalPrice: number;
  status: "Complete" | "Pending";
}

// Contoh data — ganti dengan data dari API kamu
const ORDERS: OrderRow[] = Array.from({ length: 27 }, (_, i) => ({
  id: i + 1,
  productName:
    i % 2 === 0 ? "Pelatihan Desain Grafis" : "Pelatihan Power BI Data Analyst",
  quantity: (i % 3) + 1,
  buyerName: `Pelanggan ${i + 1}`,
  address: `Jl. Contoh Alamat No. ${i + 1}, Jakarta Selatan`,
  totalPrice: (i % 2 === 0 ? 50000 : 100000) * ((i % 3) + 1),
  status: i % 3 === 0 ? "Pending" : "Complete",
}));

const PAGE_SIZE = 10;

function formatRupiah(value: number) {
  return `Rp${value.toLocaleString("id-ID")}`;
}

export default function AdminOrderPage() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(ORDERS.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const rows = ORDERS.slice(startIndex, startIndex + PAGE_SIZE);

  const totalOrders = ORDERS.length;
  const totalRevenue = ORDERS.reduce((sum, o) => sum + o.totalPrice, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">Pesanan</h1>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Jumlah Pesanan</p>
          <p className="mt-1 text-2xl font-bold text-text">{totalOrders}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <p className="text-sm text-text-secondary">Total Pendapatan</p>
          <p className="mt-1 text-2xl font-bold text-primary">
            {formatRupiah(totalRevenue)}
          </p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-text">
                  Nama Produk
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-text">
                  Jumlah
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-text">
                  Pemesan
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-text">
                  Alamat Rumah
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-text">
                  Total Harga
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-text">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-background">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-text">
                    {row.productName}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                    {row.quantity}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                    {row.buyerName}
                  </td>
                  <td className="min-w-[240px] px-4 py-3 text-text-secondary">
                    {row.address}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-text">
                    {formatRupiah(row.totalPrice)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        row.status === "Complete"
                          ? "bg-secondary/15 text-secondary"
                          : "bg-accent/15 text-accent"
                      }`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
