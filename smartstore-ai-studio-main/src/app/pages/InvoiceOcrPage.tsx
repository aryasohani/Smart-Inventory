import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { invoicesApi } from "@/app/services/api";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import type { Invoice } from "@/app/services/types";
import { toast } from "sonner";
import { format } from "date-fns";

export function InvoiceOcrPage() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<Invoice | null>(null);

  const parse = useMutation({
    mutationFn: () => invoicesApi.parse(file),
    onSuccess: (inv) => { setParsed(inv); toast.success("Invoice parsed", { description: `${inv.items.length} line items extracted` }); },
  });
  const confirm = useMutation({
    mutationFn: () => invoicesApi.confirm(parsed!),
    onSuccess: () => { toast.success("Stock updated from invoice"); setFile(null); setParsed(null); },
  });

  const updateItem = (idx: number, patch: Partial<Invoice["items"][number]>) => {
    if (!parsed) return;
    setParsed({ ...parsed, items: parsed.items.map((it, i) => i === idx ? { ...it, ...patch, total: (patch.qty ?? it.qty) * (patch.price ?? it.price) } : it) });
  };

  const total = parsed?.items.reduce((s, i) => s + i.total, 0) ?? 0;

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader title="Invoice OCR" description="Upload supplier invoices — AI extracts line items and updates stock automatically." />

      {!parsed ? (
        <div className="rounded-2xl border-2 border-dashed border-border bg-card p-10 text-center">
          <div className="size-14 rounded-2xl bg-gradient-gold mx-auto grid place-items-center shadow-glow mb-4"><Upload className="size-6 text-primary-foreground" /></div>
          <h3 className="font-display font-semibold text-lg">Upload an invoice</h3>
          <p className="text-sm text-muted-foreground mt-1">PDF or image · up to 20MB</p>
          <label className="mt-5 inline-flex">
            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <span className="inline-flex items-center px-4 h-10 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 cursor-pointer text-sm font-medium transition-colors"><FileText className="size-4 mr-2" />Choose file</span>
          </label>
          {file && (
            <div className="mt-5 flex items-center justify-center gap-3">
              <span className="text-sm text-muted-foreground">{file.name}</span>
              <Button onClick={() => parse.mutate()} disabled={parse.isPending} className="bg-gradient-gold text-primary-foreground">
                {parse.isPending ? <><Loader2 className="size-4 mr-2 animate-spin" />Parsing with AI...</> : <><Sparkles className="size-4 mr-1.5" />Parse invoice</>}
              </Button>
            </div>
          )}
          {!file && <Button onClick={() => { setFile(new File([], "demo-invoice.pdf")); setTimeout(() => parse.mutate(), 100); }} variant="outline" className="mt-4">Try with demo invoice</Button>}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="rounded-2xl border border-success/30 bg-success/5 p-4 flex items-center gap-3">
            <CheckCircle2 className="size-5 text-success" />
            <div className="text-sm"><strong>Parsed successfully</strong> · review and edit fields below before confirming.</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5 pb-5 border-b border-border">
              <Field label="Supplier"><input value={parsed.supplierName} onChange={(e) => setParsed({ ...parsed, supplierName: e.target.value })} className="ocr-input" /></Field>
              <Field label="Invoice #"><input value={parsed.invoiceNumber} onChange={(e) => setParsed({ ...parsed, invoiceNumber: e.target.value })} className="ocr-input" /></Field>
              <Field label="Invoice date"><input type="date" value={parsed.invoiceDate.slice(0, 10)} onChange={(e) => setParsed({ ...parsed, invoiceDate: new Date(e.target.value).toISOString() })} className="ocr-input" /></Field>
            </div>
            <table className="w-full text-sm">
              <thead><tr className="text-[11px] uppercase tracking-wider text-muted-foreground"><th className="text-left py-2">Product</th><th className="text-right py-2 w-24">Qty</th><th className="text-right py-2 w-32">Unit Price</th><th className="text-right py-2 w-32">Total</th></tr></thead>
              <tbody>
                {parsed.items.map((it, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="py-2 pr-2"><input value={it.product} onChange={(e) => updateItem(idx, { product: e.target.value })} className="ocr-input" /></td>
                    <td className="py-2 px-1"><input type="number" value={it.qty} onChange={(e) => updateItem(idx, { qty: +e.target.value })} className="ocr-input text-right tabular-nums" /></td>
                    <td className="py-2 px-1"><input type="number" step="0.01" value={it.price} onChange={(e) => updateItem(idx, { price: +e.target.value })} className="ocr-input text-right tabular-nums" /></td>
                    <td className="py-2 pl-2 text-right font-semibold tabular-nums">${it.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot><tr className="border-t border-border"><td colSpan={3} className="py-3 text-right text-xs uppercase tracking-wider text-muted-foreground font-semibold">Invoice total</td><td className="py-3 text-right text-xl font-display font-bold text-gradient-gold tabular-nums">${total.toFixed(2)}</td></tr></tfoot>
            </table>
            <div className="flex justify-end gap-2 mt-5 pt-5 border-t border-border">
              <Button variant="outline" onClick={() => { setParsed(null); setFile(null); }}>Discard</Button>
              <Button onClick={() => confirm.mutate()} disabled={confirm.isPending} className="bg-gradient-gold text-primary-foreground">
                {confirm.isPending ? <><Loader2 className="size-4 mr-2 animate-spin" />Updating stock...</> : <><CheckCircle2 className="size-4 mr-1.5" />Confirm & update stock</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      <style>{`.ocr-input{width:100%;height:36px;padding:0 10px;background:oklch(0.18 0.006 270 / 0.6);border:1px solid var(--color-border);border-radius:8px;font-size:13px;color:var(--color-foreground);outline:none;transition:all 200ms}.ocr-input:focus{border-color:oklch(0.78 0.14 82 / 0.6);box-shadow:0 0 0 3px oklch(0.78 0.14 82 / 0.15)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</div>{children}</div>;
}
