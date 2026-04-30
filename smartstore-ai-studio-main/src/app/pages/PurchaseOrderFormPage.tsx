import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { suppliersApi, productsApi, purchaseOrdersApi } from "@/app/services/api";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, Trash2, Loader2 } from "lucide-react";
import type { POItem } from "@/app/services/types";
import { toast } from "sonner";

export function PurchaseOrderFormPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: suppliersApi.list });
  const products = useQuery({ queryKey: ["products"], queryFn: productsApi.list });

  const [supplierId, setSupplierId] = useState("");
  const [expectedAt, setExpectedAt] = useState(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [items, setItems] = useState<POItem[]>([]);

  const create = useMutation({
    mutationFn: () => purchaseOrdersApi.create({ supplierId, items, expectedAt: new Date(expectedAt).toISOString() }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["purchase-orders"] }); toast.success("Purchase order created"); navigate("/purchase-orders"); },
  });

  const supplierProducts = (products.data ?? []).filter((p) => !supplierId || p.supplierId === supplierId);

  const addItem = (productId: string) => {
    const p = supplierProducts.find((x) => x.id === productId);
    if (!p || items.find((i) => i.productId === productId)) return;
    setItems((cur) => [
      ...cur,
      { productId: p.id, productName: p.name, sku: p.sku, qty: Math.max(10, p.reorderLevel - p.stock), unitPrice: p.cost },
    ]);
  };
  const updateItem = (idx: number, patch: Partial<POItem>) => setItems((cur) => cur.map((it, i) => i === idx ? { ...it, ...patch } : it));
  const removeItem = (idx: number) => setItems((cur) => cur.filter((_, i) => i !== idx));

  const total = items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  const canSubmit = supplierId && items.length > 0 && items.every((i) => i.qty > 0 && i.unitPrice >= 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2"><Link to="/purchase-orders"><ArrowLeft className="size-4 mr-1.5" />Back</Link></Button>
      <PageHeader title="New Purchase Order" description="Select a supplier, add line items, and submit for fulfillment." />

      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Supplier</div>
            <select value={supplierId} onChange={(e) => { setSupplierId(e.target.value); setItems([]); }} className="po-input">
              <option value="">Select supplier...</option>
              {(suppliers.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name} · {s.leadTimeDays}d lead</option>)}
            </select>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">Expected delivery</div>
            <input type="date" value={expectedAt} onChange={(e) => setExpectedAt(e.target.value)} className="po-input" />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Line items</div>
            {supplierId && (
              <select onChange={(e) => { if (e.target.value) { addItem(e.target.value); e.target.value = ""; } }} className="po-input !w-auto !h-9 text-xs">
                <option value="">+ Add product</option>
                {supplierProducts.filter(p => !items.find(i => i.productId === p.id)).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </div>
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Select a supplier, then add products.</div>
          ) : (
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="bg-muted/20 text-[11px] uppercase text-muted-foreground"><th className="text-left p-3">Product</th><th className="text-right p-3 w-24">Qty</th><th className="text-right p-3 w-32">Unit Price</th><th className="text-right p-3 w-32">Total</th><th className="w-12"></th></tr></thead>
                <tbody>
                  {items.map((it, idx) => (
                    <tr key={it.productId} className="border-t border-border">
                      <td className="p-3">{it.productName}</td>
                      <td className="p-2"><input type="number" min={1} value={it.qty} onChange={(e) => updateItem(idx, { qty: +e.target.value })} className="po-input !h-9 text-right tabular-nums" /></td>
                      <td className="p-2"><input type="number" step="0.01" min={0} value={it.unitPrice} onChange={(e) => updateItem(idx, { unitPrice: +e.target.value })} className="po-input !h-9 text-right tabular-nums" /></td>
                      <td className="p-3 text-right font-semibold tabular-nums">${(it.qty * it.unitPrice).toFixed(2)}</td>
                      <td className="p-2"><button onClick={() => removeItem(idx)} className="size-8 grid place-items-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="size-3.5" /></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot><tr className="bg-muted/20 border-t border-border"><td colSpan={3} className="p-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-semibold">Total</td><td className="p-3 text-right text-lg font-display font-bold text-gradient-gold tabular-nums">${total.toFixed(2)}</td><td></td></tr></tfoot>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={() => navigate("/purchase-orders")}>Cancel</Button>
          <Button onClick={() => create.mutate()} disabled={!canSubmit || create.isPending} className="bg-gradient-gold text-primary-foreground">
            {create.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            <Plus className="size-4 mr-1.5" />Create Purchase Order
          </Button>
        </div>
      </div>

      <style>{`.po-input{width:100%;height:40px;padding:0 12px;background:oklch(0.18 0.006 270 / 0.6);border:1px solid var(--color-border);border-radius:10px;font-size:14px;color:var(--color-foreground);outline:none;transition:all 200ms}.po-input:focus{border-color:oklch(0.78 0.14 82 / 0.6);box-shadow:0 0 0 3px oklch(0.78 0.14 82 / 0.15)}`}</style>
    </div>
  );
}
