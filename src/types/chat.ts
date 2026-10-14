export type ChatSenderRole = "customer" | "agent" | "admin" | "bot";

export interface ProductChatContext {
  id?: string;
  name: string;
  price: number;
  currency?: string;
  category?: string;
  image?: string;
  url?: string;
}

export interface ChatReply {
  id: string;
  sender_role: string;
  message: string;
}

export interface ChatMessage {
  id: string | number;
  conversation_id: string;
  sender_user_id?: string | null;
  sender_role: ChatSenderRole;
  sender_name?: string;
  sender_avatar?: string;
  message: string;
  reply_to_id?: string | null;
  reply_to?: ChatReply | null;
  product_context?: ProductChatContext;
  is_read?: boolean;
  created_at: string;
}

export interface ChatConversation {
  id: string;
  customer_user_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
  is_guest?: boolean;
  status: "open" | "active" | "resolved" | "closed";
  created_at: string;
  last_activity_at: string;
  customer_read_at?: string | null;
  agent_read_at?: string | null;
  closed_at?: string | null;
  messages: ChatMessage[];
  last_message?: string;
  unread_count?: number;
  product_context?: ProductChatContext;
}

export interface ChatIdentity {
  customer_user_id?: string | null;
  customer_name: string;
  customer_email?: string | null;
  customer_phone?: string | null;
}

export interface WSChatMessagePayload {
  type: "chat_message";
  conversation_id: string;
  customer_email?: string | null;
  customer_user_id?: string | null;
  conversation?: Partial<ChatConversation>;
  message: ChatMessage;
}

export type WSConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

export interface WSTypingPayload {
  type: "typing";
  conversation_id: string;
  sender_role: "customer" | "admin" | "agent";
  sender_name?: string;
  customer_email?: string;
  customer_user_id?: string;
  is_typing: boolean;
}

export interface WSPresencePayload {
  type: "presence";
  role: "customer" | "admin" | "agent";
  conversation_id?: string;
  user_id?: string | null;
  customer_email?: string;
  customer_user_id?: string;
  user_name?: string;
  status: "online" | "offline";
  timestamp: number;
}

export interface WSPresenceQueryPayload {
  type: "presence_query";
  sender_role: "customer" | "admin" | "agent";
}

export interface WSReadReceiptPayload {
  type: "read_receipt";
  conversation_id: string;
  reader_role: "customer" | "admin" | "agent";
  reader_id?: string | null;
  customer_email?: string | null;
  customer_user_id?: string | null;
  read_at: string;
}
