import { useEffect, useRef, useState, useMemo } from "react";
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

export default function MessagePage() {
  const { user, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const conversationRef = useRef<ChatConversation | null>(null);
  conversationRef.current = conversation;

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
    return {
      customer_user_id: chatService.getGuestId(),
      customer_name: "Pelanggan Tamu",
      customer_email: null,
      customer_phone: null,
    };
  }, [isAuthenticated, user]);

  // Load conversation
  useEffect(() => {
    const conv = chatService.ensureConversation(identity);
    setConversation(conv);
    setMessages(chatService.getMessages(conv.id));
    chatService.markAsRead(conv.id, "customer");
  }, [identity]);

  // WebSocket listeners
  useEffect(() => {
    const matchesMyConversation = (payload: {
      conversation_id?: string;
      conversation?: Partial<ChatConversation>;
      message?: ChatMessage;
      customer_email?: string | null;
      customer_user_id?: string | null;
    }) => {
      const currentConv = conversationRef.current;
      if (!currentConv) return false;

      const targetId =
        payload.conversation_id || payload.message?.conversation_id || payload.conversation?.id;
      if (targetId && targetId === currentConv.id) {
        return true;
      }

      const incomingEmail = payload.customer_email || payload.conversation?.customer_email;
      const myEmail = currentConv.customer_email || identity.customer_email;
      if (
        incomingEmail &&
        myEmail &&
        incomingEmail.trim().toLowerCase() === myEmail.trim().toLowerCase()
      ) {
        return true;
      }

      const incomingUserId = payload.customer_user_id || payload.conversation?.customer_user_id;
      const myUserId = currentConv.customer_user_id || identity.customer_user_id;
      if (
        incomingUserId &&
        myUserId &&
        !incomingUserId.startsWith("guest-") &&
        incomingUserId === myUserId
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
        const activeConvId = currentConv?.id || payload.conversation_id;
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
    setMessages((prev) => [...prev, result.message]);
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
