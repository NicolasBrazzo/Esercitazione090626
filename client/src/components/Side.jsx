import { useState } from "react";
import {
  LayoutDashboard,
  ReceiptText,
  Users,
  BarChart3,
  ShoppingCart,
  LogOut,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: ReceiptText, label: "Richieste", path: "/requests" },
  { icon: Users, label: "Utenti", path: "/users" },
  { icon: BarChart3, label: "Statistiche", path: "/stats" },
];

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <aside
      className={[
        "fixed left-0 top-0 z-50 flex h-full flex-col bg-sidebar",
        "transition-all duration-300 ease-in-out border-r border-sidebar-border",
        isOpen ? "w-64" : "w-16",
      ].join(" ")}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-sidebar-primary">
            <span className="text-sidebar-primary-foreground font-bold text-lg">
              <ShoppingCart/>
            </span>
          </div>
          {isOpen && (
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="text-sidebar-foreground text-sm font-medium whitespace-nowrap">
                Rimborso Spese Aziendali
              </span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4">
        {MENU_ITEMS.filter((item) =>
          // /dashboard e /requests sono visibili a tutti; il resto solo all'admin
          item.path === "/requests" || item.path === "/dashboard" ?
            true
          : user?.isAdmin,
        ).map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              [
                "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors",
                isActive ?
                  "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              ].join(" ")
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {isOpen && (
              <span className="overflow-hidden whitespace-nowrap text-sm">
                {item.label}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-sidebar-border py-4">
        <button
          type="button"
          onClick={logout}
          className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {isOpen && (
            <span className="overflow-hidden whitespace-nowrap text-sm">
              Logout
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};
