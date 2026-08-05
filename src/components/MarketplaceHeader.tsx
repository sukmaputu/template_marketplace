import { Link } from "react-router-dom";
import { Search, ShoppingCart } from "lucide-react";
import { ThemeToggle } from "@/components/Themetoggle";
import { NotificationMenu } from "@/components/NotificationMenu";
import { MessageMenu } from "@/components/MessageMenu";
import { ProfileMenu } from "@/components/ProfileMenu";
import { MobileMenu } from "@/components/MobileMenu";
import { useCart } from "@/components/useCart";

export function MarketplaceHeader() {
  const { itemCount } = useCart();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-10 w-auto object-contain"
          />
        </Link>

        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Cari produk..."
            className="w-full rounded-lg border border-border bg-surface py-2.5 pl-10 pr-4 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary"
          />
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            to="/cart"
            aria-label="Keranjang"
            className="relative rounded-full p-2 text-text hover:bg-border/40">
            <ShoppingCart className="h-5 w-5" />
            {itemCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white bg-accent">
                {itemCount}
              </span>
            ) : null}
          </Link>

          <div className="hidden items-center gap-1 sm:gap-2 lg:flex">
            <NotificationMenu />
            <MessageMenu />
            <ThemeToggle />
          </div>

          <div className="lg:hidden">
            <MobileMenu />
          </div>

          <ProfileMenu name="I Putu" />
        </div>
      </div>
    </header>
  );
}
