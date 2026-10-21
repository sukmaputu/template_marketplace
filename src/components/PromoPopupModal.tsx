import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { usePageSettings } from "@/hooks/usePageSettings";

export function PromoPopupModal() {
  const { popupBanner, popupBannerLink, isPopupEnabled } = usePageSettings();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!popupBanner || !isPopupEnabled) {
      setIsOpen(false);
      return;
    }
    const isClosed = sessionStorage.getItem("marketplace_promo_popup_closed");
    if (!isClosed) {
      // Delay slightly for smooth entrance after initial page load
      const timer = setTimeout(() => setIsOpen(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [popupBanner, isPopupEnabled]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("marketplace_promo_popup_closed", "true");
  };

  if (!isOpen || !popupBanner || !isPopupEnabled) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm transition-opacity duration-300"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-w-lg w-full overflow-hidden rounded-2xl bg-[color:var(--color-surface)] border border-[color:var(--color-border)] shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition hover:bg-black/80"
          aria-label="Tutup"
        >
          <X className="size-4.5" />
        </button>

        {/* Promo Image (Clickable) */}
        <a
          href={popupBannerLink}
          onClick={handleClose}
          className="block relative aspect-[4/3] sm:aspect-[16/10] w-full overflow-hidden bg-black/10 cursor-pointer group"
        >
          <img
            src={popupBanner}
            alt="Promo Spesial"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-102"
          />
        </a>

        {/* Footer Action */}
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3 bg-[color:var(--color-surface)]">
          <div className="flex items-center gap-1.5 text-xs text-[color:var(--color-text-secondary)]">
            <Sparkles className="size-3.5 text-amber-500" />
            <span>Penawaran Terbatas</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-hover)] transition"
            >
              Nanti Saja
            </button>
            <a
              href={popupBannerLink}
              onClick={handleClose}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[color:var(--color-primary)] text-white hover:opacity-90 shadow-sm transition"
            >
              Lihat Promo
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
