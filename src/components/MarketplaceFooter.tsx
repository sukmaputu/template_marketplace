import { Mail, MapPin, Phone } from "lucide-react";

const FOOTER_LINKS = {
  tentang: [
    { label: "Tentang Kami", href: "#" },
    { label: "Karir", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Kebijakan Privasi", href: "#" },
    { label: "Syarat & Ketentuan", href: "#" },
  ],
  kategori: [
    { label: "Business & Promotion", href: "#" },
    { label: "Teknologi Informasi", href: "#" },
    { label: "Desain & Kreatif", href: "#" },
    { label: "Data & Analitik", href: "#" },
  ],
  bantuan: [
    { label: "Pusat Bantuan", href: "#" },
    { label: "Cara Belanja", href: "#" },
    { label: "Cara Jualan", href: "#" },
    { label: "Metode Pembayaran", href: "#" },
    { label: "Lacak Pesanan", href: "#" },
  ],
};

const PAYMENT_METHODS = ["BCA", "Mandiri", "BRI", "GoPay", "OVO", "QRIS"];

export function MarketplaceFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-2">
            <a href="/" className="inline-flex items-center">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-10 w-auto object-contain"
              />
            </a>
            <p className="mt-3 max-w-xs text-sm text-[color:var(--color-text-secondary)]">
              Marketplace pelatihan &amp; produk digital untuk mendukung
              pertumbuhan bisnis dan pengembangan skill kamu.
            </p>

            <div className="mt-4 space-y-2 text-sm text-[color:var(--color-text-secondary)]">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0" />
                <span>Jakarta, Indonesia</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <span>+62 812 3456 7890</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <span>support@namamarketplace.com</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
              Tentang
            </h3>
            <ul className="mt-3 space-y-2.5">
              {FOOTER_LINKS.tentang.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
              Kategori
            </h3>
            <ul className="mt-3 space-y-2.5">
              {FOOTER_LINKS.kategori.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
              Bantuan
            </h3>
            <ul className="mt-3 space-y-2.5">
              {FOOTER_LINKS.bantuan.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-[color:var(--color-text-secondary)] hover:text-[color:var(--color-primary)]">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-[color:var(--color-border)] pt-6">
          <h3 className="text-sm font-semibold text-[color:var(--color-text)]">
            Metode Pembayaran
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="rounded-md border border-[color:var(--color-border)] px-3 py-1.5 text-xs font-medium text-[color:var(--color-text-secondary)]">
                {method}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-[color:var(--color-border)] pt-6 text-sm text-[color:var(--color-text-secondary)] sm:flex-row">
          <span>© {year} Nama Marketplace. Semua hak dilindungi.</span>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-[color:var(--color-primary)]">
              Kebijakan Privasi
            </a>
            <a href="#" className="hover:text-[color:var(--color-primary)]">
              Syarat & Ketentuan
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
