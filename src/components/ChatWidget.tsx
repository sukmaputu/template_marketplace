import {
  useEffect,
  useRef,
  useState,
  useCallback,
  useLayoutEffect,
} from "react";
import {
  CheckCheck,
  LoaderCircle,
  MessageCircle,
  Minus,
  Reply,
  Send,
  User,
  X,
} from "lucide-react";
import { useAuth } from "@/components/auth/UseAuth";
import { chatService } from "@/services/chat.service";
import { websocketService } from "@/lib/websocket";
import type {
  ChatConversation,
  ChatMessage,
  ChatIdentity,
  ProductChatContext,
  WSChatMessagePayload,
  WSTypingPayload,
  WSPresencePayload,
  WSPresenceQueryPayload,
  WSReadReceiptPayload,
} from "@/types/chat";

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

function saveGuestIdentity(identity: GuestIdentity): void {
  try {
    localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(identity));
  } catch {
    // Storage not available
  }
}

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
  const apiBase =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";
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

export function ChatWidget() {
  const { user, isAuthenticated } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(
    null,
  );
  const conversationRef = useRef<ChatConversation | null>(null);

  const [draft, setDraft] = useState("");
  const [attachedProduct, setAttachedProduct] = useState<
    (ProductChatContext & { priceLabel?: string }) | null
  >(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Presence and typing states
  const [isAdminOnline, setIsAdminOnline] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const lastAdminSeenRef = useRef<number>(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminTypingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastTypingSentRef = useRef<number>(0);

  // Guest identity
  const [guestIdentity, setGuestIdentity] = useState<GuestIdentity | null>(() =>
    getStoredGuestIdentity(),
  );
  const [guestNameInput, setGuestNameInput] = useState("");
  const [guestEmailInput, setGuestEmailInput] = useState("");
  const [guestPhoneInput, setGuestPhoneInput] = useState("");
  const [guestFormError, setGuestFormError] = useState<string | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<
    string | null
  >(null);

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`marketplace-msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId((cur) => (cur === messageId ? null : cur));
      }, 2000);
    }
  }, []);

  const isIdentified = isAuthenticated || !!guestIdentity;
  const needsGuestForm = !isAuthenticated && !guestIdentity;

  const scrollRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);

  const getCustomerIdentity = useCallback((): ChatIdentity => {
    if (isAuthenticated && user) {
      return {
        customer_user_id: user.id
          ? String(user.id)
          : user.username || user.email || null,
        customer_name: user.full_name || "Pelanggan Member",
        customer_email: user.email || null,
        customer_phone: user.phone || null,
      };
    }
    if (guestIdentity) {
      return {
        customer_user_id: null,
        customer_name: guestIdentity.name,
        customer_email: guestIdentity.email || null,
        customer_phone: guestIdentity.phone || null,
      };
    }
    return {
      customer_user_id: null,
      customer_name: "Tamu",
      customer_email: null,
      customer_phone: null,
    };
  }, [isAuthenticated, user, guestIdentity]);

  // Pagination states
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const hasMoreRef = useRef(true);
  const messagesRef = useRef<ChatMessage[]>(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  const topSentinelRef = useRef<HTMLDivElement | null>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const prevScrollTopRef = useRef<number>(0);
  const isPrependingRef = useRef<boolean>(false);
  const prevMessagesLengthRef = useRef<number>(messages.length);

  useLayoutEffect(() => {
    conversationRef.current = conversation;
    isOpenRef.current = isOpen;
  }, [conversation, isOpen]);

  useEffect(() => {
    function handleSynced(e: Event) {
      const detail = (
        e as CustomEvent<{ oldId: string; conversation: ChatConversation }>
      ).detail;
      if (detail?.conversation) {
        setConversation((prev) => {
          if (
            !prev ||
            prev.id === detail.oldId ||
            prev.id === detail.conversation.id
          ) {
            return detail.conversation;
          }
          return prev;
        });
      }
    }
    window.addEventListener(
      "marketplace-chat-conversation-synced",
      handleSynced,
    );
    return () =>
      window.removeEventListener(
        "marketplace-chat-conversation-synced",
        handleSynced,
      );
  }, []);

  // Identity ref to ensure listeners stay stable without unbinding during messaging
  const identityRef = useRef(getCustomerIdentity());
  useEffect(() => {
    identityRef.current = getCustomerIdentity();
  }, [getCustomerIdentity]);

  useEffect(() => {
    if (!isIdentified) return;
    let cancelled = false;

    async function loadConversation() {
      const identity = identityRef.current;
      const localConv = chatService.ensureConversation(identity);
      const local = chatService.getLocalMessagesPage(localConv.id, 50);

      await Promise.resolve();
      if (cancelled) return;

      setConversation(localConv);
      if (local.messages.length > 0) {
        setMessages(local.messages);
        setHasMore(local.hasMore);
        hasMoreRef.current = local.hasMore;
      }

      const syncedConv = await chatService.ensureConversationAsync(identity);
      if (cancelled) return;
      setConversation(syncedConv);

      const page = await chatService.fetchMessagesPage(syncedConv.id, 50);
      if (
        !cancelled &&
        (page.messages.length > 0 || local.messages.length === 0)
      ) {
        setMessages((prev) => {
          const map = new Map<string, ChatMessage>();
          page.messages.forEach((m) => map.set(String(m.id), m));
          prev.forEach((m) => {
            const alreadyInMap =
              map.has(String(m.id)) ||
              (m.client_temp_id &&
                Array.from(map.values()).some(
                  (pm) =>
                    pm.id === m.client_temp_id ||
                    pm.client_temp_id === m.client_temp_id,
                ));
            if (!alreadyInMap) {
              map.set(String(m.id), m);
            }
          });
          return Array.from(map.values()).sort(
            (a, b) =>
              new Date(a.created_at || 0).getTime() -
              new Date(b.created_at || 0).getTime(),
          );
        });
        setHasMore(page.hasMore);
        hasMoreRef.current = page.hasMore;
      }
    }

    void loadConversation();
    return () => {
      cancelled = true;
    };
  }, [isIdentified]);

  // Initial scroll to bottom when opening
  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen]);

  // Load older messages trigger
  const loadMoreMessages = useCallback(async (): Promise<boolean> => {
    const currentConv = conversationRef.current;
    if (!currentConv || isLoadingMoreRef.current || !hasMoreRef.current)
      return false;
    const currentMessages = messagesRef.current;
    if (currentMessages.length === 0) return false;

    const oldest = currentMessages[0];
    const before = oldest.created_at;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const page = await chatService.fetchMessagesPage(
        currentConv.id,
        20,
        before,
      );
      if (page.messages.length > 0) {
        setMessages((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const newOlder = page.messages.filter((m) => !existingIds.has(m.id));
          return [...newOlder, ...prev];
        });
      }
      setHasMore(page.hasMore);
      hasMoreRef.current = page.hasMore;
      return page.messages.length > 0;
    } catch (err) {
      console.warn("[ChatWidget] Error fetching older messages:", err);
      return false;
    } finally {
      isLoadingMoreRef.current = false;
      setIsLoadingMore(false);
    }
  }, []);

  // Scroll preservation on prepending older messages vs auto-scroll on new message
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    if (isPrependingRef.current) {
      const newScrollHeight = container.scrollHeight;
      const heightDiff = newScrollHeight - prevScrollHeightRef.current;
      container.scrollTop = prevScrollTopRef.current + heightDiff;
      isPrependingRef.current = false;
    } else if (messages.length > prevMessagesLengthRef.current) {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      const lastMsg = messages[messages.length - 1];
      if (distanceFromBottom < 160 || lastMsg?.sender_role === "customer") {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  // Auto-scroll when admin starts typing so indicator is never clipped or overlapped
  useEffect(() => {
    if (isAdminTyping && scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [isAdminTyping]);

  const handleLoadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isPrependingRef.current) return;
    const container = scrollRef.current;
    if (!container) return;

    prevScrollHeightRef.current = container.scrollHeight;
    prevScrollTopRef.current = container.scrollTop;
    isPrependingRef.current = true;

    try {
      await loadMoreMessages();
    } catch {
      isPrependingRef.current = false;
    }
  }, [hasMore, isLoadingMore, loadMoreMessages]);

  useEffect(() => {
    const sentinel = topSentinelRef.current;
    const container = scrollRef.current;
    if (!sentinel || !container || !hasMore || isLoadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          void handleLoadMore();
        }
      },
      {
        root: container,
        rootMargin: "80px 0px 0px 0px",
        threshold: 0.1,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, handleLoadMore]);

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;
    if (
      container.scrollTop <= 50 &&
      hasMore &&
      !isLoadingMore &&
      !isPrependingRef.current
    ) {
      void handleLoadMore();
    }
  };

  const markConversationRead = useCallback(() => {
    if (conversationRef.current) {
      chatService.markAsRead(conversationRef.current.id, "customer");
    }
    setUnreadCount(0);
  }, []);

  // WebSocket listeners: chat, typing, presence
  useEffect(() => {
    // Helper to verify that incoming event belongs specifically to THIS customer's conversation
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
        payload.conversation_id ||
        payload.message?.conversation_id ||
        payload.conversation?.id;

      if (currentConv && targetId && targetId === currentConv.id) {
        return true;
      }

      // Check if targetId matches any conversation belonging to this customer session
      const storedConvs = chatService.getConversations();
      if (targetId && storedConvs.some((c) => c.id === targetId)) {
        return true;
      }

      const currentIdent = identityRef.current;
      const incomingEmail =
        payload.customer_email || payload.conversation?.customer_email;
      const myEmail = currentConv?.customer_email || currentIdent.customer_email;
      if (
        incomingEmail &&
        incomingEmail.trim() &&
        myEmail &&
        myEmail.trim() &&
        incomingEmail.trim().toLowerCase() === myEmail.trim().toLowerCase()
      ) {
        return true;
      }

      const incomingUserId =
        payload.customer_user_id || payload.conversation?.customer_user_id;
      const myUserId = currentConv?.customer_user_id || currentIdent.customer_user_id;
      if (
        incomingUserId &&
        myUserId &&
        !incomingUserId.startsWith("guest-") &&
        incomingUserId === myUserId
      ) {
        return true;
      }

      const incomingPhone =
        payload.customer_phone || payload.conversation?.customer_phone;
      const myPhone = currentConv?.customer_phone || currentIdent.customer_phone;
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
      const currentIdent = identityRef.current;
      websocketService.sendPresence({
        role: "customer",
        conversation_id: conversationRef.current?.id,
        user_id: currentIdent.customer_user_id,
        customer_user_id: currentIdent.customer_user_id || undefined,
        customer_email: currentIdent.customer_email || undefined,
        user_name: currentIdent.customer_name,
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

    const unsubChat = websocketService.onChatMessage(
      (payload: WSChatMessagePayload) => {
        if (!payload?.message) return;
        // CRITICAL: Ignore messages that belong to other customer conversations!
        if (!matchesMyConversation(payload)) return;

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
          const incoming = normalizedPayload.message;
          const idx = prev.findIndex(
            (m) =>
              m.id === incoming.id ||
              (incoming.client_temp_id && (m.id === incoming.client_temp_id || m.client_temp_id === incoming.client_temp_id)) ||
              (m.client_temp_id && m.client_temp_id === incoming.id) ||
              (m.sender_role === incoming.sender_role &&
                m.message === incoming.message &&
                Math.abs(new Date(m.created_at || 0).getTime() - new Date(incoming.created_at || 0).getTime()) < 30000),
          );
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = {
              ...updated[idx],
              ...incoming,
              id: incoming.id,
              created_at: incoming.created_at || updated[idx].created_at,
            };
            return updated;
          }
          return [...prev, incoming];
        });

        const isStaff =
          payload.message.sender_role === "admin" ||
          payload.message.sender_role === "agent" ||
          payload.message.sender_role === "bot";

        if (isStaff) {
          // Admin replied -> clear typing
          setIsAdminTyping(false);
          lastAdminSeenRef.current = Date.now();
          setIsAdminOnline(true);

          if (!isOpenRef.current) {
            setUnreadCount((prev) => prev + 1);
          } else if (conversationRef.current) {
            chatService.markAsRead(activeConvId, "customer");
          }
        }
      },
    );

    const unsubTyping = websocketService.onTyping(
      (payload: WSTypingPayload) => {
        if (!payload) return;
        if (
          payload.sender_role === "admin" ||
          payload.sender_role === "agent"
        ) {
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
      },
    );

    const unsubPresence = websocketService.onPresence(
      (payload: WSPresencePayload) => {
        if (!payload) return;
        if (payload.role === "admin" || payload.role === "agent") {
          lastAdminSeenRef.current = Date.now();
          setIsAdminOnline(payload.status === "online");
        }
      },
    );

    const unsubPresenceQuery = websocketService.onPresenceQuery(
      (payload: WSPresenceQueryPayload) => {
        if (
          payload &&
          (payload.sender_role === "admin" || payload.sender_role === "agent")
        ) {
          announcePresence();
        }
      },
    );

    const unsubReadReceipt = websocketService.onReadReceipt(
      (payload: WSReadReceiptPayload) => {
        if (
          !payload ||
          (payload.reader_role !== "admin" && payload.reader_role !== "agent")
        )
          return;
        if (!matchesMyConversation(payload)) return;

        setMessages((prev) =>
          prev.map((m) =>
            m.sender_role === "customer" ? { ...m, is_read: true } : m,
          ),
        );
        chatService.handleIncomingReadReceipt(payload);
      },
    );

    // 20s presence heartbeat
    const heartbeatTimer = setInterval(() => {
      announcePresence();
    }, 20000);

    // 5s sweep dead-peer timeout
    const sweepTimer = setInterval(() => {
      if (
        lastAdminSeenRef.current > 0 &&
        Date.now() - lastAdminSeenRef.current > 35000
      ) {
        setIsAdminOnline(false);
      }
    }, 5000);

    const handleBeforeUnload = () => {
      const currentIdent = identityRef.current;
      websocketService.sendPresence({
        role: "customer",
        conversation_id: conversationRef.current?.id,
        user_id: currentIdent.customer_user_id,
        customer_user_id: currentIdent.customer_user_id || undefined,
        customer_email: currentIdent.customer_email || undefined,
        user_name: currentIdent.customer_name,
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
  }, [isIdentified]);

  // Handle external open event (e.g. from ProductDetailPage "Tanya Admin" button)
  useEffect(() => {
    function handleExternalOpen(e: Event) {
      setIsOpen(true);
      markConversationRead();
      const detail = (
        e as CustomEvent<{
          message?: string;
          product?: ProductChatContext & { priceLabel?: string };
        }>
      ).detail;
      if (detail?.product) {
        setAttachedProduct(detail.product);
      }
      if (detail?.message) {
        setDraft(detail.message);
      }
    }
    window.addEventListener("open-chat-widget", handleExternalOpen);
    return () =>
      window.removeEventListener("open-chat-widget", handleExternalOpen);
  }, [markConversationRead]);

  function openWidget() {
    setIsOpen(true);
    if (isIdentified) {
      markConversationRead();
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
    setGuestFormError(null);

    const name = guestNameInput.trim();
    const email = guestEmailInput.trim().toLowerCase();
    const phone = guestPhoneInput.trim().replace(/[\s-]/g, "");

    if (!name || name.length < 2) {
      setGuestFormError("Nama minimal 2 karakter.");
      return;
    }
    if (name.length > 100) {
      setGuestFormError("Nama maksimal 100 karakter.");
      return;
    }
    if (!email) {
      setGuestFormError("Email wajib diisi.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setGuestFormError("Format email tidak valid.");
      return;
    }
    if (!phone) {
      setGuestFormError("Nomor telepon wajib diisi.");
      return;
    }
    if (!/^(\+62|62|0)8[1-9][0-9]{7,11}$/.test(phone)) {
      setGuestFormError(
        "Format nomor telepon tidak valid. Gunakan format nomor seluler Indonesia yang valid (contoh: 08123456789 atau +628123456789).",
      );
      return;
    }

    const identity: GuestIdentity = { name, email, phone };
    setGuestIdentity(identity);
    saveGuestIdentity(identity);

    const conv = chatService.ensureConversation({
      customer_user_id: null,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
    });
    setConversation(conv);
    setMessages(chatService.getMessages(conv.id));
    markConversationRead();
  }

  // Handle draft changes and debounced typing indicator
  function handleDraftChange(value: string) {
    setDraft(value);

    if (conversation) {
      const now = Date.now();
      const ident = getCustomerIdentity();

      if (value.trim()) {
        if (now - lastTypingSentRef.current > 1800) {
          lastTypingSentRef.current = now;
          websocketService.sendTyping({
            conversation_id: conversation.id,
            sender_role: "customer",
            sender_name: ident.customer_name,
            customer_email: ident.customer_email || undefined,
            customer_user_id: ident.customer_user_id || undefined,
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
            sender_name: ident.customer_name,
            customer_email: ident.customer_email || undefined,
            customer_user_id: ident.customer_user_id || undefined,
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
          sender_name: ident.customer_name,
          customer_email: ident.customer_email || undefined,
          customer_user_id: ident.customer_user_id || undefined,
          is_typing: false,
        });
      }
    }
  }

  function handleSend() {
    const text = draft.trim();
    if (!text || text.length > 2000 || !isIdentified) return;

    setDraft("");
    const replyingSnapshot = replyingTo;
    const productSnapshot = attachedProduct;
    setReplyingTo(null);
    setAttachedProduct(null);

    lastTypingSentRef.current = 0;
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }

    const identity = getCustomerIdentity();
    const result = chatService.sendCustomerMessage(
      identity,
      text,
      productSnapshot
        ? {
            id: productSnapshot.id,
            name: productSnapshot.name,
            price: productSnapshot.price,
            image: productSnapshot.image,
            category: productSnapshot.category,
          }
        : undefined,
      replyingSnapshot,
    );

    // Cancel typing
    websocketService.sendTyping({
      conversation_id: result.conversation.id,
      sender_role: "customer",
      sender_name: identity.customer_name,
      customer_email: identity.customer_email || undefined,
      customer_user_id: identity.customer_user_id || undefined,
      is_typing: false,
    });

    setConversation(result.conversation);
    setMessages((prev) => {
      const idx = prev.findIndex(
        (m) =>
          m.id === result.message.id ||
          (result.message.client_temp_id && (m.id === result.message.client_temp_id || m.client_temp_id === result.message.client_temp_id)) ||
          (m.sender_role === result.message.sender_role &&
            m.message === result.message.message &&
            Math.abs(new Date(m.created_at || 0).getTime() - new Date(result.message.created_at || 0).getTime()) < 30000),
      );
      if (idx !== -1) {
        const up = [...prev];
        up[idx] = { ...up[idx], ...result.message };
        return up;
      }
      return [...prev, result.message];
    });
  }

  return (
    <div className="fixed bottom-6 right-6 z-100 flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 flex h-125 w-87.5 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-in slide-in-from-bottom-5 duration-300 sm:w-100">
          {/* Header */}
          <div className="flex items-center justify-between bg-primary px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  <User className="h-6 w-6" />
                </span>
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-primary ${
                    isAdminOnline ? "bg-secondary" : "bg-gray-400"
                  }`}
                />
              </div>
              <div>
                <p className="text-sm font-bold">Admin Support</p>
                <p className="text-[11px] opacity-80">
                  {isAdminTyping
                    ? "Sedang mengetik..."
                    : isAdminOnline
                      ? "Online • Membalas dengan cepat"
                      : "Offline • Biasanya membalas beberapa menit"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeWidget}
              className="rounded-full p-1 hover:bg-white/20 transition-colors cursor-pointer">
              <Minus className="h-5 w-5" />
            </button>
          </div>

          {/* Body: Guest Form or Messages Thread */}
          {needsGuestForm ? (
            <form
              onSubmit={handleGuestFormSubmit}
              className="flex flex-1 flex-col justify-center gap-3 bg-background p-5 overflow-y-auto">
              <div>
                <p className="text-sm font-semibold text-text">
                  Sebelum mulai chat, isi dulu ya
                </p>
                <p className="mt-1 text-xs text-text-secondary">
                  Supaya admin bisa menghubungi kamu kembali kalau perlu.
                </p>
              </div>

              {attachedProduct && (
                <div className="rounded-xl border border-border bg-surface p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="text-[11px] text-text-secondary">
                      Kamu menanyakan tentang produk ini.
                    </p>
                    <button
                      type="button"
                      onClick={() => setAttachedProduct(null)}
                      aria-label="Hapus produk"
                      className="rounded-full p-1 text-text-secondary hover:bg-background hover:text-text cursor-pointer">
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-background p-2">
                    {attachedProduct.image ? (
                      <img
                        src={attachedProduct.image}
                        alt={attachedProduct.name}
                        className="h-10 w-10 shrink-0 rounded-lg object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-text">
                        {attachedProduct.name}
                      </p>
                      {attachedProduct.price ? (
                        <p className="text-xs font-semibold text-primary">
                          Rp {attachedProduct.price.toLocaleString("id-ID")}
                        </p>
                      ) : attachedProduct.priceLabel ? (
                        <p className="text-xs font-semibold text-primary">
                          {attachedProduct.priceLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}

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
                  Email
                </label>
                <input
                  type="email"
                  value={guestEmailInput}
                  onChange={(e) => setGuestEmailInput(e.target.value)}
                  placeholder="email@contoh.com"
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
                className="mt-1 w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer">
                Mulai Chat
              </button>
            </form>
          ) : (
            <>
              {/* Message thread */}
              <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 space-y-1.5 overflow-y-auto bg-background p-4">
                {hasMore && (
                  <div
                    ref={topSentinelRef}
                    className="h-1 w-full pointer-events-none"
                  />
                )}

                {isLoadingMore && (
                  <div className="flex items-center justify-center py-2 text-xs text-text-secondary gap-2">
                    <LoaderCircle className="size-3.5 animate-spin text-primary" />
                    <span>Memuat riwayat chat...</span>
                  </div>
                )}

                {!hasMore && messages.length >= 20 && (
                  <div className="flex items-center justify-center py-2 text-[11px] text-text-secondary/60 select-none">
                    <span>— Awal percakapan —</span>
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isCustomer = msg.sender_role === "customer";
                  const isHighlighted = highlightedMessageId === msg.id;
                  const adminName =
                    msg.sender_name ||
                    (msg.sender_role === "bot"
                      ? "Bot Asisten"
                      : "Admin Support");
                  const avatarUrl = formatAvatarUrl(msg.sender_avatar);
                  const initials = getInitials(adminName);

                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const isSameSender =
                    prevMsg != null &&
                    prevMsg.sender_role === msg.sender_role &&
                    (isCustomer
                      ? true
                      : msg.sender_user_id && prevMsg.sender_user_id
                        ? msg.sender_user_id === prevMsg.sender_user_id
                        : (msg.sender_name || "Admin") ===
                          (prevMsg.sender_name || "Admin"));

                  const timeDiff =
                    prevMsg && msg.created_at && prevMsg.created_at
                      ? Math.abs(
                          new Date(msg.created_at).getTime() -
                            new Date(prevMsg.created_at).getTime(),
                        )
                      : 0;
                  const isGroupedWithPrev =
                    isSameSender && timeDiff < 5 * 60 * 1000;
                  const showAdminInfo = !isCustomer && !isGroupedWithPrev;

                  return (
                    <div
                      key={msg.id}
                      className={`group flex items-start gap-2 ${
                        isCustomer ? "justify-end" : "justify-start"
                      } ${!isGroupedWithPrev && idx > 0 ? "pt-2.5" : ""}`}>
                      {/* Foto Admin di sebelah kiri bubble chat - hanya muncul 1x per rangkaian pesan */}
                      {!isCustomer &&
                        (showAdminInfo ? (
                          <div
                            className="shrink-0 mt-1 select-none"
                            title={adminName}>
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={adminName}
                                className="size-7.5 rounded-full object-cover ring-1 ring-border shadow-xs"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display =
                                    "none";
                                }}
                              />
                            ) : (
                              <span className="flex size-7.5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px] ring-1 ring-primary/20 shadow-xs">
                                {initials}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div
                            className="size-7.5 shrink-0 select-none"
                            aria-hidden="true"
                          />
                        ))}

                      {isCustomer && (
                        <button
                          type="button"
                          title="Balas pesan"
                          onClick={() => setReplyingTo(msg)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1 text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer shrink-0 self-end">
                          <Reply className="size-3.5" />
                        </button>
                      )}

                      <div
                        className={`flex flex-col ${
                          isCustomer
                            ? "items-end max-w-[80%]"
                            : "items-start max-w-[78%]"
                        }`}>
                        {/* Nama Admin di sebelah kiri/atas bubble chat - hanya muncul 1x per rangkaian pesan */}
                        {showAdminInfo && (
                          <span className="text-[11px] font-semibold text-text-secondary mb-1 px-1 leading-tight">
                            {adminName}
                          </span>
                        )}

                        <div
                          id={`marketplace-msg-${msg.id}`}
                          className={`w-full rounded-2xl px-4 py-2.5 text-sm shadow-sm transition-all duration-300 ${
                            isHighlighted
                              ? isCustomer
                                ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-background brightness-110 shadow-lg animate-pulse scale-[1.01]"
                                : "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/20 shadow-lg animate-pulse scale-[1.01]"
                              : ""
                          } ${
                            isCustomer
                              ? "rounded-br-sm bg-primary text-white"
                              : "rounded-tl-xs rounded-bl-sm border border-border bg-surface text-text"
                          }`}>
                          {msg.reply_to && (
                            <div
                              role="button"
                              tabIndex={0}
                              title="Menuju ke pesan asli"
                              onClick={(e) => {
                                e.stopPropagation();
                                const targetId =
                                  msg.reply_to_id || msg.reply_to?.id;
                                if (targetId) {
                                  scrollToMessage(targetId);
                                }
                              }}
                              className={`mb-1.5 rounded-lg border-l-2 p-1.5 text-xs cursor-pointer select-none transition-all hover:opacity-85 active:scale-[0.98] ${
                                isCustomer
                                  ? "border-white/80 bg-white/15 text-white/90 hover:bg-white/25"
                                  : "border-primary bg-primary/5 text-text-secondary hover:bg-primary/10"
                              }`}>
                              <p className="font-semibold text-[10px]">
                                {msg.reply_to.sender_role === "customer"
                                  ? "Anda"
                                  : "Admin Support"}
                              </p>
                              <p className="line-clamp-1 italic text-[11px]">
                                {msg.reply_to.message}
                              </p>
                            </div>
                          )}
                          {msg.product_context && (
                            <div
                              className={`mb-2 flex items-center gap-2 rounded-xl p-2 ${
                                isCustomer
                                  ? "bg-white/15 text-white"
                                  : "border border-border bg-background text-text"
                              }`}>
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
                                    }`}>
                                    Rp{" "}
                                    {msg.product_context.price.toLocaleString(
                                      "id-ID",
                                    )}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          )}
                          <p className="whitespace-pre-wrap break-words">
                            {msg.message}
                          </p>
                          <div
                            className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                              isCustomer
                                ? "text-white/70"
                                : "text-text-secondary"
                            }`}>
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

                      {!isCustomer && (
                        <button
                          type="button"
                          title="Balas pesan"
                          onClick={() => setReplyingTo(msg)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1 text-text-secondary hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer shrink-0 self-end">
                          <Reply className="size-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {isAdminTyping && (
                  <div className="flex items-end gap-2 pb-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface-variant text-[10px] font-bold text-text">
                      SA
                    </span>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border bg-surface px-3 py-2 shadow-xs">
                      <span className="text-xs text-text-secondary mr-1">Admin sedang mengetik</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                    </div>
                  </div>
                )}
              </div>

              {/* Composer */}
              <div className="border-t border-border bg-surface">
                {attachedProduct && (
                  <div className="border-b border-border bg-surface px-4 py-2">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-[11px] text-text-secondary">
                        Kamu menanyakan tentang produk ini:
                      </p>
                      <button
                        type="button"
                        onClick={() => setAttachedProduct(null)}
                        aria-label="Hapus produk"
                        className="rounded-full p-1 text-text-secondary hover:bg-black/5 hover:text-text cursor-pointer">
                        <X className="size-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
                      {attachedProduct.image ? (
                        <img
                          src={attachedProduct.image}
                          alt={attachedProduct.name}
                          className="h-10 w-10 shrink-0 rounded-lg object-cover"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-text">
                          {attachedProduct.name}
                        </p>
                        {attachedProduct.price ? (
                          <p className="text-xs font-semibold text-primary">
                            Rp {attachedProduct.price.toLocaleString("id-ID")}
                          </p>
                        ) : attachedProduct.priceLabel ? (
                          <p className="text-xs font-semibold text-primary">
                            {attachedProduct.priceLabel}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}
                {replyingTo && (
                  <div className="flex items-center justify-between border-b border-border bg-primary/5 px-4 py-2 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden border-l-2 border-primary pl-2">
                      <Reply className="size-3.5 shrink-0 text-primary" />
                      <div className="truncate">
                        <span className="font-semibold text-text">
                          Membalas{" "}
                          {replyingTo.sender_role === "customer"
                            ? "Anda"
                            : "Admin Support"}
                          :
                        </span>{" "}
                        <span className="italic text-text-secondary truncate">
                          {replyingTo.message}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="rounded-full p-1 text-text-secondary hover:bg-black/5 hover:text-text cursor-pointer">
                      <X className="size-3.5" />
                    </button>
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={draft}
                      maxLength={2000}
                      onChange={(e) => handleDraftChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Tulis pesan..."
                      className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-text outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!draft.trim()}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-transform hover:scale-105 disabled:opacity-40 cursor-pointer">
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating trigger button */}
      <button
        type="button"
        onClick={handleToggle}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 ${
          isOpen ? "bg-red-500 rotate-90" : "bg-primary"
        } text-white cursor-pointer`}>
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
