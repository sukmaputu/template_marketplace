import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, Camera, Star, User } from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { ProfileSkeleton } from "@/components/skeleton/ProfileSkeleton";
import { useAuth } from "@/components/auth/UseAuth";
import type { TabKey } from "@/components/profile/types";
import { DataDiriTab } from "@/components/profile/DataDiriTab";
import { RiwayatPembelianTab } from "@/components/profile/RiwayatPembelianTab";
import { VoucherTab } from "@/components/profile/VoucherTab";
import { WishlistTab } from "@/components/profile/WishlistTab";

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("data-diri");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }
  const joinedSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      })
    : "29 Agustus 2026";
  const loyaltyPoints = user?.loyalty_points ?? 0;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "data-diri", label: "Data Diri" },
    { key: "riwayat-pembelian", label: "Riwayat Pembelian" },
    { key: "voucher", label: "Voucher" },
    { key: "wishlist", label: "Wishlist" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <div className="flex flex-col items-start gap-6 lg:flex-row">
            <aside className="w-full shrink-0 lg:sticky lg:top-6 lg:w-64">
              <div className="flex flex-col rounded-xl border border-border bg-surface p-6">
                <div className="flex flex-col items-center text-center">
                  <button
                    type="button"
                    onClick={handleAvatarClick}
                    aria-label="Ganti foto profil"
                    className="group relative flex h-20 w-20 items-center justify-center rounded-full bg-primary text-white shadow-sm">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Foto profil"
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8" />
                    )}

                    <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera className="h-5 w-5 text-white" />
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />

                  <p className="mt-3 text-sm font-semibold text-text">
                    {user?.full_name || "Pengguna"}
                  </p>
                  <p className="text-xs text-text-secondary">{user?.email}</p>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-5">
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-background px-2 py-3 text-center">
                    <Calendar className="h-4 w-4 text-text-secondary" />
                    <p className="text-[11px] text-text-secondary">
                      Bergabung sejak
                    </p>
                    <p className="text-xs font-semibold text-text">
                      {joinedSince}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-lg bg-background px-2 py-3 text-center">
                    <Star className="h-4 w-4 text-text-secondary" />
                    <p className="text-[11px] text-text-secondary">
                      Poin Loyalti
                    </p>
                    <p className="text-xs font-semibold text-text">
                      {loyaltyPoints.toLocaleString("id-ID")}
                    </p>
                  </div>
                </div>

                <nav className="mt-6 space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                        activeTab === tab.key
                          ? "bg-primary/10 text-primary"
                          : "text-text-secondary hover:bg-background hover:text-text"
                      }`}>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="w-full flex-1">
              {activeTab === "data-diri" && <DataDiriTab />}
              {activeTab === "riwayat-pembelian" && <RiwayatPembelianTab />}
              {activeTab === "voucher" && <VoucherTab />}
              {activeTab === "wishlist" && <WishlistTab />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
