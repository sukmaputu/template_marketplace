import React, { useState } from "react";
import { Send } from "lucide-react";

export interface ChatComposerProps {
  onSendMessage: (text: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  onSendMessage,
  onTypingChange,
  disabled = false,
}) => {
  const [draft, setDraft] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDraft(value);
    onTypingChange?.(value.trim().length > 0);
  };

  const handleSend = () => {
    const text = draft.trim();
    if (!text || disabled) return;

    onTypingChange?.(false);
    onSendMessage(text);
    setDraft("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex items-center gap-2 border-t border-border px-4 py-3">
      <input
        type="text"
        value={draft}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Balas pesan customer..."
        className="flex-1 rounded-full border border-border bg-background px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-primary disabled:opacity-50"
      />
      <button
        type="button"
        onClick={handleSend}
        disabled={!draft.trim() || disabled}
        aria-label="Kirim balasan"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white hover:opacity-90 disabled:opacity-40 cursor-pointer transition-opacity"
      >
        <Send className="h-4 w-4" />
      </button>
    </div>
  );
};
