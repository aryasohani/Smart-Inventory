import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Workflow,
  BarChart3,
  Sparkles,
  LogOut,
  ChevronLeft,
} from "lucide-react";
import { useAuthStore } from "@/app/store/authStore";
import { useUiStore } from "@/app/store/uiStore";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const nav: { to: string; label: string; icon: typeof LayoutDashboard; roles: ReadonlyArray<"admin" | "staff"> }[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "staff"] },
  { to: "/products", label: "Products", icon: Package, roles: ["admin", "staff"] },
  { to: "/suppliers", label: "Suppliers", icon: Users, roles: ["admin"] },
  { to: "/purchase-orders", label: "Purchase Orders", icon: ShoppingCart, roles: ["admin", "staff"] },
  { to: "/invoices", label: "Invoice OCR", icon: FileText, roles: ["admin"] },
  { to: "/automation", label: "Automation", icon: Workflow, roles: ["admin"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["admin"] },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const role = user?.role ?? "staff";

  return (
    <motion.aside
      animate={{ width: sidebarCollapsed ? 72 : 248 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="sticky top-0 h-screen shrink-0 border-r border-sidebar-border bg-sidebar flex flex-col z-30"
    >
      <div className="h-16 flex items-center gap-2.5 px-4 border-b border-sidebar-border">
        <div className="size-9 rounded-xl bg-gradient-gold grid place-items-center shadow-glow shrink-0">
          <Sparkles className="size-4 text-primary-foreground" strokeWidth={2.5} />
        </div>
        {!sidebarCollapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="font-display font-bold text-sm tracking-tight">SmartStore</span>
            <span className="text-[10px] uppercase tracking-[0.18em] text-primary font-semibold">AI</span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-2.5 scrollbar-thin">
        <div className={cn("text-[10px] uppercase tracking-[0.16em] text-muted-foreground/70 px-3 mb-2", sidebarCollapsed && "sr-only")}>
          Workspace
        </div>
        <ul className="space-y-1">
          {nav
            .filter((n) => n.roles.includes(role))
            .map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent",
                      isActive && "bg-sidebar-accent text-sidebar-foreground"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <motion.span
                          layoutId="nav-indicator"
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary shadow-glow"
                        />
                      )}
                      <item.icon className={cn("size-[18px] shrink-0 transition-colors", isActive && "text-primary")} />
                      {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border p-2.5 space-y-1">
        {!sidebarCollapsed && user && (
          <div className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg">
            <div className="size-8 rounded-full bg-gradient-gold grid place-items-center text-xs font-bold text-primary-foreground">
              {user.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{user.name}</div>
              <div className="text-[10px] uppercase tracking-wider text-primary">{user.role}</div>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:text-destructive hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="size-4 shrink-0" />
          {!sidebarCollapsed && <span>Sign out</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className={cn("size-4 transition-transform", sidebarCollapsed && "rotate-180")} />
        </button>
      </div>
    </motion.aside>
  );
}
