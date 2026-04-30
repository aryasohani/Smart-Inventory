import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { purchaseOrdersApi } from "@/app/services/api";
import { PageHeader } from "@/app/components/PageHeader";
import { StatusPill } from "@/app/components/StatusPill";
import { Skeleton } from "@/app/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Search } from "lucide-react";
import { format } from "date-fns";
import type { POStatus } from "@/app/services/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const FLOW: POStatus[] = ["draft", "sent", "acknowledged", "received"];

export function PurchaseOrdersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["purchase-orders"], queryFn: purchaseOrdersApi.list });
  const [search, setSearch] = useState("");

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: POStatus }) => purchaseOrdersApi.updateStatus(id, status),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase-orders"] }); toast.success("Status updated"); },
  });

  const filtered = useMemo(() => (data ?? []).filter((p) => !search || p.id.includes(search.toLowerCase()) || p.supplierName.toLowerCase().includes(search.toLowerCase())), [data, search]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Create, track, and progress POs through the supplier workflow."
        actions={<Button asChild className="bg-gradient-gold text-primary-foreground shadow-glow"><Link to="/purchase-orders/new"><Plus className="size-4 mr-1.5" />New PO</Link></Button>}
      />

      <div className="rounded-2xl border border-border bg-card p-3">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PO # or supplier..." className="w-full h-10 pl-10 pr-4 rounded-lg bg-input/40 border border-transparent focus:border-primary/50 text-sm outline-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/20 text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left py-3 px-4">PO #</th>
                <th className="text-left py-3 px-4">Supplier</th>
                <th className="text-left py-3 px-4">Created</th>
                <th className="text-left py-3 px-4">Expected</th>
                <th className="text-right py-3 px-4">Items</th>
                <th className="text-right py-3 px-4">Total</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const idx = FLOW.indexOf(p.status);
                const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
                return (
                  <tr key={p.id} className="border-b border-border last:border-0 hover:bg-accent/20 transition-colors">
                    <td className="py-3 px-4"><code className="text-primary font-medium">{p.id.toUpperCase()}</code></td>
                    <td className="py-3 px-4 font-medium">{p.supplierName}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{format(new Date(p.createdAt), "MMM d, yyyy")}</td>
                    <td className="py-3 px-4 text-muted-foreground text-xs">{format(new Date(p.expectedAt), "MMM d, yyyy")}</td>
                    <td className="py-3 px-4 text-right tabular-nums">{p.itemCount}</td>
                    <td className="py-3 px-4 text-right tabular-nums font-semibold">${p.total.toFixed(2)}</td>
                    <td className="py-3 px-4"><StatusPill status={p.status} /></td>
                    <td className="py-3 px-4 text-right">
                      {next && <Button size="sm" variant="ghost" className="text-primary hover:text-primary hover:bg-primary/10" onClick={() => advance.mutate({ id: p.id, status: next })}>{next}<ArrowRight className="size-3.5 ml-1" /></Button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Workflow legend */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="font-display font-semibold text-sm mb-4">Workflow</h3>
        <div className="flex items-center gap-2 flex-wrap">
          {FLOW.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold border", "bg-card border-border")}>
                <span className="text-muted-foreground mr-1.5">{i + 1}.</span><StatusPill status={s} />
              </div>
              {i < FLOW.length - 1 && <ArrowRight className="size-3.5 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
