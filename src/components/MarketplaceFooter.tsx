export function MarketplaceFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
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
