import { Link } from "react-router-dom";
import { Mail } from "lucide-react";

const UNREAD_COUNT = 3;

export function MessageMenu() {
  return (
    <Link
      to="/message"
      aria-label="Pesan"
      className="relative rounded-full p-2 text-text hover:bg-border/40">
      <Mail className="h-5 w-5" />
      {UNREAD_COUNT > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white">
          {UNREAD_COUNT}
        </span>
      ) : null}
    </Link>
  );
}
