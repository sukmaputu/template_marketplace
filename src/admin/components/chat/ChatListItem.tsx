import React from "react";
import { User } from "lucide-react";
import type { ChatConversation } from "@/types/chat";
import { formatChatTime } from "./formatChatTime";

export interface ChatListItemProps {
  conversation: ChatConversation;
  isActive: boolean;
  isOnline: boolean;
  isTyping: boolean;
  onClick: () => void;
}

export const ChatListItem: React.FC<ChatListItemProps> = React.memo(
  ({ conversation, isActive, isOnline, isTyping, onClick }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left hover:bg-background cursor-pointer transition-colors ${
          isActive ? "bg-background" : ""
        }`}
      >
        <div className="relative shrink-0">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white">
            <User className="h-5 w-5" />
          </span>
          <span
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-surface ${
              isOnline ? "bg-secondary" : "bg-gray-400"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-text">
              {conversation.customer_name}
            </p>
            <span className="shrink-0 text-[11px] text-text-secondary">
              {formatChatTime(conversation.last_activity_at)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-xs text-text-secondary">
              {isTyping ? (
                <span className="text-primary italic">Sedang mengetik...</span>
              ) : (
                conversation.last_message || "Belum ada pesan"
              )}
            </p>
            {(conversation.unread_count ?? 0) > 0 ? (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
                {conversation.unread_count}
              </span>
            ) : null}
          </div>
        </div>
      </button>
    );
  },
);

ChatListItem.displayName = "ChatListItem";
