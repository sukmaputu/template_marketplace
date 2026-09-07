import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, User, Minus } from "lucide-react";
import { useAuth } from "@/components/auth/UseAuth";

type ChatSenderRole = "customer" | "agent" | "admin" | "bot";

interface ChatMessage {
  id: string | number;
  conversation_id: string | null;
  sender_user_id: string | null;
  sender_role: ChatSenderRole;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface ChatConversation {
  id: string | null;
  customer_user_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  status: string;
  created_at: string;
  last_activity_at: string;
  customer_read_at: string | null;
  agent_read_at: string | null;
  closed_at: string | null;
}

interface GuestIdentity {
  name: string;
  phone: string;
}

const GUEST_STORAGE_KEY = "chat_guest_identity";

function nowIso() {
  return new Date().toISOString();
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STAFF_ROLES: ChatSenderRole[] = ["agent", "admin", "bot"];

function isStaffMessage(role: ChatSenderRole) {
  return STAFF_ROLES.includes(role);
}

function getStoredGuestIdentity(): GuestIdentity | null {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.name && parsed?.phone) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveGuestIdentity(identity: GuestIdentity) {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // ignore storage errors (private mode, dsb.)
  }
}

const INITIAL_CONVERSATION: ChatConversation = {
  id: null,
  customer_user_id: null,
  customer_name: null,
  customer_email: null,
  customer_phone: null,
  status: "open",
  created_at: nowIso(),
  last_activity_at: nowIso(),
  customer_read_at: null,
  agent_read_at: null,
  closed_at: null,
};

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 1,
    conversation_id: null,
    sender_user_id: null,
    sender_role: "admin",
    message: "Halo! Ada yang bisa kami bantu terkait pesanan atau produk kamu?",
    is_read: true,
    created_at: nowIso(),
  },
];

const INITIAL_UNREAD = 1;

export function ChatWidget() {
  const { user, isAuthenticated } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] =
    useState<ChatConversation>(INITIAL_CONVERSATION);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [unreadCount, setUnreadCount] = useState(INITIAL_UNREAD);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Identitas guest (belum login)
  const [guestIdentity, setGuestIdentity] = useState<GuestIdentity | null>(() =>
    getStoredGuestIdentity(),
  );
  const [guestNameInput, setGuestNameInput] = useState("");
  const [guestPhoneInput, setGuestPhoneInput] = useState("");
  const [guestFormError, setGuestFormError] = useState<string | null>(null);

  // Sudah "teridentifikasi" kalau: login, ATAU guest yang sudah isi form
  const isIdentified = isAuthenticated || !!guestIdentity;
  const needsGuestForm = !isAuthenticated && !guestIdentity;

  // Derived, bukan state — dihitung ulang tiap render, tanpa effect
  function getCustomerIdentity() {
    if (isAuthenticated && user) {
      return {
        customer_user_id: null,
        customer_name: user.full_name,
        customer_email: user.email ?? null,
        customer_phone: null,
      };
    }
    if (guestIdentity) {
      return {
        customer_user_id: null,
        customer_name: guestIdentity.name,
        customer_email: null,
        customer_phone: guestIdentity.phone,
      };
    }
    return {
      customer_user_id: null,
      customer_name: null,
      customer_email: null,
      customer_phone: null,
    };
  }

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isOpen]);

  const markConversationReadByCustomer = useCallback(() => {
    setConversation((prev) => ({ ...prev, customer_read_at: nowIso() }));
    setMessages((prev) =>
      prev.map((m) =>
        isStaffMessage(m.sender_role) ? { ...m, is_read: true } : m,
      ),
    );
  }, []);

  useEffect(() => {
    function handleExternalOpen(e: Event) {
      setIsOpen(true);
      markConversationReadByCustomer();
      setUnreadCount(0);

      const detail = (e as CustomEvent<{ message?: string }>).detail;
      if (detail?.message) {
        setDraft(detail.message);
      }
    }
    window.addEventListener("open-chat-widget", handleExternalOpen);
    return () =>
      window.removeEventListener("open-chat-widget", handleExternalOpen);
  }, [markConversationReadByCustomer]);

  function openWidget() {
    setIsOpen(true);
    if (isIdentified) {
      markConversationReadByCustomer();
      setUnreadCount(0);
    }
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

  function handleGuestFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = guestNameInput.trim();
    const phone = guestPhoneInput.trim();

    if (!name) {
      setGuestFormError("Nama wajib diisi.");
      return;
    }
    if (!phone || !/^[0-9+ -]{8,15}$/.test(phone)) {
      setGuestFormError("Nomor telepon tidak valid.");
      return;
    }

    setGuestFormError(null);
    const identity: GuestIdentity = { name, phone };
    setGuestIdentity(identity);
    saveGuestIdentity(identity);

    markConversationReadByCustomer();
    setUnreadCount(0);
  }

  function addStaffMessage(text: string, role: ChatSenderRole = "admin") {
    const createdAt = nowIso();

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        conversation_id: conversation.id,
        sender_user_id: null,
        sender_role: role,
        message: text,
        is_read: false,
        created_at: createdAt,
      },
    ]);
    setConversation((prev) => ({ ...prev, last_activity_at: createdAt }));

    setIsOpen((currentlyOpen) => {
      if (!currentlyOpen) {
        setUnreadCount((prev) => prev + 1);
      } else {
        setConversation((prev) => ({ ...prev, customer_read_at: nowIso() }));
      }
      return currentlyOpen;
    });
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || !isIdentified) return;

    const createdAt = nowIso();
    const identity = getCustomerIdentity();

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        conversation_id: conversation.id,
        sender_user_id: identity.customer_user_id,
        sender_role: "customer",
        message: text,
        is_read: true,
        created_at: createdAt,
      },
    ]);
    setConversation((prev) => ({
      ...prev,
      ...identity,
      last_activity_at: createdAt,
      agent_read_at: null,
    }));
    setDraft("");

    setTimeout(() => {
      addStaffMessage(
        "Terima kasih pesannya, mohon tunggu sebentar ya kak.",
        "admin",
      );
    }, 1500);
  }

  return (
    <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 flex h-125 w-87.5 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-in slide-in-from-bottom-5 duration-300 sm:w-100">
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

          {needsGuestForm ? (
            <form
              onSubmit={handleGuestFormSubmit}
              className="flex flex-1 flex-col justify-center gap-3 bg-background p-5">
              <div>
                <p className="text-sm font-semibold text-text">
                  Sebelum mulai chat, isi dulu ya
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Supaya admin bisa menghubungi kamu kembali kalau perlu.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">
                  Nama
                </label>
                <input
                  type="text"
                  value={guestNameInput}
                  onChange={(e) => setGuestNameInput(e.target.value)}
                  placeholder="Nama kamu"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-text-secondary">
                  No. Telepon
                </label>
                <input
                  type="tel"
                  value={guestPhoneInput}
                  onChange={(e) => setGuestPhoneInput(e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text outline-none focus:border-primary"
                />
              </div>

              {guestFormError && (
                <p className="text-xs text-red-500">{guestFormError}</p>
              )}

              <button
                type="submit"
                className="mt-1 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95">
                Mulai Chat
              </button>
            </form>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="flex-1 space-y-4 overflow-y-auto bg-background p-4">
                {messages.map((msg) => {
                  const isCustomer = msg.sender_role === "customer";
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
                        <p>{msg.message}</p>
                        <p
                          className={`mt-1 text-right text-[10px] ${
                            isCustomer ? "text-white/70" : "text-text-secondary"
                          }`}>
                          {formatTime(msg.created_at)}
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
                    className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim()}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105 disabled:opacity-40">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </>
          )}
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
