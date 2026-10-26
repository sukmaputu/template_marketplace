import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { usePageSettings } from "@/hooks/usePageSettings";

const importantPages = [
  { label: "Bantuan & FAQ", to: "/help" },
  { label: "Keranjang Belanja", to: "/cart" },
  { label: "Pesan", to: "/message" },
  { label: "Profil", to: "/profile" },
];

export function MarketplaceFooter() {
  const year = new Date().getFullYear();
  const {
    contactEmail,
    contactPhone,
    contactAddress,
    navbarLogo,
    siteTitle,
    siteTagline,
    logoFooterMobileHeightPx,
    logoFooterDesktopHeightPx,
    logoMaxWidthPx,
  } = usePageSettings();

  const displayEmail = (contactEmail || "").trim();
  const displayPhone = (contactPhone || "").trim();
  const cleanPhone = displayPhone.replace(/[^0-9]/g, "");
  const waUrl = cleanPhone
    ? cleanPhone.startsWith("0")
      ? `https://wa.me/62${cleanPhone.slice(1)}`
      : cleanPhone.startsWith("62")
      ? `https://wa.me/${cleanPhone}`
      : `https://wa.me/${cleanPhone}`
    : "";
  const displayAddress =
    (contactAddress || "").trim() || "Jln Testing Jawa Barat no 19 RT 12";

  return (
    <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <img
                src={navbarLogo || "/logo/logo_nadrical.png"}
                alt={siteTitle || "Nadrical"}
                className="h-[var(--logo-foot-h-mobile)] sm:h-[var(--logo-foot-h-desktop)] w-auto object-contain transition-all duration-200"
                style={{
                  ['--logo-foot-h-mobile' as any]: `${logoFooterMobileHeightPx || 36}px`,
                  ['--logo-foot-h-desktop' as any]: `${logoFooterDesktopHeightPx || 44}px`,
                  maxWidth: `${logoMaxWidthPx || 180}px`,
                }}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = "/logo/logo_nadrical.png";
                }}
              />
              <span className="text-lg font-bold tracking-tight text-[color:var(--color-text)]">
                {siteTitle || "Nadrical"}
              </span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
              {siteTagline ||
                "Solusi e-commerce terpercaya untuk semua kebutuhan template, produk digital, dan gaya hidup Anda."}
            </p>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-secondary)]">
              Tautan Cepat
            </h2>
            <ul className="space-y-2 text-sm text-[color:var(--color-text-secondary)]">
              <li>
                <a
                  href="/#catalog"
                  className="transition-colors hover:text-[color:var(--color-primary)]"
                >
                  Katalog Template
                </a>
              </li>
              {importantPages.map((page) => (
                <li key={page.to}>
                  <Link
                    to={page.to}
                    className="transition-colors hover:text-[color:var(--color-primary)]"
                  >
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-secondary)]">
              Hubungi Kami
            </h2>
            <address className="not-italic">
              <ul className="space-y-2.5 text-sm text-[color:var(--color-text-secondary)]">
                {displayEmail && (
                  <li>
                    <a
                      href={`mailto:${displayEmail}`}
                      className="flex items-center gap-2 transition-colors hover:text-[color:var(--color-primary)]"
                    >
                      <Mail
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[color:var(--color-primary)]"
                      />
                      <span className="truncate">{displayEmail}</span>
                    </a>
                  </li>
                )}
                {displayPhone && (
                  <li>
                    <a
                      href={waUrl || `tel:${displayPhone}`}
                      target={waUrl ? "_blank" : undefined}
                      rel={waUrl ? "noopener noreferrer" : undefined}
                      className="flex items-center gap-2 transition-colors hover:text-[color:var(--color-primary)]"
                    >
                      <Phone
                        aria-hidden="true"
                        className="size-4 shrink-0 text-[color:var(--color-primary)]"
                      />
                      <span>{displayPhone}</span>
                    </a>
                  </li>
                )}
                {displayAddress && (
                  <li className="flex items-start gap-2">
                    <MapPin
                      aria-hidden="true"
                      className="mt-0.5 size-4 shrink-0 text-[color:var(--color-primary)]"
                    />
                    <span>{displayAddress}</span>
                  </li>
                )}
              </ul>
            </address>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-[color:var(--color-border)] pt-6 text-xs text-[color:var(--color-text-secondary)] sm:flex-row">
          <span>
            &copy; {year} {siteTitle || "Nadrical"}. Semua hak dilindungi.
          </span>
          <div className="flex items-center gap-5">
            <a
              href="#"
              className="transition-colors hover:text-[color:var(--color-primary)]"
            >
              Kebijakan Privasi
            </a>
            <a
              href="#"
              className="transition-colors hover:text-[color:var(--color-primary)]"
            >
              Syarat &amp; Ketentuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
