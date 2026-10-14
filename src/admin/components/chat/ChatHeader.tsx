import React from "react";
import { User } from "lucide-react";

export interface ChatHeaderProps {
  customerName: string;
  isOnline: boolean;
  isTyping: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  customerName,
  isOnline,
  isTyping,
}) => {
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3">
      <div className="relative">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
          <User className="h-4 w-4" />
        </span>
        <span
          className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-surface ${
            isOnline ? "bg-secondary" : "bg-gray-400"
          }`}
        />
      </div>
      <div>
        <p className="text-sm font-semibold text-text">
          {customerName}
        </p>
        <p className="text-[11px] text-text-secondary">
          {isTyping
            ? "Sedang mengetik..."
            : isOnline
            ? "Online"
            : "Offline"}
        </p>
      </div>
    </div>
  );
};
