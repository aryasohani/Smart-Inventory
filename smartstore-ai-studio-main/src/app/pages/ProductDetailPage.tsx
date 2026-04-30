import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/app/services/api";
import { PageHeader } from "@/app/components/PageHeader";
import { StatusPill } from "@/app/components/StatusPill";
import { Skeleton } from "@/app/components/Skeleton";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2, Sparkles, TrendingUp, AlertTriangle, Calendar, Package, DollarSign, Truck } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { format } from "date-fns";
import { toast } from "sonner";

export function ProductDetailPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const product = useQuery({ queryKey: ["products", id], queryFn: () => productsApi.get(id) });
  const forecast = useQuery({ queryKey: ["products", id, "forecast"], queryFn: () => productsApi.forecast(id) });
  const history = useQuery({ queryKey: ["products", id, "history"], queryFn: () => productsApi.history(id) });

  const deleteMut = useMutation({
    mutationFn: () => productsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
      navigate("/products");
    },
  });

  if (product.isLoading) return <ProductDetailSkeleton />;
  if (!product.data) return <div>Not found</div>;

  const p = product.data;
  const daysToExpiry = Math.max(0, Math.ceil((+new Date(p.expiryDate) - Date.now()) / 86400000));
  const daysOfCover = Math.ceil(p.stock / Math.max(1, p.velocity));
  const reorderQty = Math.max(0, p.reorderLevel * 2 - p.stock);

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2">
        <Link to="/products"><ArrowLeft className="size-4 mr-1.5" /> Back to products</Link>
      </Button>

      <PageHeader
        title={p.name}
        description={`${p.sku} · ${p.category}`}
        actions={
          <>
            <Button asChild variant="outline">
              <Link to={`/products/${p.id}/edit`}><Pencil className="size-4 mr-1.5" /> Edit</Link>
            </Button>
            <Button variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { if (confirm("Delete this product?")) deleteMut.mutate(); }}>
              <Trash2 className="size-4 mr-1.5" /> Delete
            </Button>
          </>
        }
      />

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MiniStat icon={<Package className="size-4" />} label="Current Stock" value={p.stock} hint={`reorder at ${p.reorderLevel}`} />
        <MiniStat icon={<DollarSign className="size-4" />} label="Unit Price" value={`$${p.price.toFixed(2)}`} hint={`cost $${p.cost.toFixed(2)}`} />
        <MiniStat icon={<TrendingUp className="size-4" />} label="Velocity" value={`${p.velocity}/d`} hint={`${daysOfCover}d of cover`} />
        <MiniStat icon={<Calendar className="size-4" />} label="Days to Expiry" value={daysToExpiry} hint={format(new Date(p.expiryDate), "MMM d, yyyy")} accent={daysToExpiry < 14 ? "warn" : undefined} />
      </div>

      {/* AI Insights — gold panel */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 p-5 bg-gradient-to-br from-primary/10 via-primary/4 to-transparent">
        <div className="absolute -right-20 -top-20 size-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="size-8 rounded-lg bg-gradient-gold grid place-items-center">
              <Sparkles className="size-4 text-primary-foreground" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-bold">AI Insights</div>
              <div className="text-sm font-display font-semibold">Decision intelligence for this SKU</div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Insight
              icon={<Package className="size-4" />}
              title="Suggested reorder"
              value={`${reorderQty} units`}
              detail={`Maintains ~${Math.round((reorderQty + p.stock) / Math.max(1, p.velocity))}d of cover`}
              status={p.status}
            />
            <Insight
              icon={<TrendingUp className="size-4" />}
              title="Demand trend"
              value={p.velocity > 20 ? "Accelerating" : p.velocity > 10 ? "Stable" : "Slowing"}
              detail={`7-day forecast confidence ${forecast.data?.[0]?.confidence ?? 0}%`}
            />
            <Insight
              icon={<AlertTriangle className="size-4" />}
              title="Expiry risk"
              value={daysToExpiry < 7 ? "High" : daysToExpiry < 30 ? "Moderate" : "Low"}
              detail={daysToExpiry < 30 ? `Will expire before fully sold at current velocity` : "Safe horizon"}
              status={daysToExpiry < 7 ? "critical" : daysToExpiry < 30 ? "low" : "ok"}
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="7-Day Demand Forecast" subtitle="With confidence interval">
          {forecast.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={forecast.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.14 82)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.78 0.14 82)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.78 0.14 82)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="oklch(0.78 0.14 82)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="day" stroke="oklch(0.68 0.012 90)" fontSize={11} />
                <YAxis stroke="oklch(0.68 0.012 90)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.20 0.006 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "oklch(0.97 0.005 90)" }}
                />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#bandFill)" />
                <Area type="monotone" dataKey="forecast" stroke="oklch(0.86 0.16 86)" strokeWidth={2.5} fill="url(#forecastFill)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Stock History" subtitle="Last 14 days">
          {history.isLoading ? <Skeleton className="h-64 w-full" /> : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={history.data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
                <XAxis dataKey="label" stroke="oklch(0.68 0.012 90)" fontSize={11} />
                <YAxis stroke="oklch(0.68 0.012 90)" fontSize={11} />
                <Tooltip
                  contentStyle={{ background: "oklch(0.20 0.006 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="stock" stroke="oklch(0.70 0.13 230)" strokeWidth={2.5} dot={{ fill: "oklch(0.70 0.13 230)", r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Meta */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display font-semibold text-base mb-3">Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Meta label="SKU" value={p.sku} />
          <Meta label="Category" value={p.category} />
          <Meta label="Status"><StatusPill status={p.status} /></Meta>
          <Meta label="Supplier" value={<span className="inline-flex items-center gap-1.5"><Truck className="size-3.5 text-muted-foreground" /> {p.supplierId}</span>} />
        </div>
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value, hint, accent }: { icon: React.ReactNode; label: string; value: React.ReactNode; hint?: string; accent?: "warn" }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        {icon}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className={`text-2xl font-display font-bold tabular-nums ${accent === "warn" ? "text-warning" : ""}`}>{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground mt-0.5">{hint}</div>}
    </div>
  );
}

function Insight({ icon, title, value, detail, status }: { icon: React.ReactNode; title: string; value: string; detail: string; status?: "ok" | "low" | "critical" }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/60 p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <span className="text-primary">{icon}</span>
        <span className="text-xs font-semibold">{title}</span>
        {status && <StatusPill status={status} className="ml-auto" />}
      </div>
      <div className="text-lg font-display font-bold">{value}</div>
      <div className="text-[11px] text-muted-foreground mt-1">{detail}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <h3 className="font-display font-semibold text-base">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Meta({ label, value, children }: { label: string; value?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</div>
      <div className="text-sm font-medium mt-1">{children ?? value}</div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-12 w-1/2" />
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}</div>
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 gap-5">{[1,2].map(i => <Skeleton key={i} className="h-72 rounded-2xl" />)}</div>
    </div>
  );
}
