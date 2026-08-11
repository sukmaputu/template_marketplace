import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown, MessageCircle } from "lucide-react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqCategory {
  title: string;
  items: FaqItem[];
}

const FAQ_CATEGORIES: FaqCategory[] = [
  {
    title: "Sebelum Beli",
    items: [
      {
        question: "Apakah setiap kelas mendapatkan sertifikat?",
        answer:
          "Ya, setiap peserta yang menyelesaikan kelas akan mendapatkan sertifikat digital yang bisa diunduh dari halaman Riwayat Pembelian di profil kamu.",
      },
      {
        question: "Berapa lama akses materi kelas berlaku?",
        answer:
          "Akses materi berlaku selamanya (lifetime access) sejak tanggal pembelian, kecuali disebutkan berbeda pada deskripsi kelas tertentu.",
      },
      {
        question: "Apakah bisa refund kalau kelasnya tidak cocok?",
        answer:
          "Bisa, selama pengajuan refund dilakukan maksimal 3 hari setelah pembelian dan progres kelas belum melewati 20%. Hubungi admin lewat chat untuk memproses refund.",
      },
    ],
  },
  {
    title: "Pembayaran",
    items: [
      {
        question: "Metode pembayaran apa saja yang didukung?",
        answer:
          "Kami mendukung Virtual Account (BCA, BRI, Mandiri) dan pembayaran tunai di gerai retail (Alfamart, Alfamidi, Lawson, Dan+Dan).",
      },
      {
        question: "Kenapa pembayaran saya gagal/belum terkonfirmasi?",
        answer:
          "Pembayaran via Virtual Account biasanya terkonfirmasi otomatis dalam 1-10 menit. Kalau lebih dari 30 menit belum terkonfirmasi, silakan hubungi admin lewat chat dengan menyertakan nomor pesanan kamu.",
      },
    ],
  },
  {
    title: "Setelah Beli",
    items: [
      {
        question: "Bagaimana cara mengakses materi kelas yang sudah dibeli?",
        answer:
          "Buka halaman Profil → tab Riwayat Pembelian, lalu klik pesanan yang sudah selesai untuk mulai mengakses materi kelas.",
      },
      {
        question: "Jadwal kelas saya berubah, bagaimana?",
        answer:
          "Kalau ada perubahan jadwal dari mentor, kamu akan mendapat notifikasi email (kalau fitur ini diaktifkan di Pengaturan) dan info terbaru muncul di detail pesanan.",
      },
    ],
  },
  {
    title: "Akun",
    items: [
      {
        question: "Saya lupa password, bagaimana cara reset?",
        answer:
          "Klik 'Lupa password?' di halaman Sign In, lalu ikuti instruksi yang dikirim ke email terdaftar kamu.",
      },
      {
        question: "Bagaimana cara mengganti email akun saya?",
        answer:
          "Saat ini penggantian email perlu dibantu tim kami untuk verifikasi keamanan. Silakan hubungi admin lewat chat.",
      },
    ],
  },
];

function AccordionItem({ item }: { item: FaqItem }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-border last:border-0">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-3.5 text-left">
        <span className="text-sm font-medium text-text">{item.question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-secondary transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen ? (
        <p className="pb-4 text-sm leading-relaxed text-text-secondary">
          {item.answer}
        </p>
      ) : null}
    </div>
  );
}

function openChatWidget() {
  window.dispatchEvent(new Event("open-chat-widget"));
}

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader />

      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-primary">
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <h1 className="text-2xl font-bold text-text">Pusat Bantuan</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Cari jawaban cepat di sini, atau chat langsung dengan admin kalau
          masih butuh bantuan.
        </p>

        <div className="mt-6 space-y-4">
          {FAQ_CATEGORIES.map((category) => (
            <div
              key={category.title}
              className="rounded-xl border border-border bg-surface p-6">
              <h2 className="text-sm font-bold text-text">{category.title}</h2>
              <div className="mt-2">
                {category.items.map((item) => (
                  <AccordionItem key={item.question} item={item} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA ke chat */}
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-border bg-surface px-6 py-8 text-center">
          <p className="text-sm text-text-secondary">
            Masih belum ketemu jawabannya?
          </p>
          <button
            onClick={openChatWidget}
            className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90">
            <MessageCircle className="h-4 w-4" />
            Chat dengan Admin
          </button>
        </div>
      </div>
    </div>
  );
}
