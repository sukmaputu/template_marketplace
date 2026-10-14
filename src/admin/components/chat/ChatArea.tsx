import React from "react";
import type { ChatConversation, ChatMessage } from "@/types/chat";
import { ChatHeader } from "./ChatHeader";
import { ChatMessageList } from "./ChatMessageList";
import { ChatComposer } from "./ChatComposer";
import { EmptyChatState } from "./EmptyChatState";

export interface ChatAreaProps {
  conversation: ChatConversation | null;
  messages: ChatMessage[];
  isCustomerOnline: boolean;
  isCustomerTyping: boolean;
  onSendMessage: (text: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  isSending?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  messages,
  isCustomerOnline,
  isCustomerTyping,
  onSendMessage,
  onTypingChange,
  isSending = false,
}) => {
  if (!conversation) {
    return <EmptyChatState />;
  }

  return (
    <div className="flex flex-1 flex-col">
      <ChatHeader
        customerName={conversation.customer_name}
        isOnline={isCustomerOnline}
        isTyping={isCustomerTyping}
      />
      <ChatMessageList
        messages={messages}
        customerName={conversation.customer_name}
        isCustomerTyping={isCustomerTyping}
      />
      <ChatComposer
        onSendMessage={onSendMessage}
        onTypingChange={onTypingChange}
        disabled={isSending}
      />
    </div>
  );
};
