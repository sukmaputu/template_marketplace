// Real-time synchronization service for template_marketplace
// Handles WebSocket connection to backend ws://127.0.0.1:8080/ws
// and multi-tab synchronization via BroadcastChannel and Storage events.

import type {
  WSChatMessagePayload,
  WSConnectionStatus,
  WSTypingPayload,
  WSPresencePayload,
  WSPresenceQueryPayload,
  WSReadReceiptPayload,
} from "@/types/chat";

export type { WSConnectionStatus };
export type WSCallback<T = unknown> = (payload: T) => void;
export type WSStatusCallback = (status: WSConnectionStatus) => void;

export interface WSEvent<T = unknown> {
  type: string;
  payload?: T;
  [key: string]: unknown;
}

function resolveWsUrl(): string {
  if (import.meta.env.VITE_WEBSOCKET_URL) {
    return import.meta.env.VITE_WEBSOCKET_URL;
  }

  const apiBase = import.meta.env.VITE_API_BASE_URL;
  if (apiBase) {
    try {
      const url = new URL(
        apiBase,
        typeof window !== "undefined"
          ? window.location.origin
          : "http://127.0.0.1:8080",
      );
      const wsProtocol = url.protocol === "https:" ? "wss:" : "ws:";
      return `${wsProtocol}//${url.host}/ws`;
    } catch {
      // ignore
    }
  }

  const host = import.meta.env.VITE_WS_HOST || "127.0.0.1";
  const port = import.meta.env.VITE_WS_PORT || "8080";
  const protocol =
    typeof window !== "undefined" && window.location.protocol === "https:"
      ? "wss:"
      : "ws:";

  return `${protocol}//${host}:${port}/ws`;
}

function parseMessage(data: string): unknown {
  try {
    return JSON.parse(data);
  } catch {
    return { type: "raw", data };
  }
}

class MarketplaceWebSocketService {
  private socket: WebSocket | null = null;
  private listeners = new Set<WSCallback>();
  private typeListeners = new Map<string, Set<WSCallback>>();
  private statusListeners = new Set<WSStatusCallback>();
  private status: WSConnectionStatus = "disconnected";
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private channel: BroadcastChannel | null = null;
  private messageQueue: string[] = [];
  private isManuallyClosed = false;
  private presenceAnnouncer: (() => void) | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      // 1. Cross-tab BroadcastChannel
      try {
        if ("BroadcastChannel" in window) {
          this.channel = new BroadcastChannel("nadrical-marketplace-sync");
          this.channel.onmessage = (event) => {
            if (event.data && typeof event.data === "object") {
              this.dispatchLocal(event.data as WSEvent);
            }
          };
        }
      } catch {
        // BroadcastChannel unavailable
      }

      // 2. Storage event listener (multi-tab in same browser)
      window.addEventListener("storage", (e) => {
        if (e.key && e.key.startsWith("marketplace-addresses")) {
          this.broadcastLocal({ type: "address_updated" });
        } else if (e.key === "auth-user" || e.key === "token") {
          this.broadcastLocal({ type: "auth_updated" });
        }
      });

      // 3. Online/offline reconnect
      window.addEventListener("online", () => {
        if (this.status === "disconnected" || this.status === "reconnecting") {
          this.reconnectAttempts = 0;
          this.connect();
        }
      });

      // Connect immediately in browser
      this.connect();
    }
  }

  public getStatus(): WSConnectionStatus {
    return this.status;
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  private setStatus(next: WSConnectionStatus): void {
    if (this.status !== next) {
      this.status = next;
      this.statusListeners.forEach((cb) => {
        try {
          cb(next);
        } catch (err) {
          console.error("[WebSocket] Status listener error:", err);
        }
      });
    }
  }

  public onStatusChange(callback: WSStatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public setPresenceAnnouncer(handler: () => void): void {
    this.presenceAnnouncer = handler;
  }

  public connect(): void {
    if (typeof window === "undefined") return;

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.CONNECTING ||
        this.socket.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    this.isManuallyClosed = false;
    this.clearReconnectTimer();

    this.setStatus(this.reconnectAttempts > 0 ? "reconnecting" : "connecting");

    try {
      const url = resolveWsUrl();
      this.socket = new WebSocket(url);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus("connected");
        this.startHeartbeat();
        this.flushQueue();
        try {
          this.presenceAnnouncer?.();
        } catch (err) {
          console.error("[WebSocket] Presence announcer error:", err);
        }
      };

      this.socket.onmessage = (event: MessageEvent) => {
        try {
          const raw = typeof event.data === "string" ? event.data : "";
          if (!raw) return;

          const payload = parseMessage(raw);

          // Dispatch locally (notifies listeners, type listeners, and custom DOM events)
          if (payload && typeof payload === "object") {
            this.dispatchLocal(payload as WSEvent);
          }
        } catch (err) {
          console.error("[WebSocket] Message parse error:", err);
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        this.socket = null;

        if (this.isManuallyClosed) {
          this.setStatus("disconnected");
          return;
        }

        this.setStatus("disconnected");
        this.scheduleReconnect();
      };

      this.socket.onerror = (error) => {
        console.warn("[WebSocket] Connection error:", error);
      };
    } catch (err) {
      console.error("[WebSocket] Failed to connect:", err);
      this.socket = null;
      this.setStatus("disconnected");
      this.scheduleReconnect();
    }
  }

  private dispatchLocal(event: WSEvent): void {
    // Notify all global listeners
    this.listeners.forEach((cb) => {
      try {
        cb(event);
      } catch (err) {
        console.error("[WebSocket] Listener error:", err);
      }
    });

    // Notify type listeners
    if (event.type) {
      const typeSet = this.typeListeners.get(event.type);
      if (typeSet) {
        for (const listener of typeSet) {
          try {
            listener(event.payload ?? event);
          } catch (err) {
            console.error(`[WS] Type listener error (${event.type}):`, err);
          }
        }
      }

      // Also trigger specific listeners when receiving a generic data_updated event
      if (event.type === "data_updated" && typeof event.resource === "string") {
        const resourceListenersMap: Record<string, string[]> = {
          vouchers: ["voucher_updated", "vouchers_updated"],
          voucher: ["voucher_updated", "vouchers_updated"],
          products: ["products_updated", "product_updated"],
          product: ["products_updated", "product_updated"],
          categories: ["categories_updated", "category_updated"],
          category: ["categories_updated", "category_updated"],
          taxes: ["tax_updated", "taxes_updated"],
          tax: ["tax_updated", "taxes_updated"],
          settings: ["settings_updated"],
          banners: ["banners_updated"],
          orders: ["order_updated", "order_status_updated"],
          order: ["order_updated", "order_status_updated"],
          addresses: ["address_updated"],
          announcements: ["announcement_updated", "announcements_updated", "announcement"],
          pengumuman: ["announcement_updated", "announcements_updated", "announcement"],
        };
        const mappedTypes = resourceListenersMap[event.resource] || [];
        for (const mappedType of mappedTypes) {
          const mappedSet = this.typeListeners.get(mappedType);
          if (mappedSet) {
            for (const listener of mappedSet) {
              try {
                listener(event.payload ?? event);
              } catch (err) {
                console.error(`[WS] Mapped type listener error (${mappedType}):`, err);
              }
            }
          }
        }
      }

      // Also trigger DOM custom events for easy subscription in components
      if (typeof window !== "undefined") {
        if (
          event.type === "address_updated" ||
          (event.type === "data_updated" && event.resource === "addresses")
        ) {
          window.dispatchEvent(new CustomEvent("marketplace-address-updated"));
        } else if (
          event.type === "order_created" ||
          event.type === "order_updated" ||
          event.type === "order_status_updated" ||
          event.type === "payment_submitted" ||
          (event.type === "data_updated" && event.resource === "orders")
        ) {
          window.dispatchEvent(new CustomEvent("order-history-updated"));
        } else if (
          event.type === "products_updated" ||
          event.type === "product_updated" ||
          (event.type === "data_updated" && event.resource === "products")
        ) {
          window.dispatchEvent(new CustomEvent("products-updated"));
        } else if (
          event.type === "categories_updated" ||
          event.type === "category_updated" ||
          (event.type === "data_updated" && event.resource === "categories")
        ) {
          window.dispatchEvent(new CustomEvent("categories-updated"));
          window.dispatchEvent(new CustomEvent("products-updated"));
        } else if (
          event.type === "voucher_updated" ||
          event.type === "vouchers_updated" ||
          (event.type === "data_updated" && event.resource === "vouchers")
        ) {
          window.dispatchEvent(new CustomEvent("voucher-updated"));
        } else if (
          event.type === "tax_updated" ||
          event.type === "taxes_updated" ||
          (event.type === "data_updated" && event.resource === "taxes")
        ) {
          window.dispatchEvent(new CustomEvent("tax-updated"));
        } else if (
          event.type === "banners_updated" ||
          event.type === "settings_updated" ||
          (event.type === "data_updated" &&
            (event.resource === "settings" || event.resource === "banners"))
        ) {
          window.dispatchEvent(new CustomEvent("banners-updated"));
        } else if (
          event.type === "announcement_updated" ||
          event.type === "announcement" ||
          event.type === "announcements_updated" ||
          (event.type === "data_updated" &&
            (event.resource === "announcements" || event.resource === "pengumuman"))
        ) {
          window.dispatchEvent(new CustomEvent("announcements-updated"));
        }
      }
    }
  }

  public broadcastLocal(event: WSEvent): void {
    // Dispatch in this window
    this.dispatchLocal(event);
    // Send to other tabs via BroadcastChannel
    try {
      this.channel?.postMessage(event);
    } catch {
      // ignore
    }
  }

  public sendToServer(data: unknown): void {
    if (this.isConnected()) {
      try {
        this.socket?.send(typeof data === "string" ? data : JSON.stringify(data));
      } catch {
        // ignore
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.isManuallyClosed || this.reconnectTimer !== null) return;

    const baseDelay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 12000);
    const jitter = Math.random() * 500;
    const delay = Math.round(baseDelay + jitter);

    this.reconnectAttempts++;
    this.setStatus("reconnecting");

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.pingTimer = setInterval(() => {
      if (this.isConnected()) {
        try {
          this.socket?.send(JSON.stringify({ type: "ping" }));
        } catch {
          // ignore
        }
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.pingTimer !== null) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private flushQueue(): void {
    if (!this.isConnected()) return;
    while (this.messageQueue.length > 0) {
      const msg = this.messageQueue.shift();
      if (msg) {
        try {
          this.socket?.send(msg);
        } catch (err) {
          console.error("[WebSocket] Flush error:", err);
          this.messageQueue.unshift(msg);
          break;
        }
      }
    }
  }

  public on<T = unknown>(eventType: string, callback: WSCallback<T>): () => void {
    if (!this.typeListeners.has(eventType)) {
      this.typeListeners.set(eventType, new Set());
    }
    const set = this.typeListeners.get(eventType)!;
    set.add(callback as WSCallback);

    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.connect();
    }

    return () => {
      set.delete(callback as WSCallback);
      if (set.size === 0) {
        this.typeListeners.delete(eventType);
      }
    };
  }

  public onAny(callback: WSCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public onChatMessage(callback: (payload: WSChatMessagePayload) => void): () => void {
    return this.on<WSChatMessagePayload>("chat_message", callback);
  }

  public onTyping(callback: (payload: WSTypingPayload) => void): () => void {
    return this.on<WSTypingPayload>("typing", callback);
  }

  public onPresence(callback: (payload: WSPresencePayload) => void): () => void {
    return this.on<WSPresencePayload>("presence", callback);
  }

  public onPresenceQuery(callback: (payload: WSPresenceQueryPayload) => void): () => void {
    return this.on<WSPresenceQueryPayload>("presence_query", callback);
  }

  public onReadReceipt(callback: (payload: WSReadReceiptPayload) => void): () => void {
    return this.on<WSReadReceiptPayload>("read_receipt", callback);
  }

  public sendReadReceipt(payload: Omit<WSReadReceiptPayload, "type">): void {
    this.send({
      type: "read_receipt",
      ...payload,
    });
  }

  public sendTyping(payload: Omit<WSTypingPayload, "type">): void {
    this.send({
      type: "typing",
      ...payload,
    });
  }

  public sendPresence(payload: Omit<WSPresencePayload, "type">): void {
    this.send({
      type: "presence",
      ...payload,
    });
  }

  public sendPresenceQuery(senderRole: "customer" | "admin" | "agent"): void {
    this.send({
      type: "presence_query",
      sender_role: senderRole,
    });
  }

  public send(payload: unknown): boolean {
    const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
    if (this.isConnected()) {
      try {
        this.socket!.send(raw);
        return true;
      } catch (err) {
        console.error("[WebSocket] Send error, queueing:", err);
      }
    }

    if (this.messageQueue.length < 100) {
      this.messageQueue.push(raw);
    }

    if (!this.socket || this.socket.readyState === WebSocket.CLOSED) {
      this.connect();
    }

    return false;
  }

  public disconnect(): void {
    this.isManuallyClosed = true;
    this.clearReconnectTimer();
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus("disconnected");
  }
}

export const websocketService = new MarketplaceWebSocketService();
export const WebSocketService = MarketplaceWebSocketService;
