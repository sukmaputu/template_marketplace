import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import type {
  ChatConversation,
  ChatMessage,
  WSChatMessagePayload,
  WSConnectionStatus,
  WSTypingPayload,
  WSPresencePayload,
  WSPresenceQueryPayload,
  WSReadReceiptPayload,
} from "@/types/chat";
import { chatService } from "@/services/chat.service";
import { websocketService } from "@/lib/websocket";

export interface UseAdminChatResult {
  conversations: ChatConversation[];
  allCount: number;
  activeId: string;
  activeConversation: ChatConversation | null;
  selectConversation: (id: string) => void;
  messages: ChatMessage[];
  sendMessage: (text: string) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  isSending: boolean;
  isCustomerOnline: boolean;
  isCustomerTyping: boolean;
  onlineMap: Record<string, boolean>;
  typingMap: Record<string, boolean>;
  search: string;
  setSearch: (query: string) => void;
  filter: "all" | "unread" | "open";
  setFilter: (filter: "all" | "unread" | "open") => void;
  wsStatus: WSConnectionStatus;
  totalUnread: number;
  refreshConversations: () => void;
}

export function useAdminChat(): UseAdminChatResult {
  const [conversations, setConversations] = useState<ChatConversation[]>(() =>
    chatService.getConversations(),
  );
  const [activeId, setActiveId] = useState<string>(() => {
    const list = chatService.getConversations();
    return list[0]?.id ?? "";
  });
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const list = chatService.getConversations();
    const firstId = list[0]?.id;
    return firstId ? chatService.getMessages(firstId) : [];
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread" | "open">("all");
  const [wsStatus, setWsStatus] = useState<WSConnectionStatus>(() =>
    websocketService.getStatus(),
  );
  const [isSending, setIsSending] = useState(false);

  // Real-time tracking per conversation
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const [onlineMap, setOnlineMap] = useState<Record<string, boolean>>({});
  const lastSeenMapRef = useRef<Record<string, number>>({});

  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef<number>(0);

  // Sync active conversation
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeId) ?? null;
  }, [conversations, activeId]);

  const isCustomerOnline = activeConversation ? !!onlineMap[activeConversation.id] : false;
  const isCustomerTyping = activeConversation ? !!typingMap[activeConversation.id] : false;

  // Manual refresh helper
  const refreshConversations = useCallback(() => {
    const list = chatService.getConversations();
    setConversations(list);
    if (activeId) {
      setMessages(chatService.getMessages(activeId));
    }
  }, [activeId]);

  // Sync active conversation messages whenever activeId changes
  useEffect(() => {
    if (!activeId) {
      setMessages([]);
      return;
    }
    const msgs = chatService.getMessages(activeId);
    setMessages(msgs);
    chatService.markAsRead(activeId);

    // Reset unread count in conversation list
    setConversations((prev) =>
      prev.map((c) => (c.id === activeId ? { ...c, unread_count: 0 } : c)),
    );
  }, [activeId]);

  // Sync WebSocket connection status
  useEffect(() => {
    const unsubscribeStatus = websocketService.onStatusChange((status) => {
      setWsStatus(status);
    });
    return () => {
      unsubscribeStatus();
    };
  }, []);

  // Listen to cross-tab storage changes
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (
        event.key === "marketplace_chat_conversations" ||
        event.key === "marketplace_chat_messages"
      ) {
        refreshConversations();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshConversations]);

  // WebSocket lifecycle: connection, presence, typing, messages
  useEffect(() => {
    const announceAdmin = () => {
      websocketService.sendPresence({
        role: "admin",
        status: "online",
        timestamp: Date.now(),
      });
      websocketService.sendPresenceQuery("admin");
    };

    websocketService.setPresenceAnnouncer(() => {
      announceAdmin();
    });

    websocketService.connect();
    announceAdmin();

    const unsubChat = websocketService.onChatMessage((payload: WSChatMessagePayload) => {
      if (!payload?.message) return;

      const convId = payload.conversation_id;

      // Update conversations list
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === convId);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = {
            ...updated[idx],
            last_message: payload.message.message,
            last_activity_at: payload.message.created_at,
            unread_count:
              activeId === convId ? 0 : (updated[idx].unread_count || 0) + 1,
          };
          return updated;
        }
        return chatService.getConversations();
      });

      // Update active messages if message belongs to active conversation
      if (activeId === convId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === payload.message.id)) return prev;
          return [...prev, payload.message];
        });
        chatService.markAsRead(convId);
      }

      // Customer sent a message -> clear typing, mark online
      if (payload.message.sender_role === "customer") {
        setTypingMap((prev) => ({ ...prev, [convId]: false }));
        setOnlineMap((prev) => ({ ...prev, [convId]: true }));
        lastSeenMapRef.current[convId] = Date.now();
      }
    });

    const unsubTyping = websocketService.onTyping((payload: WSTypingPayload) => {
      if (!payload || payload.sender_role !== "customer") return;

      const currentList = chatService.getConversations();
      const match = currentList.find(
        (c) =>
          c.id === payload.conversation_id ||
          (payload.customer_email && c.customer_email === payload.customer_email) ||
          (payload.customer_user_id && c.customer_user_id === payload.customer_user_id),
      );
      const targetId = match ? match.id : payload.conversation_id;

      if (targetId) {
        setTypingMap((prev) => ({ ...prev, [targetId]: payload.is_typing }));
        setOnlineMap((prev) => ({ ...prev, [targetId]: true }));
        lastSeenMapRef.current[targetId] = Date.now();

        if (payload.is_typing) {
          setTimeout(() => {
            setTypingMap((prev) => ({ ...prev, [targetId]: false }));
          }, 3500);
        }
      }
    });

    const unsubPresence = websocketService.onPresence((payload: WSPresencePayload) => {
      if (!payload || payload.role !== "customer") return;

      const currentList = chatService.getConversations();
      const match = currentList.find(
        (c) =>
          (payload.conversation_id && c.id === payload.conversation_id) ||
          (payload.customer_email && c.customer_email === payload.customer_email) ||
          (payload.customer_user_id && c.customer_user_id === payload.customer_user_id),
      );
      const targetId = match ? match.id : payload.conversation_id;

      if (targetId) {
        lastSeenMapRef.current[targetId] = Date.now();
        setOnlineMap((prev) => ({
          ...prev,
          [targetId]: payload.status === "online",
        }));
      }
    });

    const unsubPresenceQuery = websocketService.onPresenceQuery(
      (payload: WSPresenceQueryPayload) => {
        if (payload && payload.sender_role === "customer") {
          announceAdmin();
        }
      },
    );

    const unsubReadReceipt = websocketService.onReadReceipt((payload: WSReadReceiptPayload) => {
      if (!payload || payload.reader_role !== "customer") return;
      chatService.handleIncomingReadReceipt(payload);

      if (activeId === payload.conversation_id) {
        setMessages((prev) =>
          prev.map((m) =>
            m.sender_role === "admin" ? { ...m, is_read: true } : m,
          ),
        );
      }
    });

    // 20s presence heartbeat
    const heartbeatTimer = setInterval(() => {
      announceAdmin();
    }, 20000);

    // 5s sweep dead-peer timeout
    const sweepTimer = setInterval(() => {
      const now = Date.now();
      setOnlineMap((prev) => {
        let hasChanges = false;
        const next = { ...prev };
        for (const [convId, isOnline] of Object.entries(next)) {
          if (isOnline) {
            const lastSeen = lastSeenMapRef.current[convId] || 0;
            if (lastSeen > 0 && now - lastSeen > 35000) {
              next[convId] = false;
              hasChanges = true;
            }
          }
        }
        return hasChanges ? next : prev;
      });
    }, 5000);

    const handleBeforeUnload = () => {
      websocketService.sendPresence({
        role: "admin",
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
  }, [activeId]);

  const selectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeId) return;
      const now = Date.now();

      if (isTyping) {
        if (now - lastTypingSentRef.current > 1800) {
          lastTypingSentRef.current = now;
          websocketService.sendTyping({
            conversation_id: activeId,
            sender_role: "admin",
            sender_name: "Admin",
            is_typing: true,
          });
        }

        if (typingTimerRef.current) {
          clearTimeout(typingTimerRef.current);
        }
        typingTimerRef.current = setTimeout(() => {
          websocketService.sendTyping({
            conversation_id: activeId,
            sender_role: "admin",
            sender_name: "Admin",
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
          conversation_id: activeId,
          sender_role: "admin",
          sender_name: "Admin",
          is_typing: false,
        });
      }
    },
    [activeId],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !activeId) return;

      // Stop any pending typing state
      lastTypingSentRef.current = 0;
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      websocketService.sendTyping({
        conversation_id: activeId,
        sender_role: "admin",
        sender_name: "Admin",
        is_typing: false,
      });

      setIsSending(true);
      try {
        const sentMsg = chatService.sendAdminMessage(activeId, trimmed);
        setMessages((prev) => [...prev, sentMsg]);

        // Update conversation in list
        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeId
              ? {
                  ...c,
                  last_message: trimmed,
                  last_activity_at: sentMsg.created_at,
                }
              : c,
          ),
        );
      } finally {
        setIsSending(false);
      }
    },
    [activeId],
  );

  const filteredConversations = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      const matchQuery =
        !q ||
        c.customer_name.toLowerCase().includes(q) ||
        (c.customer_email && c.customer_email.toLowerCase().includes(q)) ||
        (c.last_message && c.last_message.toLowerCase().includes(q));

      if (!matchQuery) return false;

      if (filter === "unread") return (c.unread_count || 0) > 0;
      if (filter === "open") return c.status === "open" || c.status === "active";
      return true;
    });
  }, [conversations, search, filter]);

  const totalUnread = useMemo(() => {
    return conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);
  }, [conversations]);

  return {
    conversations: filteredConversations,
    allCount: conversations.length,
    activeId,
    activeConversation,
    selectConversation,
    messages,
    sendMessage,
    sendTyping,
    isSending,
    isCustomerOnline,
    isCustomerTyping,
    onlineMap,
    typingMap,
    search,
    setSearch,
    filter,
    setFilter,
    wsStatus,
    totalUnread,
    refreshConversations,
  };
}
