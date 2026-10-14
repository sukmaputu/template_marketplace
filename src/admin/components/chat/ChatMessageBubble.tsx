import React from "react";
import { CheckCheck } from "lucide-react";
import type { ChatMessage } from "@/types/chat";
import { formatChatTime } from "./formatChatTime";

export interface ChatMessageBubbleProps {
  message: ChatMessage;
  isHighlighted?: boolean;
  onScrollToMessage?: (messageId: string) => void;
}

export const ChatMessageBubble: React.FC<ChatMessageBubbleProps> = React.memo(
  ({ message, isHighlighted, onScrollToMessage }) => {
    const isAdmin = message.sender_role === "admin";

    return (
      <div className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
        <div
          id={`admin-msg-${message.id}`}
          className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm transition-all duration-300 ${
            isHighlighted
              ? isAdmin
                ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-background brightness-110 shadow-lg animate-pulse scale-[1.01]"
                : "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/20 shadow-lg animate-pulse scale-[1.01]"
              : ""
          } ${
            isAdmin
              ? "rounded-br-sm bg-primary text-white"
              : "rounded-bl-sm border border-border bg-background text-text"
          }`}
        >
          {message.reply_to && (
            <div
              role="button"
              tabIndex={0}
              title="Menuju ke pesan asli"
              onClick={(e) => {
                e.stopPropagation();
                const targetId = message.reply_to_id || message.reply_to?.id;
                if (targetId && onScrollToMessage) {
                  onScrollToMessage(targetId);
                }
              }}
              className={`mb-1.5 rounded-lg border-l-2 p-1.5 text-xs cursor-pointer select-none transition-all hover:opacity-85 active:scale-[0.98] ${
                isAdmin
                  ? "border-white/80 bg-white/15 text-white/90 hover:bg-white/25"
                  : "border-primary bg-primary/5 text-text-secondary hover:bg-primary/10"
              }`}
            >
              <p className="font-semibold text-[10px]">
                {message.reply_to.sender_role === "admin" ? "Admin" : "Pelanggan"}
              </p>
              <p className="line-clamp-1 italic text-[11px]">{message.reply_to.message}</p>
            </div>
          )}
          <p className="whitespace-pre-wrap break-words">{message.message}</p>
          <div
            className={`mt-1 flex items-center justify-end gap-1 text-[11px] ${
              isAdmin ? "text-white/70" : "text-text-secondary"
            }`}
          >
            <span>{formatChatTime(message.created_at)}</span>
            {isAdmin && (
              <CheckCheck
                className={`size-3.5 ${
                  message.is_read ? "text-sky-300" : "text-white/50"
                }`}
              />
            )}
          </div>
        </div>
      </div>
    );
  },
);

ChatMessageBubble.displayName = "ChatMessageBubble";

