import { Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";

const contactDetails = {
  phone: "+62 899-6822-1035",
  phoneLink: "+6289968221035",
  email: "nadricalemail@gmail.com",
  address: "Jln Testing Jawa Barat no 19 RT 12",
};

const importantPages = [
  { label: "Beranda", to: "/" },
  { label: "Bantuan", to: "/help" },
  { label: "Keranjang", to: "/cart" },
  { label: "Pesan", to: "/message" },
  { label: "Profil", to: "/profile" },
];

export function MarketplaceFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_0.8fr]">
          <div>
            <Link to="/" className="mb-4 inline-flex items-center gap-3">
              <img
                src="/logo/logo_nadrical.png"
                alt=""
                className="h-11 w-11 object-contain"
              />
              <span className="text-xl font-bold tracking-tight text-[color:var(--color-text)]">
                Nadrical
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-6 text-[color:var(--color-text-secondary)]">
              Temukan pilihan produk dan pengalaman belanja yang nyaman bersama
              Nadrical.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-semibold text-[color:var(--color-text)]">
              Hubungi Kami
            </h2>
            <address className="not-italic">
              <ul className="space-y-3 text-sm text-[color:var(--color-text-secondary)]">
                <li>
                  <a
                    href={`tel:${contactDetails.phoneLink}`}
                    className="inline-flex items-center gap-3 transition-colors hover:text-[color:var(--color-primary)]">
                    <Phone
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0"
                    />
                    <span>{contactDetails.phone}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${contactDetails.email}`}
                    className="inline-flex items-center gap-3 transition-colors hover:text-[color:var(--color-primary)]">
                    <Mail aria-hidden="true" className="h-4 w-4 shrink-0" />
                    <span>{contactDetails.email}</span>
                  </a>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span>{contactDetails.address}</span>
                </li>
              </ul>
            </address>
          </div>

          <nav aria-label="Halaman penting">
            <h2 className="mb-4 text-sm font-semibold text-[color:var(--color-text)]">
              Halaman Penting
            </h2>
            <ul className="space-y-3 text-sm text-[color:var(--color-text-secondary)]">
              {importantPages.map((page) => (
                <li key={page.label}>
                  <Link
                    to={page.to}
                    className="transition-colors hover:text-[color:var(--color-primary)]">
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-10 border-t border-[color:var(--color-border)] pt-6 text-sm text-[color:var(--color-text-secondary)]">
          <span>© {year} Nadrical. Semua hak dilindungi.</span>
        </div>
      </div>
    </footer>
  );
}
