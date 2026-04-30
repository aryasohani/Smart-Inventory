import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Package, AlertTriangle, Clock, Users, ArrowUpRight, TrendingUp, Sparkles, ShoppingCart } from "lucide-react";
import { productsApi, suppliersApi, purchaseOrdersApi } from "@/app/services/api";
import { StatCard } from "@/app/components/StatCard";
import { StatusPill } from "@/app/components/StatusPill";
import { Skeleton } from "@/app/components/Skeleton";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/app/store/uiStore";
import { useAuthStore } from "@/app/store/authStore";
import { motion } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";

export function DashboardPage() {
  const { user } = useAuthStore();
  const { setChatOpen } = useUiStore();

  const products = useQuery({ queryKey: ["products"], queryFn: productsApi.list });
  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: suppliersApi.list });
  const orders = useQuery({ queryKey: ["purchase-orders"], queryFn: purchaseOrdersApi.list });

  const productList = products.data ?? [];
  const lowStock = productList.filter((p) => p.status !== "ok").sort((a, b) => a.stock / a.reorderLevel - b.stock / b.reorderLevel);
  const expiring = [...productList].filter((p) => new Date(p.expiryDate).getTime() - Date.now() < 30 * 86400000).sort((a, b) => +new Date(a.expiryDate) - +new Date(b.expiryDate));
  const fastMovers = [...productList].sort((a, b) => b.velocity - a.velocity).slice(0, 5);
  const recentOrders = (orders.data ?? []).slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? "Operator"}`}
        description="Here's what's happening across your inventory and supply chain today."
        actions={
          <Button onClick={() => setChatOpen(true)} className="bg-gradient-gold text-primary-foreground shadow-glow">
            <Sparkles className="size-4 mr-1.5" /> Ask AI Assistant
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Total Products" value={products.isLoading ? "—" : productList.length} delta="+12 this month" trend="up" icon={<Package className="size-5" />} accent="primary" />
        <StatCard label="Low Stock Alerts" value={products.isLoading ? "—" : lowStock.length} delta={lowStock.filter((p) => p.status === "critical").length + " critical"} trend="down" icon={<AlertTriangle className="size-5" />} accent="danger" />
        <StatCard label="Expiring Soon" value={products.isLoading ? "—" : expiring.filter((p) => +new Date(p.expiryDate) - Date.now() < 14 * 86400000).length} hint="in next 14 days" icon={<Clock className="size-5" />} accent="warning" />
        <StatCard label="Active Suppliers" value={suppliers.isLoading ? "—" : (suppliers.data ?? []).filter((s) => s.status === "active").length} hint={`${suppliers.data?.length ?? 0} total`} icon={<Users className="size-5" />} accent="success" />
      </div>

      {/* AI insights banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-primary/20 p-5 bg-gradient-to-br from-primary/8 via-primary/4 to-transparent"
      >
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-center gap-4">
          <div className="size-11 rounded-xl bg-gradient-gold grid place-items-center shadow-glow shrink-0">
            <Sparkles className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-bold">AI Insight</div>
            <p className="text-sm mt-1 text-foreground">
              <strong>{lowStock.length} SKUs</strong> are projected to stock out within <strong>5 days</strong> based on current velocity.
              Consider drafting POs to <strong>Aurora Wholesale</strong> and <strong>MediCore</strong> — combined estimated cost <strong className="text-primary">$3,210</strong>.
            </p>
          </div>
          <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10" onClick={() => setChatOpen(true)}>
            Generate POs
            <ArrowUpRight className="size-3.5 ml-1" />
          </Button>
        </div>
      </motion.div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Low stock */}
        <Panel
          title="Low Stock — AI Priority"
          subtitle="Sorted by stockout risk"
          actions={<Link to="/products" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowUpRight className="size-3" /></Link>}
        >
          {products.isLoading ? <ListSkeleton /> : (
            <div className="divide-y divide-border">
              {lowStock.slice(0, 5).map((p) => {
                const days = Math.max(0, Math.ceil(p.stock / Math.max(1, p.velocity)));
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="flex items-center gap-3 py-3 hover:bg-accent/30 -mx-3 px-3 rounded-lg transition-colors group">
                    <div className="size-9 rounded-lg bg-gradient-to-br from-primary/15 to-transparent grid place-items-center shrink-0">
                      <Package className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.sku} · {p.category}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums">{p.stock} <span className="text-muted-foreground font-normal">/ {p.reorderLevel}</span></div>
                      <div className="text-[10px] text-muted-foreground">{days}d cover</div>
                    </div>
                    <StatusPill status={p.status} />
                  </Link>
                );
              })}
              {lowStock.length === 0 && <div className="py-8 text-sm text-center text-muted-foreground">All stock levels healthy 🎉</div>}
            </div>
          )}
        </Panel>

        {/* Expiry */}
        <Panel
          title="Expiring Soon"
          subtitle="Action required to avoid waste"
        >
          {products.isLoading ? <ListSkeleton /> : (
            <div className="divide-y divide-border">
              {expiring.slice(0, 5).map((p) => {
                const days = Math.max(0, Math.ceil((+new Date(p.expiryDate) - Date.now()) / 86400000));
                const urgent = days < 7;
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="flex items-center gap-3 py-3 hover:bg-accent/30 -mx-3 px-3 rounded-lg transition-colors">
                    <div className={`size-9 rounded-lg grid place-items-center shrink-0 ${urgent ? "bg-destructive/15 text-destructive" : "bg-warning/15 text-warning"}`}>
                      <Clock className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">Expires {format(new Date(p.expiryDate), "MMM d, yyyy")}</div>
                    </div>
                    <div className={`tabular-nums font-mono text-sm font-semibold ${urgent ? "text-destructive" : "text-warning"}`}>
                      {days}d
                    </div>
                  </Link>
                );
              })}
              {expiring.length === 0 && <div className="py-8 text-sm text-center text-muted-foreground">No upcoming expirations.</div>}
            </div>
          )}
        </Panel>

        {/* Top fast movers */}
        <Panel title="Top Fast Movers" subtitle="Highest demand velocity">
          {products.isLoading ? <ListSkeleton /> : (
            <div className="space-y-2.5">
              {fastMovers.map((p, idx) => {
                const max = fastMovers[0].velocity || 1;
                const pct = (p.velocity / max) * 100;
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="block group">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] tabular-nums text-muted-foreground w-4">#{idx + 1}</span>
                      <span className="text-sm font-medium flex-1 truncate group-hover:text-primary transition-colors">{p.name}</span>
                      <span className="text-xs tabular-nums font-semibold text-primary flex items-center gap-1">
                        <TrendingUp className="size-3" /> {p.velocity}/d
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted/50 overflow-hidden ml-7">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                        className="h-full bg-gradient-gold rounded-full"
                      />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>

        {/* Recent POs */}
        <Panel
          title="Recent Purchase Orders"
          actions={<Link to="/purchase-orders" className="text-xs text-primary hover:underline flex items-center gap-1">View all <ArrowUpRight className="size-3" /></Link>}
        >
          {orders.isLoading ? <ListSkeleton /> : (
            <div className="divide-y divide-border">
              {recentOrders.map((po) => (
                <div key={po.id} className="flex items-center gap-3 py-3">
                  <div className="size-9 rounded-lg bg-info/10 text-info grid place-items-center shrink-0">
                    <ShoppingCart className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{po.id.toUpperCase()} · {po.supplierName}</div>
                    <div className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(po.createdAt), { addSuffix: true })} · {po.itemCount} items</div>
                  </div>
                  <div className="text-sm tabular-nums font-semibold mr-2">${po.total.toFixed(2)}</div>
                  <StatusPill status={po.status} />
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-card p-5">
      <div className="flex items-end justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-base">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-md" />
        </div>
      ))}
    </div>
  );
}
