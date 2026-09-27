// Real-time synchronization service for template_marketplace
// Handles WebSocket connection to backend ws://127.0.0.1:8080/ws
// and multi-tab synchronization via BroadcastChannel and Storage events.

export type WSConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

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

  if (typeof window !== "undefined") {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const hostname = window.location.hostname || "127.0.0.1";
    return `${protocol}//${hostname}:8080/ws`;
  }

  return "ws://127.0.0.1:8080/ws";
}

function parseMessage(data: string): WSEvent {
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed === "object") {
      return parsed as WSEvent;
    }
  } catch {
    // not JSON
  }
  return { type: "raw", data };
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
    return (
      this.socket !== null && this.socket.readyState === WebSocket.OPEN
    );
  }

  public on(type: string, callback: WSCallback): () => void {
    if (!this.typeListeners.has(type)) {
      this.typeListeners.set(type, new Set());
    }
    this.typeListeners.get(type)!.add(callback);

    return () => {
      const set = this.typeListeners.get(type);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.typeListeners.delete(type);
        }
      }
    };
  }

  public onAny(callback: WSCallback): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  public onStatusChange(callback: WSStatusCallback): () => void {
    this.statusListeners.add(callback);
    callback(this.status);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  private setStatus(newStatus: WSConnectionStatus): void {
    if (this.status === newStatus) return;
    this.status = newStatus;
    for (const listener of this.statusListeners) {
      try {
        listener(newStatus);
      } catch (err) {
        console.error("[WS] Status listener error:", err);
      }
    }
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

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    const wsUrl = resolveWsUrl();
    this.setStatus(
      this.reconnectAttempts > 0 ? "reconnecting" : "connecting",
    );

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus("connected");
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const parsed = parseMessage(event.data);
          this.dispatchLocal(parsed);
        } catch (err) {
          console.error("[WS] Error processing message:", err);
        }
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        this.setStatus("disconnected");
        this.scheduleReconnect();
      };

      this.socket.onerror = () => {
        // Will trigger onclose
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private dispatchLocal(event: WSEvent): void {
    // Notify all listeners
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error("[WS] Listener error:", err);
      }
    }

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

      // Also trigger DOM custom events for easy subscription in legacy/standard components
      if (
        event.type === "address_updated" &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(new CustomEvent("marketplace-address-updated"));
      } else if (
        (event.type === "order_created" ||
          event.type === "order_updated" ||
          event.type === "payment_submitted") &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(new CustomEvent("order-history-updated"));
      } else if (
        event.type === "products_updated" &&
        typeof window !== "undefined"
      ) {
        window.dispatchEvent(new CustomEvent("products-updated"));
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
    // Send to other devices via WebSocket if connected
    if (this.isConnected()) {
      try {
        this.socket?.send(JSON.stringify(event));
      } catch {
        // ignore
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
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
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }
}

export const websocketService = new MarketplaceWebSocketService();
