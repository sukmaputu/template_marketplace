import { Link } from "react-router-dom";
import { Home, MoveLeft } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-background)] px-6 py-24 text-center">
      <div className="relative">
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[12rem] font-black text-[color:var(--color-primary)] opacity-[0.03] select-none">
          404
        </h1>

        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-[color:var(--color-text)] sm:text-5xl">
            Halaman Tidak Ditemukan
          </h2>
          <p className="mx-auto max-w-md text-base leading-7 text-[color:var(--color-text-secondary)]">
            Maaf, kami tidak dapat menemukan halaman yang Anda cari. Mungkin
            tautan tersebut rusak atau halaman telah dipindahkan.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--color-primary)] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 sm:w-auto transition-all">
              <Home className="h-4 w-4" />
              Kembali ke Beranda
            </Link>

            <button
              onClick={() => window.history.back()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-6 py-3 text-sm font-semibold text-[color:var(--color-text)] hover:bg-[color:var(--color-background)] sm:w-auto transition-all">
              <MoveLeft className="h-4 w-4" />
              Halaman Sebelumnya
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
