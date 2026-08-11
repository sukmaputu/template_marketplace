import { X } from "lucide-react";
import { useEffect, useState } from "react";

interface PromoModalProps {
  onClose: () => void;
}

export function PromoModal({ onClose }: PromoModalProps) {
  const [isAnimate, setIsAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className={`relative w-full max-w-md overflow-hidden border border-border bg-surface p-6 shadow-xl transition-all duration-500 ${
          isAnimate ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}>
        {/* Header Modal - Menggunakan variabel warna project */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">
            Promo Spesial <span className="inline-block">🔥</span>
          </h2>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Kotak Abu-abu Pengganti Gambar (Tanpa Rounded) */}
        <div className="relative flex aspect-[4/5] w-full items-center justify-center bg-gray-200 dark:bg-gray-800">
          <p className="text-sm font-medium text-gray-400 dark:text-gray-600">
            Tempat Gambar Promo
          </p>

          {/* Contoh jika nanti ingin pakai <img> tinggal hapus p di atas dan pakai ini: */}
          {/* <img
            src="/promo-banner.png"
            alt="Promo"
            className="h-full w-full object-cover"
          /> */}
        </div>
      </div>
    </div>
  );
}
