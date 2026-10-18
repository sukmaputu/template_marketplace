import { websocketService } from "@/lib/websocket";
import type {
  ChatConversation,
  ChatIdentity,
  ChatMessage,
  ProductChatContext,
  WSChatMessagePayload,
  WSReadReceiptPayload,
} from "@/types/chat";

const CONVERSATIONS_KEY = "marketplace_chat_conversations";
const MESSAGES_KEY = "marketplace_chat_messages";
const GUEST_ID_KEY = "marketplace_chat_guest_id";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080/api/v1";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id?: string | null): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id.trim());
}

export function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const BOT_REPLIES = [
  "Halo! Terima kasih telah menghubungi kami. Tim kami akan segera merespons pertanyaan Anda.",
  "Pertanyaan Anda sudah kami catat. Mohon tunggu sebentar ya!",
  "Stok produk kami selalu kami update berkala. Ada hal lain yang bisa kami bantu?",
];

const INITIAL_CONVERSATION: ChatConversation = {
  id: "34343434-1111-1111-1111-343434343401",
  customer_name: "I Putu Sukma Widyantara",
  customer_email: "sukma@email.com",
  customer_phone: "+62 812-3456-7890",
  status: "open",
  created_at: new Date(Date.now() - 3600000).toISOString(),
  last_activity_at: new Date(Date.now() - 900000).toISOString(),
  unread_count: 1,
  last_message: "Kak, pelatihan design grafis masih ada?",
  messages: [
    {
      id: "56565656-1111-1111-1111-565656565601",
      conversation_id: "34343434-1111-1111-1111-343434343401",
      sender_role: "customer",
      message: "Kak, pelatihan design grafis masih ada?",
      created_at: new Date(Date.now() - 900000).toISOString(),
      is_read: false,
    },
  ],
};

function loadStorage(): { conversations: ChatConversation[]; messages: ChatMessage[] } {
  try {
    const rawC = localStorage.getItem(CONVERSATIONS_KEY);
    const rawM = localStorage.getItem(MESSAGES_KEY);

    if (rawC) {
      const conversations = JSON.parse(rawC) as ChatConversation[];
      const messages = rawM ? (JSON.parse(rawM) as ChatMessage[]) : [];
      return { conversations, messages };
    }
  } catch {
    // ignore
  }

  return {
    conversations: [INITIAL_CONVERSATION],
    messages: [...INITIAL_CONVERSATION.messages],
  };
}

function saveStorage(conversations: ChatConversation[], messages: ChatMessage[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
    localStorage.setItem(MESSAGES_KEY, JSON.stringify(messages));
  } catch {
    // storage not available
  }
}

class ChatService {
  public getGuestId(): string {
    try {
      const existing = localStorage.getItem(GUEST_ID_KEY);
      if (existing) return existing;
      const id = generateUUID();
      localStorage.setItem(GUEST_ID_KEY, id);
      return id;
    } catch {
      return generateUUID();
    }
  }

  public getConversations(): ChatConversation[] {
    const { conversations, messages } = loadStorage();
    return conversations.map((conv) => ({
      ...conv,
      messages: messages.filter((m) => m.conversation_id === conv.id),
      last_message:
        messages
          .filter((m) => m.conversation_id === conv.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.message ||
        conv.last_message ||
        "",
      unread_count: messages.filter(
        (m) => m.conversation_id === conv.id && m.sender_role === "customer" && !m.is_read,
      ).length,
    }));
  }

  public getMessages(conversationId: string): ChatMessage[] {
    const { messages } = loadStorage();
    return messages
      .filter((m) => m.conversation_id === conversationId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public getLocalMessagesPage(
    conversationId: string,
    limit = 20,
    before?: string,
  ): { messages: ChatMessage[]; hasMore: boolean } {
    let all = this.getMessages(conversationId);
    if (before) {
      const beforeMs = new Date(before).getTime();
      all = all.filter((m) => new Date(m.created_at).getTime() < beforeMs);
    }
    const startIndex = Math.max(0, all.length - limit);
    const paged = all.slice(startIndex);
    const hasMore = startIndex > 0;
    return {
      messages: paged,
      hasMore,
    };
  }

  public async fetchMessagesPage(
    conversationId: string,
    limit = 20,
    before?: string,
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      conversationId,
    );
    if (!isUUID) {
      return this.getLocalMessagesPage(conversationId, limit, before);
    }

    try {
      let url = `${API_BASE}/ecommerce/chats/${conversationId}/messages?limit=${limit}`;
      if (before) {
        url += `&before=${encodeURIComponent(before)}`;
      }

      const res = await fetch(url, {
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        return this.getLocalMessagesPage(conversationId, limit, before);
      }

      const json = await res.json();
      const remoteMsgs = json?.data;
      if (!Array.isArray(remoteMsgs)) {
        return this.getLocalMessagesPage(conversationId, limit, before);
      }

      const mappedMsgs: ChatMessage[] = remoteMsgs.map((rm) => ({
        id: rm.id,
        conversation_id: conversationId,
        sender_role: rm.sender_role,
        sender_user_id: rm.sender_user_id || null,
        sender_name: rm.sender_name,
        sender_avatar: rm.sender_avatar,
        message: rm.message,
        reply_to_id: rm.reply_to_id || null,
        reply_to: rm.reply_to || null,
        is_read: rm.is_read,
        created_at: rm.created_at,
      }));

      // Cache into local storage
      const { conversations, messages } = loadStorage();
      const merged = [...messages];
      for (const msg of mappedMsgs) {
        const idx = merged.findIndex((m) => m.id === msg.id);
        if (idx !== -1) {
          merged[idx] = msg;
        } else {
          merged.push(msg);
        }
      }
      saveStorage(conversations, merged);

      const hasMore =
        typeof json?.meta?.has_more === "boolean"
          ? json.meta.has_more
          : mappedMsgs.length >= limit;

      return {
        messages: mappedMsgs,
        hasMore,
      };
    } catch (err) {
      console.warn("[ChatService] Failed to fetch paged messages:", err);
      return this.getLocalMessagesPage(conversationId, limit, before);
    }
  }

  /**
   * Ensure or start conversation session both locally and with backend PostgreSQL DB
   */
  public ensureConversation(identity: ChatIdentity): ChatConversation {
    const { conversations, messages } = loadStorage();
    const normalizedEmail = identity.customer_email?.trim().toLowerCase();
    const normalizedPhone = identity.customer_phone?.trim();
    const effectiveUserId = identity.customer_user_id || this.getGuestId();

    // Match by user id or fallback to email/phone or name
    const existingIndex = conversations.findIndex(
      (c) =>
        (identity.customer_user_id && c.customer_user_id === identity.customer_user_id) ||
        (normalizedEmail && c.customer_email?.trim().toLowerCase() === normalizedEmail) ||
        (normalizedPhone && c.customer_phone?.trim() === normalizedPhone) ||
        (c.customer_name === identity.customer_name &&
          c.customer_name !== "Tamu" &&
          c.customer_name !== "Pelanggan Tamu"),
    );

    let activeConv: ChatConversation;

    if (existingIndex !== -1) {
      const existing = conversations[existingIndex];
      const isRealUser = identity.customer_user_id && !identity.customer_user_id.startsWith("guest-");
      if (isRealUser && existing.customer_user_id !== identity.customer_user_id) {
        const updated: ChatConversation = {
          ...existing,
          customer_user_id: identity.customer_user_id,
          customer_name: identity.customer_name || existing.customer_name,
          customer_email: identity.customer_email ?? existing.customer_email,
          customer_phone: identity.customer_phone ?? existing.customer_phone,
          is_guest: false,
        };
        conversations[existingIndex] = updated;
        saveStorage(conversations, messages);
        activeConv = updated;
      } else {
        activeConv = existing;
      }
    } else {
      const now = new Date().toISOString();
      const isGuest = !identity.customer_user_id || identity.customer_user_id.startsWith("guest-");
      const newConv: ChatConversation = {
        id: generateUUID(),
        customer_user_id: effectiveUserId,
        customer_name: identity.customer_name || "Tamu",
        customer_email: identity.customer_email || null,
        customer_phone: identity.customer_phone || null,
        is_guest: isGuest,
        status: "open",
        created_at: now,
        last_activity_at: now,
        unread_count: 0,
        messages: [],
      };

      conversations.unshift(newConv);
      saveStorage(conversations, messages);
      activeConv = newConv;
    }

    // Asynchronously synchronize conversation and historical messages with PostgreSQL backend
    this.syncConversationRemote(identity, activeConv);

    return activeConv;
  }

  private async syncConversationRemote(identity: ChatIdentity, localConv: ChatConversation): Promise<ChatConversation> {
    try {
      const res = await fetch(`${API_BASE}/ecommerce/chats`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_user_id:
            identity.customer_user_id && !identity.customer_user_id.startsWith("guest-")
              ? identity.customer_user_id
              : null,
          customer_name: identity.customer_name || localConv.customer_name || "Tamu",
          customer_email: identity.customer_email || localConv.customer_email || "",
          customer_phone: identity.customer_phone || localConv.customer_phone || "",
        }),
      });

      if (!res.ok) return localConv;
      const data = await res.json();
      const remoteConv = data?.data;
      if (!remoteConv || !remoteConv.id) return localConv;

      const { conversations, messages } = loadStorage();
      const oldId = localConv.id;
      const remoteId = remoteConv.id;

      // Update conversation with remote canonical DB id and properties
      let updatedConversations = conversations.map((c) => {
        if (c.id === oldId || c.id === remoteId) {
          return {
            ...c,
            id: remoteId,
            customer_name: remoteConv.customer_name || c.customer_name,
            customer_email: remoteConv.customer_email || c.customer_email,
            customer_phone: remoteConv.customer_phone || c.customer_phone,
            is_guest: remoteConv.is_guest ?? c.is_guest,
            status: remoteConv.status || c.status,
            last_activity_at: remoteConv.last_activity_at || c.last_activity_at,
          };
        }
        return c;
      });

      // Re-map messages to the canonical database conversation ID
      let updatedMessages = messages.map((m) => {
        if (m.conversation_id === oldId) {
          return { ...m, conversation_id: remoteId };
        }
        return m;
      });

      // Merge messages from remote DB if available
      if (Array.isArray(remoteConv.messages) && remoteConv.messages.length > 0) {
        for (const rm of remoteConv.messages) {
          const exists = updatedMessages.some((m) => m.id === rm.id);
          if (!exists) {
            updatedMessages.push({
              id: rm.id,
              conversation_id: remoteId,
              sender_role: rm.sender_role,
              sender_user_id: rm.sender_user_id || null,
              sender_name: rm.sender_name,
              sender_avatar: rm.sender_avatar,
              message: rm.message,
              reply_to_id: rm.reply_to_id || null,
              reply_to: rm.reply_to || null,
              is_read: rm.is_read,
              created_at: rm.created_at,
            });
          }
        }
      }

      saveStorage(updatedConversations, updatedMessages);
      const active = updatedConversations.find((c) => c.id === remoteId);
      return active || { ...localConv, id: remoteId };
    } catch (err) {
      // Offline fallback: graceful resilience
      console.warn("[ChatService] Failed to sync with backend DB:", err);
      return localConv;
    }
  }

  public async ensureConversationAsync(identity: ChatIdentity): Promise<ChatConversation> {
    const local = this.ensureConversation(identity);
    try {
      const synced = await this.syncConversationRemote(identity, local);
      return synced || local;
    } catch {
      return local;
    }
  }

  public sendCustomerMessage(
    identity: ChatIdentity,
    text: string,
    productContext?: ProductChatContext,
    replyTo?: ChatMessage | null,
  ): { conversation: ChatConversation; message: ChatMessage } {
    const conversation = this.ensureConversation(identity);
    const { conversations, messages } = loadStorage();
    const now = new Date().toISOString();
    const msgId = generateUUID();

    const replyData = replyTo
      ? {
          id: String(replyTo.id),
          sender_role: replyTo.sender_role,
          message: replyTo.message,
        }
      : null;

    const newMsg: ChatMessage = {
      id: msgId,
      conversation_id: conversation.id,
      sender_role: "customer",
      sender_user_id: identity.customer_user_id || null,
      message: text,
      reply_to_id: replyTo ? String(replyTo.id) : null,
      reply_to: replyData,
      product_context: productContext,
      is_read: false,
      created_at: now,
    };

    const nextMessages = [...messages, newMsg];
    const convIndex = conversations.findIndex((c) => c.id === conversation.id);
    let updatedConv = { ...conversation };

    if (convIndex !== -1) {
      updatedConv = {
        ...conversations[convIndex],
        last_message: text,
        last_activity_at: now,
        unread_count: (conversations[convIndex].unread_count || 0) + 1,
        product_context: productContext || conversations[convIndex].product_context,
      };
      conversations[convIndex] = updatedConv;
    }

    saveStorage(conversations, nextMessages);

    // 1. Broadcast over WebSocket for immediate realtime admin update
    const payload: WSChatMessagePayload = {
      type: "chat_message",
      conversation_id: conversation.id,
      customer_email: identity.customer_email || conversation.customer_email || undefined,
      customer_phone: identity.customer_phone || conversation.customer_phone || undefined,
      customer_user_id: identity.customer_user_id || conversation.customer_user_id || undefined,
      conversation: updatedConv,
      message: newMsg,
    };
    websocketService.send(payload);

    // 2. Persist message to backend PostgreSQL database via REST API
    this.persistMessageRemote(conversation.id, text, identity, replyTo ? String(replyTo.id) : undefined);

    // 3. If WebSocket is offline, provide mock bot response fallback
    if (!websocketService.isConnected()) {
      setTimeout(() => {
        const botReply = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
        const botMsg: ChatMessage = {
          id: generateUUID(),
          conversation_id: conversation.id,
          sender_role: "bot",
          message: botReply,
          created_at: new Date().toISOString(),
          is_read: true,
        };
        const currentData = loadStorage();
        saveStorage(currentData.conversations, [...currentData.messages, botMsg]);
      }, 1500);
    }

    return { conversation: updatedConv, message: newMsg };
  }

  private async persistMessageRemote(
    conversationId: string,
    messageText: string,
    identity: ChatIdentity,
    replyToId?: string,
  ): Promise<void> {
    try {
      let targetConvId = conversationId;
      if (!isValidUUID(targetConvId)) {
        const synced = await this.ensureConversationAsync(identity);
        if (synced && isValidUUID(synced.id)) {
          targetConvId = synced.id;
        } else {
          return;
        }
      }

      await fetch(`${API_BASE}/ecommerce/chats/${targetConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender_role: "customer",
          sender_user_id:
            identity.customer_user_id && !identity.customer_user_id.startsWith("guest-")
              ? identity.customer_user_id
              : null,
          message: messageText,
          reply_to_id: replyToId || undefined,
        }),
      });
    } catch (err) {
      console.warn("[ChatService] Failed to persist message to PostgreSQL:", err);
    }
  }

  public sendAdminMessage(conversationId: string, text: string): ChatMessage {
    const { conversations, messages } = loadStorage();
    const now = new Date().toISOString();
    const msgId = generateUUID();

    const newMsg: ChatMessage = {
      id: msgId,
      conversation_id: conversationId,
      sender_role: "admin",
      message: text,
      is_read: true,
      created_at: now,
    };

    const nextMessages = [...messages, newMsg];
    const convIndex = conversations.findIndex((c) => c.id === conversationId);

    if (convIndex !== -1) {
      conversations[convIndex] = {
        ...conversations[convIndex],
        last_message: text,
        last_activity_at: now,
        agent_read_at: now,
      };
    }

    saveStorage(conversations, nextMessages);

    // Broadcast over WebSocket to customer
    const payload: WSChatMessagePayload = {
      type: "chat_message",
      conversation_id: conversationId,
      message: newMsg,
    };
    websocketService.send(payload);

    return newMsg;
  }

  public handleIncomingWSMessage(payload: WSChatMessagePayload): {
    updatedConversation: ChatConversation;
    updatedMessages: ChatMessage[];
  } {
    const { conversations, messages } = loadStorage();
    const { conversation_id, message, conversation: incomingConv } = payload;

    const existingMsgIndex = messages.findIndex((m) => m.id === message.id);
    let nextMessages = [...messages];
    if (existingMsgIndex === -1) {
      nextMessages.push(message);
    } else {
      nextMessages[existingMsgIndex] = message;
    }

    let convIndex = conversations.findIndex((c) => c.id === conversation_id);
    let targetConv: ChatConversation;

    if (convIndex !== -1) {
      targetConv = {
        ...conversations[convIndex],
        last_message: message.message,
        last_activity_at: message.created_at || new Date().toISOString(),
        unread_count:
          message.sender_role === "customer"
            ? (conversations[convIndex].unread_count || 0) + 1
            : conversations[convIndex].unread_count,
        product_context: message.product_context || conversations[convIndex].product_context,
      };
      conversations[convIndex] = targetConv;
    } else {
      targetConv = {
        id: conversation_id,
        customer_name: incomingConv?.customer_name || "Pelanggan Baru",
        customer_email: incomingConv?.customer_email || null,
        customer_phone: incomingConv?.customer_phone || null,
        is_guest: !incomingConv?.customer_user_id,
        customer_user_id: incomingConv?.customer_user_id || null,
        status: "open",
        created_at: incomingConv?.created_at || message.created_at || new Date().toISOString(),
        last_activity_at: message.created_at || new Date().toISOString(),
        unread_count: message.sender_role === "customer" ? 1 : 0,
        last_message: message.message,
        messages: [message],
        product_context: message.product_context,
      };
      conversations.unshift(targetConv);
    }

    saveStorage(conversations, nextMessages);
    return { updatedConversation: targetConv, updatedMessages: nextMessages };
  }

  public markAsRead(
    conversationId: string,
    readerRole: "admin" | "customer" = "admin",
  ): void {
    const { conversations, messages } = loadStorage();
    let changed = false;
    const now = new Date().toISOString();

    const nextMessages = messages.map((m) => {
      const isOpposite =
        readerRole === "admin"
          ? m.sender_role === "customer"
          : m.sender_role === "admin" || m.sender_role === "agent";
      if (m.conversation_id === conversationId && isOpposite && !m.is_read) {
        changed = true;
        return { ...m, is_read: true };
      }
      return m;
    });

    const convIndex = conversations.findIndex((c) => c.id === conversationId);
    if (convIndex !== -1) {
      if (readerRole === "admin") {
        conversations[convIndex] = {
          ...conversations[convIndex],
          unread_count: 0,
          agent_read_at: now,
        };
      } else {
        conversations[convIndex] = {
          ...conversations[convIndex],
          customer_read_at: now,
        };
      }
      changed = true;
    }

    if (changed) {
      saveStorage(conversations, nextMessages);
    }

    // 1. Broadcast read receipt over WebSocket
    websocketService.sendReadReceipt({
      conversation_id: conversationId,
      reader_role: readerRole,
      read_at: now,
    });

    // 2. Persist read status to backend PostgreSQL DB
    fetch(`${API_BASE}/ecommerce/chats/${conversationId}/read?reader=${readerRole}`, {
      method: "POST",
    }).catch(() => {
      // offline silent ignore
    });
  }

  public handleIncomingReadReceipt(payload: WSReadReceiptPayload): {
    updatedMessages: ChatMessage[];
  } {
    const { conversations, messages } = loadStorage();
    const { conversation_id, reader_role } = payload;
    let changed = false;

    // Reader read messages sent by opposite role
    const nextMessages = messages.map((m) => {
      const isOpposite =
        reader_role === "admin"
          ? m.sender_role === "admin" || m.sender_role === "agent"
          : m.sender_role === "customer";
      if (m.conversation_id === conversation_id && isOpposite && !m.is_read) {
        changed = true;
        return { ...m, is_read: true };
      }
      return m;
    });

    if (changed) {
      saveStorage(conversations, nextMessages);
    }

    return {
      updatedMessages: nextMessages.filter((m) => m.conversation_id === conversation_id),
    };
  }

  public transferGuestHistory(user: {
    id?: string | number;
    email: string;
    phone?: string;
    full_name?: string;
  }): { transferred: boolean; conversation?: ChatConversation } {
    const { conversations, messages } = loadStorage();
    const normalizedEmail = (user.email || "").trim().toLowerCase();
    const normalizedPhone = (user.phone || "").trim();
    const targetUserId = user.id ? String(user.id) : (user.email || "");

    const guestConvIndex = conversations.findIndex((c) => {
      if (c.customer_user_id === targetUserId) return false;
      const emailMatch =
        normalizedEmail && c.customer_email?.trim().toLowerCase() === normalizedEmail;
      const phoneMatch =
        normalizedPhone && c.customer_phone?.trim() === normalizedPhone;
      return emailMatch || phoneMatch;
    });

    // Also persist transfer to backend PostgreSQL DB
    fetch(`${API_BASE}/ecommerce/chats/transfer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: user.email,
        phone: user.phone || "",
        customer_user_id: user.id || "00000000-0000-0000-0000-000000000000",
        customer_name: user.full_name,
      }),
    }).catch((err) => {
      console.warn("[ChatService] Backend transfer error:", err);
    });

    if (guestConvIndex === -1) {
      return { transferred: false };
    }

    const targetConv = conversations[guestConvIndex];
    const updatedConv: ChatConversation = {
      ...targetConv,
      customer_user_id: targetUserId,
      customer_name: user.full_name || targetConv.customer_name,
      customer_email: user.email || targetConv.customer_email,
      customer_phone: user.phone || targetConv.customer_phone,
      is_guest: false,
    };

    conversations[guestConvIndex] = updatedConv;

    // Update customer messages to carry customer_user_id
    const nextMessages = messages.map((m) => {
      if (m.conversation_id === updatedConv.id && m.sender_role === "customer") {
        return { ...m, sender_user_id: targetUserId };
      }
      return m;
    });

    saveStorage(conversations, nextMessages);

    // Announce authenticated customer presence over WebSocket
    websocketService.sendPresence({
      role: "customer",
      conversation_id: updatedConv.id,
      user_id: targetUserId,
      customer_user_id: targetUserId,
      customer_email: updatedConv.customer_email || undefined,
      user_name: updatedConv.customer_name,
      status: "online",
      timestamp: Date.now(),
    });

    // Broadcast updated conversation over WebSocket to Admin so badge/details update in real-time
    websocketService.send({
      type: "chat_message",
      conversation_id: updatedConv.id,
      conversation: updatedConv,
      message: {
        id: generateUUID(),
        conversation_id: updatedConv.id,
        sender_role: "customer",
        sender_user_id: targetUserId,
        message: `[Akun Terdaftar: ${updatedConv.customer_name}]`,
        created_at: new Date().toISOString(),
        is_read: true,
      },
    });

    return { transferred: true, conversation: updatedConv };
  }

  public updateStatus(conversationId: string, status: ChatConversation["status"]): void {
    const { conversations, messages } = loadStorage();
    const convIndex = conversations.findIndex((c) => c.id === conversationId);
    if (convIndex !== -1) {
      conversations[convIndex] = {
        ...conversations[convIndex],
        status,
        closed_at: status === "closed" || status === "resolved" ? new Date().toISOString() : null,
      };
      saveStorage(conversations, messages);
    }
  }
}

export const chatService = new ChatService();
