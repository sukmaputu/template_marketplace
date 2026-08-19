import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, User, Minus } from "lucide-react";

interface ChatMessage {
  id: string | number;
  chat_sender_role: "customer" | "admin";
  text: string;
  time: string;
  is_read: boolean;
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
    chat_sender_role: "admin",
    text: "Halo! Ada yang bisa kami bantu terkait pesanan atau produk kamu?",
    time: "09.12",
    is_read: true,
  },
];

const INITIAL_UNREAD = 1;

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [unreadCount, setUnreadCount] = useState(INITIAL_UNREAD);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    function handleExternalOpen() {
      setIsOpen(true);
      setUnreadCount(0);
    }
    window.addEventListener("open-chat-widget", handleExternalOpen);
    return () =>
      window.removeEventListener("open-chat-widget", handleExternalOpen);
  }, []);

  function openWidget() {
    setIsOpen(true);
    setUnreadCount(0);
  }

  function closeWidget() {
    setIsOpen(false);
  }

  function handleToggle() {
    if (isOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }

  function addAdminMessage(text: string) {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        chat_sender_role: "admin",
        text,
        time: now(),
        is_read: false,
      },
    ]);

    setIsOpen((currentlyOpen) => {
      if (!currentlyOpen) {
        setUnreadCount((prev) => prev + 1);
      }
      return currentlyOpen;
    });
  }

  function handleSend() {
    const text = draft.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        chat_sender_role: "customer",
        text,
        time: now(),
        is_read: true,
      },
    ]);
    setDraft("");

    setTimeout(() => {
      addAdminMessage("Terima kasih pesannya, mohon tunggu sebentar ya kak.");
    }, 1500);
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-in slide-in-from-bottom-5 duration-300 sm:w-[400px]">
          <div className="flex items-center justify-between bg-primary px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <User className="h-6 w-6" />
                </span>
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-primary bg-secondary" />
              </div>
              <div>
                <p className="text-sm font-bold">Admin Support</p>
                <p className="text-[11px] opacity-80">
                  Online • Membalas dengan cepat
                </p>
              </div>
            </div>
            <button
              onClick={closeWidget}
              className="rounded-full p-1 hover:bg-white/20 transition-colors">
              <Minus className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-4 overflow-y-auto bg-[color:var(--color-background)] p-4">
            {messages.map((msg) => {
              const isCustomer = msg.chat_sender_role === "customer";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      isCustomer
                        ? "rounded-br-sm bg-primary text-white"
                        : "rounded-bl-sm border border-border bg-surface text-text"
                    }`}>
                    <p>{msg.text}</p>
                    <p
                      className={`mt-1 text-right text-[10px] ${
                        isCustomer ? "text-white/70" : "text-text-secondary"
                      }`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Tulis pesan..."
                className="flex-1 rounded-full border border-border bg-[color:var(--color-background)] px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
              />
              <button
                onClick={handleSend}
                disabled={!draft.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105 disabled:opacity-40">
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={handleToggle}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? "bg-red-500 rotate-90" : "bg-primary"
        } text-white`}>
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-7 w-7" />
        )}
        {!isOpen && unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white border-2 border-surface animate-bounce">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
}
