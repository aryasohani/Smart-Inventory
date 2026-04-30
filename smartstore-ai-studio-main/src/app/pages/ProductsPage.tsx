import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { productsApi } from "@/app/services/api";
import { PageHeader } from "@/app/components/PageHeader";
import { StatusPill } from "@/app/components/StatusPill";
import { Skeleton } from "@/app/components/Skeleton";
import { EmptyState } from "@/app/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Plus, Search, Package, LayoutGrid, List, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  { value: "all", label: "All" },
  { value: "ok", label: "In Stock" },
  { value: "low", label: "Low" },
  { value: "critical", label: "Critical" },
] as const;

export function ProductsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["products"], queryFn: productsApi.list });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [status, setStatus] = useState<typeof STATUS_FILTERS[number]["value"]>("all");
  const [view, setView] = useState<"table" | "grid">("table");

  const categories = useMemo(() => {
    const set = new Set((data ?? []).map((p) => p.category));
    return ["all", ...Array.from(set)];
  }, [data]);

  const filtered = useMemo(() => {
    return (data ?? []).filter((p) => {
      if (category !== "all" && p.category !== category) return false;
      if (status !== "all" && p.status !== status) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [data, category, status, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage SKUs, monitor stock health, and inspect AI-driven demand forecasts."
        actions={
          <Button asChild className="bg-gradient-gold text-primary-foreground shadow-glow">
            <Link to="/products/new"><Plus className="size-4 mr-1.5" /> Add Product</Link>
          </Button>
        }
      />

      {/* Filters bar */}
      <div className="rounded-2xl border border-border bg-card p-3 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or SKU..."
            className="w-full h-10 pl-10 pr-4 rounded-lg bg-input/40 border border-transparent focus:border-primary/50 focus:ring-2 focus:ring-ring/20 text-sm outline-none transition-all"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-10 px-3 rounded-lg bg-input/40 border border-border text-sm outline-none focus:border-primary/50 min-w-[160px]"
        >
          {categories.map((c) => (
            <option key={c} value={c}>{c === "all" ? "All Categories" : c}</option>
          ))}
        </select>
        <div className="flex rounded-lg border border-border bg-input/40 p-0.5 gap-0.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatus(f.value)}
              className={cn(
                "px-3 h-9 text-xs font-medium rounded-md transition-colors",
                status === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-border bg-input/40 p-0.5 gap-0.5">
          <button onClick={() => setView("table")} className={cn("size-9 grid place-items-center rounded-md", view === "table" && "bg-primary text-primary-foreground")} aria-label="Table view">
            <List className="size-4" />
          </button>
          <button onClick={() => setView("grid")} className={cn("size-9 grid place-items-center rounded-md", view === "grid" && "bg-primary text-primary-foreground")} aria-label="Grid view">
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
          {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={<Package className="size-6" />}
            title="No products match your filters"
            description="Try clearing filters or add a new product to your catalog."
            action={<Button asChild><Link to="/products/new"><Plus className="size-4 mr-1.5" /> Add product</Link></Button>}
          />
        </div>
      ) : view === "table" ? (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/20 text-[11px] uppercase tracking-wider text-muted-foreground">
                  <Th>Product <ArrowUpDown className="size-3 inline ml-1 opacity-40" /></Th>
                  <Th>SKU</Th>
                  <Th>Category</Th>
                  <Th className="text-right">Stock</Th>
                  <Th className="text-right">Price</Th>
                  <Th>Expiry</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors"
                  >
                    <Td>
                      <Link to={`/products/${p.id}`} className="flex items-center gap-3 group">
                        <div className="size-9 rounded-lg bg-gradient-to-br from-primary/15 to-transparent grid place-items-center shrink-0">
                          <Package className="size-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium group-hover:text-primary transition-colors">{p.name}</div>
                        </div>
                      </Link>
                    </Td>
                    <Td><code className="text-xs text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded">{p.sku}</code></Td>
                    <Td><span className="text-muted-foreground">{p.category}</span></Td>
                    <Td className="text-right tabular-nums font-medium">{p.stock}<span className="text-muted-foreground font-normal text-xs"> /{p.reorderLevel}</span></Td>
                    <Td className="text-right tabular-nums font-medium">${p.price.toFixed(2)}</Td>
                    <Td className="text-muted-foreground text-xs">{format(new Date(p.expiryDate), "MMM d, yyyy")}</Td>
                    <Td><StatusPill status={p.status} /></Td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p, idx) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
              <Link to={`/products/${p.id}`} className="block rounded-2xl border border-border bg-card hover:border-primary/40 transition-all group p-4 shadow-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="size-11 rounded-xl bg-gradient-to-br from-primary/15 to-transparent grid place-items-center">
                    <Package className="size-5 text-primary" />
                  </div>
                  <StatusPill status={p.status} />
                </div>
                <div className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">{p.name}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{p.sku} · {p.category}</div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Stock</div>
                    <div className="font-semibold tabular-nums">{p.stock}</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Price</div>
                    <div className="font-semibold tabular-nums">${p.price.toFixed(2)}</div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return <th className={cn("text-left font-semibold py-3 px-4", className)}>{children}</th>;
}
function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("py-3 px-4", className)}>{children}</td>;
}
