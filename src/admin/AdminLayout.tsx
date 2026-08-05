import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LogOut,
  MessageCircle,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/admin/account", label: "Account", icon: Users },
  { to: "/admin/order", label: "Order", icon: ShoppingBag },
  { to: "/admin/chat", label: "Chat", icon: MessageCircle },
  { to: "/admin/product", label: "Product", icon: Package },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  function handleLogout() {
    sessionStorage.removeItem("isAdminAuthenticated");
    navigate("/admin/login");
  }

  return (
    <div className="flex h-screen bg-background">
      <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-8 w-auto object-contain"
          />
          <span className="text-sm font-bold text-text">Admin Panel</span>
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-text-secondary hover:bg-background"
                }`
              }>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
