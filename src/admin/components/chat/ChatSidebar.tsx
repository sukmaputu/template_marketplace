import React from "react";
import { Search } from "lucide-react";
import type { ChatConversation } from "@/types/chat";
import { ChatListItem } from "./ChatListItem";

export interface ChatSidebarProps {
  conversations: ChatConversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  onlineMap: Record<string, boolean>;
  typingMap: Record<string, boolean>;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  search,
  onSearchChange,
  onlineMap,
  typingMap,
}) => {
  return (
    <div className="flex w-80 shrink-0 flex-col border-r border-border">
      <div className="border-b border-border p-4">
        <h1 className="text-lg font-bold text-text">Pesan Customer</h1>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Cari nama customer..."
            className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-text-secondary">
            Tidak ada percakapan ditemukan.
          </div>
        ) : (
          conversations.map((c) => (
            <ChatListItem
              key={c.id}
              conversation={c}
              isActive={c.id === activeId}
              isOnline={!!onlineMap[c.id]}
              isTyping={!!typingMap[c.id]}
              onClick={() => onSelectConversation(c.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
