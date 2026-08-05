import { useEffect, useRef, useState } from "react";
import { Search, Send, User } from "lucide-react";

interface ChatMessage {
  id: string | number;
  sender: "customer" | "admin";
  text: string;
  time: string;
}

interface Conversation {
  id: string;
  customerName: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  messages: ChatMessage[];
}

const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    customerName: "I Putu Sukma Widyantara",
    lastMessage: "Kak, pelatihan design grafis masih ada ?",
    lastTime: "09.14",
    unread: 2,
    messages: [
      {
        id: 1,
        sender: "customer",
        text: "Halo, mau tanya, apa ada diskon ?",
        time: "09.14",
      },
    ],
  },
  {
    id: "c2",
    customerName: "Dewi Anjani",
    lastMessage: "Terima kasih infonya ya",
    lastTime: "Kemarin",
    unread: 0,
    messages: [
      {
        id: 1,
        sender: "customer",
        text: "Pelatihan di adakan kapan ya kak ?",
        time: "Kemarin",
      },
      {
        id: 2,
        sender: "admin",
        text: "Akan diinfokan nanti melalui email",
        time: "Kemarin",
      },
      {
        id: 3,
        sender: "customer",
        text: "Terima kasih infonya ya",
        time: "Kemarin",
      },
    ],
  },
];

function now() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [activeId, setActiveId] = useState(conversations[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConversation =
    conversations.find((c) => c.id === activeId) ?? null;

  const filteredConversations = conversations.filter((c) =>
    c.customerName.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [activeConversation?.messages.length, activeId]);

  function handleSend() {
    const text = draft.trim();
    if (!text || !activeConversation) return;

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              lastMessage: text,
              lastTime: now(),
              messages: [
                ...c.messages,
                { id: Date.now(), sender: "admin", text, time: now() },
              ],
            }
          : c,
      ),
    );
    setDraft("");
  }

  return (
    <div className="flex h-[calc(100vh-3rem)] overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex w-80 shrink-0 flex-col border-r border-border">
        <div className="border-b border-border p-4">
          <h1 className="text-lg font-bold text-text">Pesan Customer</h1>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama customer..."
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConversations.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-background ${
                c.id === activeId ? "bg-background" : ""
              }`}>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <User className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-text">
                    {c.customerName}
                  </p>
                  <span className="shrink-0 text-[11px] text-text-secondary">
                    {c.lastTime}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-text-secondary">
                    {c.lastMessage}
                  </p>
                  {c.unread > 0 ? (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
                      {c.unread}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {activeConversation ? (
        <div className="flex flex-1 flex-col">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
              <User className="h-4 w-4" />
            </span>
            <p className="text-sm font-semibold text-text">
              {activeConversation.customerName}
            </p>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {activeConversation.messages.map((msg) => {
              const isAdmin = msg.sender === "admin";
              return (
                <div
                  key={msg.id}
                  className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                      isAdmin
                        ? "rounded-br-sm bg-primary text-white"
                        : "rounded-bl-sm border border-border bg-background text-text"
                    }`}>
                    <p>{msg.text}</p>
                    <p
                      className={`mt-1 text-right text-[11px] ${
                        isAdmin ? "text-white/70" : "text-text-secondary"
                      }`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2 border-t border-border px-4 py-3">
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Balas pesan customer..."
              className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary"
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim()}
              aria-label="Kirim balasan"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-text-secondary">
          Pilih percakapan untuk mulai membalas.
        </div>
      )}
    </div>
  );
}
