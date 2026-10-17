import { Mail, Phone } from "lucide-react";
import { usePageSettings } from "@/hooks/usePageSettings";

export function MarketplaceFooter() {
  const year = new Date().getFullYear();
  const { contactEmail, contactPhone, navbarLogo, siteTitle, siteTagline } = usePageSettings();

  const safeEmail =
    contactEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())
      ? contactEmail.trim()
      : "";
  const cleanPhone = contactPhone ? contactPhone.replace(/[^0-9]/g, "") : "";
  const waUrl = cleanPhone
    ? cleanPhone.startsWith("0")
      ? `https://wa.me/62${cleanPhone.slice(1)}`
      : `https://wa.me/${cleanPhone}`
    : "#";

  return (
    <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src={navbarLogo || "/logo/logo_nadrical.png"}
                alt={siteTitle || "Nadrical"}
                className="h-8 w-auto object-contain"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/logo/logo_nadrical.png";
                }}
              />
              <span className="text-lg font-bold tracking-tight text-[color:var(--color-text-primary)]">
                {siteTitle || "Nadrical"}
              </span>
            </div>
            <p className="max-w-md text-sm text-[color:var(--color-text-secondary)] leading-relaxed">
              {siteTagline ||
                "Solusi e-commerce terpercaya untuk semua kebutuhan template, produk digital, dan gaya hidup Anda."}
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-secondary)]">
              Tautan Cepat
            </h4>
            <ul className="space-y-2 text-sm text-[color:var(--color-text-secondary)]">
              <li>
                <a
                  href="#catalog"
                  className="transition-colors hover:text-[color:var(--color-primary)]"
                >
                  Katalog Template
                </a>
              </li>
              <li>
                <a
                  href="/help"
                  className="transition-colors hover:text-[color:var(--color-primary)]"
                >
                  Pusat Bantuan & FAQ
                </a>
              </li>
              <li>
                <a
                  href="/cart"
                  className="transition-colors hover:text-[color:var(--color-primary)]"
                >
                  Keranjang Belanja
                </a>
              </li>
            </ul>
          </div>

          {/* Hubungi Kami */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-secondary)]">
              Hubungi Kami
            </h4>
            <ul className="space-y-2.5 text-sm text-[color:var(--color-text-secondary)]">
              {safeEmail && (
                <li>
                  <a
                    href={`mailto:${safeEmail}`}
                    className="flex items-center gap-2 transition-colors hover:text-[color:var(--color-primary)]"
                  >
                    <Mail className="size-4 shrink-0 text-[color:var(--color-primary)]" />
                    <span className="truncate">{safeEmail}</span>
                  </a>
                </li>
              )}
              {cleanPhone && (
                <li>
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 transition-colors hover:text-[color:var(--color-primary)]"
                  >
                    <Phone className="size-4 shrink-0 text-[color:var(--color-primary)]" />
                    <span>{contactPhone}</span>
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[color:var(--color-border)] pt-6 text-xs text-[color:var(--color-text-secondary)] sm:flex-row">
          <span>
            &copy; {year} {siteTitle || "Nadrical"}. Semua hak dilindungi.
          </span>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="hover:text-[color:var(--color-primary)] transition-colors"
            >
              Kebijakan Privasi
            </a>
            <a
              href="#"
              className="hover:text-[color:var(--color-primary)] transition-colors"
            >
              Syarat & Ketentuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
