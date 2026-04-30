import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { suppliersApi } from "@/app/services/api";
import { PageHeader } from "@/app/components/PageHeader";
import { StatusPill } from "@/app/components/StatusPill";
import { Skeleton } from "@/app/components/Skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Mail, Phone, Star, Trash2, Pencil, Clock } from "lucide-react";
import { toast } from "sonner";

export function SuppliersPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["suppliers"], queryFn: suppliersApi.list });
  const del = useMutation({
    mutationFn: (id: string) => suppliersApi.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success("Supplier removed"); },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Manage vendor relationships, lead times, and category coverage."
        actions={<Button asChild className="bg-gradient-gold text-primary-foreground shadow-glow"><Link to="/suppliers/new"><Plus className="size-4 mr-1.5" />Add Supplier</Link></Button>}
      />
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {(data ?? []).map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-5 shadow-card hover:border-primary/30 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="size-11 rounded-xl bg-gradient-gold grid place-items-center text-primary-foreground font-bold">
                  {s.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                </div>
                <StatusPill status={s.status} />
              </div>
              <h3 className="font-display font-semibold text-base">{s.name}</h3>
              <div className="flex items-center gap-1 mt-1 text-xs text-warning">
                <Star className="size-3 fill-current" /> {s.rating} · <span className="text-muted-foreground">{s.totalOrders} orders</span>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><Mail className="size-3.5" /> {s.email}</div>
                <div className="flex items-center gap-2"><Phone className="size-3.5" /> {s.phone}</div>
                <div className="flex items-center gap-2"><Clock className="size-3.5" /> {s.leadTimeDays}d lead time</div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {s.categories.map((c) => <span key={c} className="text-[10px] px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">{c}</span>)}
              </div>
              <div className="mt-4 pt-3 border-t border-border flex gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1"><Link to={`/suppliers/${s.id}/edit`}><Pencil className="size-3.5 mr-1" />Edit</Link></Button>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => { if (confirm("Remove supplier?")) del.mutate(s.id); }}><Trash2 className="size-3.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
