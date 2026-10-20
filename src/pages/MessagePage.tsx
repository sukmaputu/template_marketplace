import { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCheck, Send, User } from "lucide-react";
import { MarketplaceHeader } from "@/components/navbar/MarketplaceHeader";
import { useAuth } from "@/components/auth/UseAuth";
import { chatService } from "@/services/chat.service";
import { websocketService } from "@/lib/websocket";
import type {
  ChatMessage,
  ChatIdentity,
  ChatConversation,
  WSChatMessagePayload,
  WSTypingPayload,
  WSPresencePayload,
  WSPresenceQueryPayload,
  WSReadReceiptPayload,
} from "@/types/chat";

function formatTime(isoString: string): string {
  try {
    return new Date(isoString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function formatAvatarUrl(path?: string | null): string | null {
  if (!path) return null;
  const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
  const baseUrl = apiBase.replace("/api/v1", "");
  if (path.startsWith("http") && path.includes("/uploads/")) {
    const cleanPath = path.substring(path.indexOf("uploads/"));
    return `${baseUrl}/${cleanPath}`;
  }
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const cleanPath = path.replace(/^\//, "");
  if (cleanPath.startsWith("uploads/")) {
    return `${baseUrl}/${cleanPath}`;
  }
  return `${baseUrl}/uploads/${cleanPath}`;
}

function getInitials(name: string): string {
  if (!name) return "AD";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

interface GuestIdentity {
  name: string;
  email: string;
  phone: string;
}

const GUEST_STORAGE_KEY = "marketplace_chat_guest_identity";

function getStoredGuestIdentity(): GuestIdentity | null {
  try {
    const raw = localStorage.getItem(GUEST_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestIdentity;
    return parsed?.name && parsed?.email ? parsed : null;
  } catch {
    return null;
  }
}

export default function MessagePage() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const conversationRef = useRef<ChatConversation | null>(null);

  const [draft, setDraft] = useState("");

  // Typing & presence states
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const lastAdminSeenRef = useRef<number>(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  const identity: ChatIdentity = useMemo(() => {
    if (isAuthenticated && user) {
      return {
        customer_user_id: user.id ? String(user.id) : (user.username || user.email || null),
        customer_name: user.full_name || "Pelanggan Member",
        customer_email: user.email || null,
        customer_phone: user.phone || null,
      };
    }
    const guest = getStoredGuestIdentity();
    if (guest) {
      return {
        customer_user_id: null,
        customer_name: guest.name,
        customer_email: guest.email || null,
        customer_phone: guest.phone || null,
      };
    }
    return {
      customer_user_id: null,
      customer_name: "Tamu",
      customer_email: null,
      customer_phone: null,
    };
  }, [isAuthenticated, user]);

  useLayoutEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  // Load conversation and sync with PostgreSQL DB
  useEffect(() => {
    let cancelled = false;

    async function loadConversation() {
      const localConv = chatService.ensureConversation(identity);
      const local = chatService.getLocalMessagesPage(localConv.id, 50);

      await Promise.resolve();
      if (cancelled) return;

      setConversation(localConv);
      if (local.messages.length > 0) {
        setMessages(local.messages);
      }
      chatService.markAsRead(localConv.id, "customer");

      // Remote sync with backend DB
      const syncedConv = await chatService.ensureConversationAsync(identity);
      if (cancelled) return;
      setConversation(syncedConv);

      const page = await chatService.fetchMessagesPage(syncedConv.id, 50);
      if (!cancelled && (page.messages.length > 0 || local.messages.length === 0)) {
        setMessages(page.messages);
      }
      chatService.markAsRead(syncedConv.id, "customer");
    }

    void loadConversation();
    return () => {
      cancelled = true;
    };
  }, [identity]);

  // Listen for conversation synced & updated events
  useEffect(() => {
    function handleSynced(e: Event) {
      const detail = (e as CustomEvent<{ oldId: string; conversation: ChatConversation }>).detail;
      if (detail?.conversation) {
        setConversation((prev) => {
          if (!prev || prev.id === detail.oldId || prev.id === detail.conversation.id) {
            return detail.conversation;
          }
          return prev;
        });
        setMessages((prev) => {
          const fresh = chatService.getMessages(detail.conversation.id);
          if (fresh.length >= prev.length) return fresh;
          return prev;
        });
      }
    }

    function handleChatUpdated() {
      const currentConv = conversationRef.current;
      if (currentConv) {
        const fresh = chatService.getMessages(currentConv.id);
        if (fresh.length > 0) {
          setMessages(fresh);
        }
      }
    }

    window.addEventListener("marketplace-chat-conversation-synced", handleSynced);
    window.addEventListener("marketplace-chat-updated", handleChatUpdated);
    window.addEventListener("storage", handleChatUpdated);
    return () => {
      window.removeEventListener("marketplace-chat-conversation-synced", handleSynced);
      window.removeEventListener("marketplace-chat-updated", handleChatUpdated);
      window.removeEventListener("storage", handleChatUpdated);
    };
  }, []);

  // WebSocket listeners
  useEffect(() => {
    const matchesMyConversation = (payload: {
      conversation_id?: string;
      conversation?: Partial<ChatConversation>;
      message?: ChatMessage;
      customer_email?: string | null;
      customer_user_id?: string | null;
      customer_phone?: string | null;
    }) => {
      const currentConv = conversationRef.current;
      const targetId =
        payload.conversation_id || payload.message?.conversation_id || payload.conversation?.id;

      if (currentConv && targetId && targetId === currentConv.id) {
        return true;
      }

      // Check if targetId matches any conversation belonging to this customer session
      const storedConvs = chatService.getConversations();
      if (targetId && storedConvs.some((c) => c.id === targetId)) {
        return true;
      }

      const incomingEmail = payload.customer_email || payload.conversation?.customer_email;
      const myEmail = currentConv?.customer_email || identity.customer_email;
      if (
        incomingEmail &&
        incomingEmail.trim() &&
        myEmail &&
        myEmail.trim() &&
        incomingEmail.trim().toLowerCase() === myEmail.trim().toLowerCase()
      ) {
        return true;
      }

      const incomingUserId = payload.customer_user_id || payload.conversation?.customer_user_id;
      const myUserId = currentConv?.customer_user_id || identity.customer_user_id;
      if (
        incomingUserId &&
        myUserId &&
        !incomingUserId.startsWith("guest-") &&
        incomingUserId === myUserId
      ) {
        return true;
      }

      const incomingPhone = payload.customer_phone || payload.conversation?.customer_phone;
      const myPhone = currentConv?.customer_phone || identity.customer_phone;
      if (
        incomingPhone &&
        incomingPhone.trim() &&
        myPhone &&
        myPhone.trim() &&
        incomingPhone.trim() === myPhone.trim()
      ) {
        return true;
      }

      return false;
    };

    const announcePresence = () => {
      websocketService.sendPresence({
        role: "customer",
        conversation_id: conversationRef.current?.id,
        user_id: identity.customer_user_id,
        customer_user_id: identity.customer_user_id || undefined,
        customer_email: identity.customer_email || undefined,
        user_name: identity.customer_name,
        status: "online",
        timestamp: Date.now(),
      });
    };

    websocketService.setPresenceAnnouncer(() => {
      announcePresence();
      websocketService.sendPresenceQuery("customer");
    });

    websocketService.connect();
    announcePresence();
    websocketService.sendPresenceQuery("customer");

    const unsubChat = websocketService.onChatMessage((payload: WSChatMessagePayload) => {
      if (!payload?.message) return;
      if (!matchesMyConversation(payload)) return;

      if (
        payload.message.sender_role === "admin" ||
        payload.message.sender_role === "agent" ||
        payload.message.sender_role === "bot"
      ) {
        const currentConv = conversationRef.current;
        const activeConvId = payload.conversation_id || currentConv?.id || "";

        // Auto-heal local conversation ID if synced to canonical backend UUID
        if (
          currentConv &&
          payload.conversation_id &&
          currentConv.id !== payload.conversation_id
        ) {
          setConversation((prev) =>
            prev ? { ...prev, id: payload.conversation_id } : prev,
          );
        }

        const normalizedPayload: WSChatMessagePayload = {
          ...payload,
          conversation_id: activeConvId,
          message: {
            ...payload.message,
            conversation_id: activeConvId,
          },
        };

        chatService.handleIncomingWSMessage(normalizedPayload);
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, normalizedPayload.message];
        });

        setIsAdminTyping(false);
        lastAdminSeenRef.current = Date.now();
        setIsAdminOnline(true);

        if (conversationRef.current) {
          chatService.markAsRead(activeConvId, "customer");
        }
      }
    });

    const unsubTyping = websocketService.onTyping((payload: WSTypingPayload) => {
      if (!payload) return;
      if (payload.sender_role === "admin" || payload.sender_role === "agent") {
        if (!matchesMyConversation(payload)) return;

        setIsAdminTyping(payload.is_typing);
        lastAdminSeenRef.current = Date.now();
        setIsAdminOnline(true);

        if (adminTypingTimeoutRef.current) {
          clearTimeout(adminTypingTimeoutRef.current);
        }
        if (payload.is_typing) {
          adminTypingTimeoutRef.current = setTimeout(() => {
            setIsAdminTyping(false);
          }, 3500);
        }
      }
    });

    const unsubPresence = websocketService.onPresence((payload: WSPresencePayload) => {
      if (!payload) return;
      if (payload.role === "admin" || payload.role === "agent") {
        lastAdminSeenRef.current = Date.now();
        setIsAdminOnline(payload.status === "online");
      }
    });

    const unsubPresenceQuery = websocketService.onPresenceQuery((payload: WSPresenceQueryPayload) => {
      if (payload && (payload.sender_role === "admin" || payload.sender_role === "agent")) {
        announcePresence();
      }
    });

    const unsubReadReceipt = websocketService.onReadReceipt((payload: WSReadReceiptPayload) => {
      if (!payload || (payload.reader_role !== "admin" && payload.reader_role !== "agent")) return;
      if (!matchesMyConversation(payload)) return;

      setMessages((prev) =>
        prev.map((m) => (m.sender_role === "customer" ? { ...m, is_read: true } : m)),
      );
      chatService.handleIncomingReadReceipt(payload);
    });

    const heartbeatTimer = setInterval(() => {
      announcePresence();
    }, 20000);

    const sweepTimer = setInterval(() => {
      if (lastAdminSeenRef.current > 0 && Date.now() - lastAdminSeenRef.current > 35000) {
        setIsAdminOnline(false);
      }
    }, 5000);

    const handleBeforeUnload = () => {
      websocketService.sendPresence({
        role: "customer",
        conversation_id: conversation?.id,
        user_id: identity.customer_user_id,
        customer_user_id: identity.customer_user_id || undefined,
        customer_email: identity.customer_email || undefined,
        user_name: identity.customer_name,
        status: "offline",
        timestamp: Date.now(),
      });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      unsubChat();
      unsubTyping();
      unsubPresence();
      unsubPresenceQuery();
      unsubReadReceipt();
      clearInterval(heartbeatTimer);
      clearInterval(sweepTimer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [conversation, identity]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isAdminTyping]);

  function handleDraftChange(value: string) {
    setDraft(value);

    if (conversation) {
      const now = Date.now();
      if (value.trim()) {
        if (now - lastTypingSentRef.current > 1800) {
          lastTypingSentRef.current = now;
          websocketService.sendTyping({
            conversation_id: conversation.id,
            sender_role: "customer",
            sender_name: identity.customer_name,
            customer_email: identity.customer_email || undefined,
            customer_user_id: identity.customer_user_id || undefined,
            is_typing: true,
          });
        }

        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
        typingTimerRef.current = setTimeout(() => {
          websocketService.sendTyping({
            conversation_id: conversation.id,
            sender_role: "customer",
            sender_name: identity.customer_name,
            customer_email: identity.customer_email || undefined,
            customer_user_id: identity.customer_user_id || undefined,
            is_typing: false,
          });
          lastTypingSentRef.current = 0;
        }, 2500);
      } else {
        lastTypingSentRef.current = 0;
        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
        websocketService.sendTyping({
          conversation_id: conversation.id,
          sender_role: "customer",
          sender_name: identity.customer_name,
          customer_email: identity.customer_email || undefined,
          customer_user_id: identity.customer_user_id || undefined,
          is_typing: false,
        });
      }
    }
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || !conversation) return;

    lastTypingSentRef.current = 0;
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    const result = chatService.sendCustomerMessage(identity, text);

    websocketService.sendTyping({
      conversation_id: conversation.id,
      sender_role: "customer",
      sender_name: identity.customer_name,
      customer_email: identity.customer_email || undefined,
      customer_user_id: identity.customer_user_id || undefined,
      is_typing: false,
    });

    setConversation(result.conversation);
    setMessages((prev) => {
      if (prev.some((m) => m.id === result.message.id)) return prev;
      return [...prev, result.message];
    });
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
              className="rounded-full p-1.5 text-text-secondary hover:bg-background sm:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>

            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
              <User className="h-5 w-5" />
            </span>

            <div>
              <p className="text-sm font-semibold text-text">Admin</p>
              <p className="flex items-center gap-1.5 text-xs text-text-secondary">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    isAdminOnline ? "bg-secondary" : "bg-gray-400"
                  }`}
                />
                {isAdminTyping
                  ? "Sedang mengetik..."
                  : isAdminOnline
                  ? "Online • Membalas dengan cepat"
                  : "Offline • Biasanya membalas dalam beberapa menit"}
              </p>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-1.5 overflow-y-auto px-4 py-4"
          >
            {messages.map((msg, idx) => {
              const isCustomer = msg.sender_role === "customer";
              const adminName =
                msg.sender_name || (msg.sender_role === "bot" ? "Bot Asisten" : "Admin Support");
              const avatarUrl = formatAvatarUrl(msg.sender_avatar);
              const initials = getInitials(adminName);

              const prevMsg = idx > 0 ? messages[idx - 1] : null;
              const isSameSender =
                prevMsg != null &&
                prevMsg.sender_role === msg.sender_role &&
                (isCustomer
                  ? true
                  : (msg.sender_user_id && prevMsg.sender_user_id
                      ? msg.sender_user_id === prevMsg.sender_user_id
                      : (msg.sender_name || "Admin") === (prevMsg.sender_name || "Admin")));

              const timeDiff =
                prevMsg && msg.created_at && prevMsg.created_at
                  ? Math.abs(new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime())
                  : 0;
              const isGroupedWithPrev = isSameSender && timeDiff < 5 * 60 * 1000;
              const showAdminInfo = !isCustomer && !isGroupedWithPrev;

              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    isCustomer ? "justify-end" : "justify-start"
                  } ${!isGroupedWithPrev && idx > 0 ? "pt-2.5" : ""}`}
                >
                  {/* Foto Admin di sebelah kiri bubble chat - hanya muncul 1x per rangkaian pesan */}
                  {!isCustomer && (
                    showAdminInfo ? (
                      <div className="shrink-0 mt-1 select-none" title={adminName}>
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={adminName}
                            className="size-7.5 rounded-full object-cover ring-1 ring-border shadow-xs"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        ) : (
                          <span className="flex size-7.5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] ring-1 ring-primary/20 shadow-xs">
                            {initials}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="size-7.5 shrink-0 select-none" aria-hidden="true" />
                    )
                  )}

                  <div
                    className={`flex flex-col ${
                      isCustomer ? "items-end max-w-[75%]" : "items-start max-w-[75%]"
                    }`}
                  >
                    {/* Nama Admin di sebelah kiri/atas bubble chat - hanya muncul 1x per rangkaian pesan */}
                    {showAdminInfo && (
                      <span className="text-[11px] font-semibold text-text-secondary mb-1 px-1 leading-tight">
                        {adminName}
                      </span>
                    )}

                    <div
                      className={`w-full rounded-2xl px-4 py-2.5 text-sm ${
                        isCustomer
                          ? "rounded-br-sm bg-primary text-white"
                          : "rounded-tl-xs rounded-bl-sm border border-border bg-surface text-text"
                      }`}
                    >
                      {msg.reply_to && (
                        <div
                          className={`mb-1.5 rounded-lg border-l-2 p-1.5 text-xs ${
                            isCustomer
                              ? "border-white/80 bg-white/15 text-white/90"
                              : "border-primary bg-primary/5 text-text-secondary"
                          }`}
                        >
                          <p className="font-semibold text-[10px]">
                            {msg.reply_to.sender_role === "customer" ? "Anda" : "Admin Support"}
                          </p>
                          <p className="line-clamp-1 italic text-[11px]">{msg.reply_to.message}</p>
                        </div>
                      )}

                      {msg.product_context && (
                        <div
                          className={`mb-2 flex items-center gap-2 rounded-xl p-2 ${
                            isCustomer
                              ? "bg-white/15 text-white"
                              : "border border-border bg-background text-text"
                          }`}
                        >
                          {msg.product_context.image && (
                            <img
                              src={msg.product_context.image}
                              alt={msg.product_context.name}
                              className="h-10 w-10 shrink-0 rounded-lg object-cover"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-medium">
                              {msg.product_context.name}
                            </p>
                            {msg.product_context.price ? (
                              <p
                                className={`text-xs font-semibold ${
                                  isCustomer ? "text-white" : "text-primary"
                                }`}
                              >
                                Rp {msg.product_context.price.toLocaleString("id-ID")}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      )}

                      <p className="whitespace-pre-wrap break-words">{msg.message}</p>
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
                          isCustomer ? "text-white/70" : "text-text-secondary"
                        }`}
                      >
                        <span>{formatTime(msg.created_at)}</span>
                        {isCustomer && (
                          <CheckCheck
                            className={`size-3.5 ${
                              msg.is_read ? "text-sky-300" : "text-white/50"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {isAdminTyping && (
              <div className="flex justify-start">
                <p className="text-xs text-text-secondary italic">
                  Admin sedang mengetik...
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <input
              type="text"
              value={draft}
              onChange={(e) => handleDraftChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Tulis pesan..."
              className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!draft.trim()}
              aria-label="Kirim pesan"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-40 cursor-pointer"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
