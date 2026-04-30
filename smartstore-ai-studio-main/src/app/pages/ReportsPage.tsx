import { useQuery } from "@tanstack/react-query";
import { productsApi, purchaseOrdersApi } from "@/app/services/api";
import { PageHeader } from "@/app/components/PageHeader";
import { StatCard } from "@/app/components/StatCard";
import { BarChart3, TrendingUp, DollarSign, Package, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export function ReportsPage() {
  const products = useQuery({ queryKey: ["products"], queryFn: productsApi.list });
  const orders = useQuery({ queryKey: ["purchase-orders"], queryFn: purchaseOrdersApi.list });

  const productList = products.data ?? [];
  const totalInventoryValue = productList.reduce((s, p) => s + p.stock * p.cost, 0);
  const projectedRevenue = productList.reduce((s, p) => s + p.velocity * 7 * p.price, 0);

  const byCategory = Object.entries(productList.reduce<Record<string, number>>((acc, p) => { acc[p.category] = (acc[p.category] ?? 0) + p.stock * p.cost; return acc; }, {}))
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value);

  const COLORS = ["oklch(0.78 0.14 82)", "oklch(0.72 0.16 155)", "oklch(0.70 0.13 230)", "oklch(0.65 0.20 320)", "oklch(0.80 0.16 50)"];

  const weeklySpend = (orders.data ?? []).slice(0, 6).reverse().map((o, i) => ({ week: `W${i + 1}`, spend: Math.round(o.total) }));

  return (
    <div className="space-y-6">
      <PageHeader title="Reports & Insights" description="Weekly summaries, category breakdowns, and AI-generated business insights." />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Inventory Value" value={`$${(totalInventoryValue / 1000).toFixed(1)}k`} hint="across all SKUs" icon={<DollarSign className="size-5" />} accent="primary" />
        <StatCard label="Projected Revenue" value={`$${(projectedRevenue / 1000).toFixed(1)}k`} hint="next 7 days" trend="up" delta="+8.2%" icon={<TrendingUp className="size-5" />} accent="success" />
        <StatCard label="Active SKUs" value={productList.length} icon={<Package className="size-5" />} accent="primary" />
        <StatCard label="POs This Month" value={(orders.data ?? []).length} hint="across all suppliers" icon={<BarChart3 className="size-5" />} accent="success" />
      </div>

      {/* AI summary */}
      <div className="relative overflow-hidden rounded-2xl border border-primary/25 p-5 bg-gradient-to-br from-primary/10 via-primary/4 to-transparent">
        <div className="flex items-start gap-3">
          <div className="size-10 rounded-xl bg-gradient-gold grid place-items-center shrink-0 shadow-glow"><Sparkles className="size-5 text-primary-foreground" /></div>
          <div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-primary font-bold">Weekly AI Summary</div>
            <h3 className="font-display font-semibold text-lg mt-1">Operations are healthy with two areas of attention</h3>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              Demand grew <strong className="text-foreground">+8.2%</strong> week-over-week, driven by Beverages and Pharmacy. Inventory turnover improved to <strong className="text-foreground">5.4×</strong>.
              Two SKUs are at <strong className="text-destructive">critical stock</strong> — review the dashboard. Consider rebalancing <strong className="text-foreground">$3.2k</strong> from slow-moving Electronics into accelerating Beverages.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="Inventory Value by Category">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={2}>
                {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "oklch(0.20 0.006 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => `$${v}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="PO Spend (Recent)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklySpend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(1 0 0 / 0.06)" />
              <XAxis dataKey="week" stroke="oklch(0.68 0.012 90)" fontSize={11} />
              <YAxis stroke="oklch(0.68 0.012 90)" fontSize={11} />
              <Tooltip contentStyle={{ background: "oklch(0.20 0.006 270)", border: "1px solid oklch(1 0 0 / 0.08)", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => `$${v}`} />
              <Bar dataKey="spend" fill="oklch(0.78 0.14 82)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-5 shadow-card"><h3 className="font-display font-semibold text-base mb-4">{title}</h3>{children}</div>;
}
