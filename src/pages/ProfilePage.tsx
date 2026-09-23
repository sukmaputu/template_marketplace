import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  Camera,
  Star,
  User,
  X,
  ZoomIn,
} from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { ProfileSkeleton } from "@/components/skeleton/ProfileSkeleton";
import { useAuth } from "@/components/auth/UseAuth";
import type { TabKey } from "@/components/profile/types";
import { DataDiriTab } from "@/components/profile/DataDiriTab";
import { AddressTab } from "@/components/profile/AddressTab";
import { RiwayatPembelianTab } from "@/components/profile/RiwayatPembelianTab";
import { VoucherTab } from "@/components/profile/VoucherTab";
import { WishlistTab } from "@/components/profile/WishlistTab";

const CROP_SIZE = 280; // ukuran area crop (px) di dalam modal
const OUTPUT_SIZE = 512; // resolusi hasil crop yang disimpan

interface DragState {
  startX: number;
  startY: number;
  originOffsetX: number;
  originOffsetY: number;
}

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

  // --- State untuk modal atur posisi/ukuran foto profil ---
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const dragState = useRef<DragState | null>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);

  function handleAvatarClick() {
    fileInputRef.current?.click();
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // biar bisa pilih file yang sama lagi nanti
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setPendingImage(reader.result as string);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  }

  function handleCropImageLoad() {
    const img = cropImageRef.current;
    if (!img) return;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  }

  // Skala dasar supaya sisi terpendek gambar pas mengisi area crop
  const baseScale =
    naturalSize.width && naturalSize.height
      ? Math.max(CROP_SIZE / naturalSize.width, CROP_SIZE / naturalSize.height)
      : 1;
  const displayScale = baseScale * zoom;
  const displayWidth = naturalSize.width * displayScale;
  const displayHeight = naturalSize.height * displayScale;

  function clampOffset(x: number, y: number, w: number, h: number) {
    const maxX = Math.max(0, (w - CROP_SIZE) / 2);
    const maxY = Math.max(0, (h - CROP_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y)),
    };
  }

  function handleCropPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragState.current = {
      startX: e.clientX,
      startY: e.clientY,
      originOffsetX: offset.x,
      originOffsetY: offset.y,
    };
  }

  function handleCropPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const next = clampOffset(
      dragState.current.originOffsetX + dx,
      dragState.current.originOffsetY + dy,
      displayWidth,
      displayHeight,
    );
    setOffset(next);
  }

  function handleCropPointerUp() {
    dragState.current = null;
  }

  function handleZoomChange(value: number) {
    setZoom(value);
    // re-clamp offset supaya gambar tidak "lepas" dari bingkai saat zoom out
    const newScale = baseScale * value;
    const w = naturalSize.width * newScale;
    const h = naturalSize.height * newScale;
    setOffset((prev) => clampOffset(prev.x, prev.y, w, h));
  }

  const handleSaveCrop = useCallback(() => {
    const img = cropImageRef.current;
    if (!img) return;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const outputScale = OUTPUT_SIZE / CROP_SIZE;
    const drawWidth = displayWidth * outputScale;
    const drawHeight = displayHeight * outputScale;
    const drawX = OUTPUT_SIZE / 2 - drawWidth / 2 + offset.x * outputScale;
    const drawY = OUTPUT_SIZE / 2 - drawHeight / 2 + offset.y * outputScale;

    ctx.save();
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/png");
    setAvatarPreview(dataUrl);
    setPendingImage(null);

    // TODO: upload `dataUrl` (atau convert ke Blob/File) ke endpoint avatar
    // di backend kalian di sini.
  }, [displayWidth, displayHeight, offset]);

  function handleCancelCrop() {
    setPendingImage(null);
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
    { key: "alamat", label: "Alamat" },
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
              {activeTab === "alamat" && <AddressTab />}
              {activeTab === "riwayat-pembelian" && <RiwayatPembelianTab />}
              {activeTab === "voucher" && <VoucherTab />}
              {activeTab === "wishlist" && <WishlistTab />}
            </div>
          </div>
        )}
      </div>

      {pendingImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-xl border border-border bg-surface p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h3 className="text-base font-semibold text-text">
                Atur Foto Profil
              </h3>
              <button
                onClick={handleCancelCrop}
                className="rounded-lg p-1 text-text-secondary hover:bg-background hover:text-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div
              onPointerDown={handleCropPointerDown}
              onPointerMove={handleCropPointerMove}
              onPointerUp={handleCropPointerUp}
              onPointerLeave={handleCropPointerUp}
              className="relative mx-auto mt-5 flex items-center justify-center overflow-hidden rounded-full border border-border bg-background touch-none"
              style={{
                width: CROP_SIZE,
                height: CROP_SIZE,
                cursor: "grab",
              }}>
              <img
                ref={cropImageRef}
                src={pendingImage}
                onLoad={handleCropImageLoad}
                alt="Pratinjau foto profil"
                draggable={false}
                className="pointer-events-none select-none max-w-none"
                style={{
                  width: displayWidth || CROP_SIZE,
                  height: displayHeight || CROP_SIZE,
                  transform: `translate(${offset.x}px, ${offset.y}px)`,
                }}
              />
            </div>

            <div className="mt-4 flex items-center gap-3">
              <ZoomIn className="h-4 w-4 shrink-0 text-text-secondary" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => handleZoomChange(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <p className="mt-2 text-center text-xs text-text-secondary">
              Geser gambar dan atur zoom untuk menyesuaikan posisi
            </p>

            <div className="mt-6 flex justify-end gap-2 border-t border-border pt-4">
              <button
                onClick={handleCancelCrop}
                className="rounded-lg border border-border bg-surface px-4 py-2 text-xs font-medium text-text hover:bg-background">
                Batal
              </button>
              <button
                onClick={handleSaveCrop}
                className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-white hover:opacity-90">
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
