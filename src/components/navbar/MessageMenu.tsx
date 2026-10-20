import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { chatService } from "@/services/chat.service";

export function MessageMenu() {
  const [unreadCount, setUnreadCount] = useState<number>(() => {
    return chatService.getCustomerUnreadCount();
  });

  useEffect(() => {
    const updateCount = () => {
      setUnreadCount(chatService.getCustomerUnreadCount());
    };

    updateCount();
    window.addEventListener("marketplace-chat-updated", updateCount);
    window.addEventListener("marketplace-chat-conversation-synced", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("marketplace-chat-updated", updateCount);
      window.removeEventListener("marketplace-chat-conversation-synced", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  return (
    <Link
      to="/message"
      aria-label="Pesan"
      className="relative rounded-full p-2 text-text hover:bg-border/40">
      <Mail className="h-5 w-5" />
      {unreadCount > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
