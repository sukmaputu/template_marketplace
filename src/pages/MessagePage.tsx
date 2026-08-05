import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, User } from "lucide-react";
import { MarketplaceHeader } from "@/components/MarketplaceHeader";

interface ChatMessage {
  id: string | number;
  sender: "customer" | "admin";
  text: string;
  time: string;
}

function now() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    sender: "admin",
    text: "Halo! Ada yang bisa kami bantu terkait pesanan atau produk kamu?",
    time: "09.12",
  },
  {
    id: 2,
    sender: "customer",
    text: "Halo, mau tanya apakah kelas gambar teknik ada ?",
    time: "09.14",
  },
  {
    id: 3,
    sender: "admin",
    text: "Maaf kak, perusahaan kami tidak menyediakan kelas gambar teknik",
    time: "09.15",
  },
];

export default function MessagePage() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  function handleSend() {
    const text = draft.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), sender: "customer", text, time: now() },
    ]);
    setDraft("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <MarketplaceHeader />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Link
              to="/"
              aria-label="Kembali"
              className="rounded-full p-1.5 text-text-secondary hover:bg-background sm:hidden">
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
              <User className="h-5 w-5" />
            </span>

            <div>
              <p className="text-sm font-semibold text-text">Admin</p>
              <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                Biasanya membalas dalam beberapa menit
              </p>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.map((msg) => {
              const isCustomer = msg.sender === "customer";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                      isCustomer
                        ? "rounded-br-sm bg-primary text-white"
                        : "rounded-bl-sm border border-border bg-background text-text"
                    }`}>
                    <p>{msg.text}</p>
                    <p
                      className={`mt-1 text-right text-[11px] ${
                        isCustomer ? "text-white/70" : "text-text-secondary"
                      }`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pesan..."
              className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              aria-label="Kirim pesan"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
