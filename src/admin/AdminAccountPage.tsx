import { useState } from "react";
import { Pagination } from "@/components/ui/pagination";

interface AccountRow {
  id: number;
  name: string;
  phone: string;
  address: string;
  email: string;
}

const ACCOUNTS: AccountRow[] = Array.from({ length: 34 }, (_, i) => ({
  id: i + 1,
  name: `Pelanggan ${i + 1}`,
  phone: `0812${(3000000 + i).toString().slice(-7)}`,
  address: `Jl. Contoh Alamat No. ${i + 1}, Jakarta Selatan, DKI Jakarta`,
  email: `pelanggan${i + 1}@email.com`,
}));

const PAGE_SIZE = 10;

export default function AdminAccountPage() {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(ACCOUNTS.length / PAGE_SIZE);
  const startIndex = (page - 1) * PAGE_SIZE;
  const rows = ACCOUNTS.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div>
      <h1 className="text-2xl font-bold text-text">Akun Terdaftar</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Total {ACCOUNTS.length} akun customer terdaftar di marketplace.
      </p>

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-background">
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-text">
                  Nama
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-text">
                  Nomor Telepon
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-text">
                  Alamat Rumah
                </th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-text">
                  Alamat Email
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-background">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-text">
                    {row.name}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                    {row.phone}
                  </td>
                  <td className="min-w-[280px] px-4 py-3 text-text-secondary">
                    {row.address}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-text-secondary">
                    {row.email}
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
