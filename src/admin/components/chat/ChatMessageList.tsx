import React, { useCallback, useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/types/chat";
import { ChatMessageBubble } from "./ChatMessageBubble";

export interface ChatMessageListProps {
  messages: ChatMessage[];
  customerName: string;
  isCustomerTyping: boolean;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  customerName,
  isCustomerTyping,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages.length, isCustomerTyping]);

  const scrollToMessage = useCallback((messageId: string) => {
    const el = document.getElementById(`admin-msg-${messageId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId((cur) => (cur === messageId ? null : cur));
      }, 2000);
    }
  }, []);

  return (
    <div
      ref={scrollRef}
      className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
    >
      {messages.map((msg) => (
        <ChatMessageBubble
          key={msg.id}
          message={msg}
          isHighlighted={highlightedMessageId === msg.id}
          onScrollToMessage={scrollToMessage}
        />
      ))}

      {isCustomerTyping && (
        <div className="flex justify-start">
          <p className="text-xs text-text-secondary italic">
            {customerName} sedang mengetik...
          </p>
        </div>
      )}
    </div>
  );
};

