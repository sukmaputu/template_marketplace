import { Link } from "react-router-dom";
import { HelpCircle, LogOut, Settings, User } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";

interface ProfileMenuProps {
  name?: string;
  avatarUrl?: string;
}

export function ProfileMenu({ name = "Akun", avatarUrl }: ProfileMenuProps) {
  return (
    <Dropdown
      panelClassName="w-56"
      trigger={({ toggle }) => (
        <button
          onClick={toggle}
          className="flex items-center gap-2 rounded-full p-1 pr-3 hover:bg-border/40">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
              <User className="h-4 w-4" />
            </span>
          )}
          <span className="hidden text-sm font-medium text-text sm:inline">
            {name}
          </span>
        </button>
      )}>
      {({ close }) => (
        <div className="py-2">
          <Link
            to="/profile"
            onClick={close}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-background">
            <User className="h-4 w-4 text-text-secondary" />
            Profil Saya
          </Link>
          <Link
            to="/profile"
            onClick={close}
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-background">
            <Settings className="h-4 w-4 text-text-secondary" />
            Pengaturan
          </Link>
          <a
            href="#bantuan"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-background">
            <HelpCircle className="h-4 w-4 text-text-secondary" />
            Bantuan
          </a>
          <div className="my-1 border-t border-border" />
          <a
            href="#keluar"
            className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-background">
            <LogOut className="h-4 w-4" />
            Keluar
          </a>
        </div>
      )}
    </Dropdown>
  );
}
