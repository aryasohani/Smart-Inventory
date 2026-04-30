import { Search, Bell, Sparkles } from "lucide-react";
import { useUiStore } from "@/app/store/uiStore";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/products": "Products",
  "/suppliers": "Suppliers",
  "/purchase-orders": "Purchase Orders",
  "/invoices": "Invoice OCR",
  "/automation": "Automation",
  "/reports": "Reports",
};

export function Topbar() {
  const { toggleChat } = useUiStore();
  const { pathname } = useLocation();
  const base = "/" + pathname.split("/")[1];
  const title = titles[base] ?? "SmartStore AI";

  return (
    <header className="sticky top-0 z-20 h-16 border-b border-border glass">
      <div className="h-full px-6 lg:px-8 flex items-center gap-4">
        <div className="flex flex-col">
          <h1 className="text-lg font-display font-semibold tracking-tight">{title}</h1>
          <p className="text-xs text-muted-foreground">Real-time inventory intelligence</p>
        </div>

        <div className="flex-1 max-w-md mx-auto hidden md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search SKUs, suppliers, orders..."
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-input/40 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-ring/30 transition-all"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            className="relative size-10 grid place-items-center rounded-xl border border-border bg-card hover:bg-accent transition-colors"
            aria-label="Notifications"
          >
            <Bell className="size-4 text-muted-foreground" />
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-destructive" />
          </button>
          <Button onClick={toggleChat} className="bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-glow">
            <Sparkles className="size-4 mr-1.5" />
            Ask AI
          </Button>
        </div>
      </div>
    </header>
  );
}
