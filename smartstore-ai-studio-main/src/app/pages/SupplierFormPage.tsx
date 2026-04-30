import { useParams, useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { suppliersApi } from "@/app/services/api";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

const schema = z.object({
  name: z.string().trim().min(1, "Required").max(120),
  email: z.string().trim().email("Invalid email"),
  phone: z.string().trim().min(5),
  categories: z.string().trim().min(1, "At least one category"),
  leadTimeDays: z.coerce.number().int().positive(),
});
type V = z.infer<typeof schema>;

export function SupplierFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const existing = useQuery({ queryKey: ["supplier", id], queryFn: () => suppliersApi.get(id!), enabled: isEdit });

  const form = useForm<V>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", phone: "", categories: "", leadTimeDays: 5 } });

  useEffect(() => {
    if (existing.data) form.reset({ name: existing.data.name, email: existing.data.email, phone: existing.data.phone, categories: existing.data.categories.join(", "), leadTimeDays: existing.data.leadTimeDays });
  }, [existing.data, form]);

  const mut = useMutation({
    mutationFn: async (v: V) => {
      const payload = { ...v, categories: v.categories.split(",").map((c) => c.trim()).filter(Boolean) };
      if (isEdit) return suppliersApi.update(id!, payload);
      return suppliersApi.create(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["suppliers"] }); toast.success(isEdit ? "Supplier updated" : "Supplier created"); navigate("/suppliers"); },
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2"><Link to="/suppliers"><ArrowLeft className="size-4 mr-1.5" />Back</Link></Button>
      <PageHeader title={isEdit ? "Edit Supplier" : "New Supplier"} />
      <form onSubmit={form.handleSubmit((v) => mut.mutate(v))} className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <Field label="Name" error={form.formState.errors.name?.message}><input {...form.register("name")} className="form-input" /></Field>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Email" error={form.formState.errors.email?.message}><input type="email" {...form.register("email")} className="form-input" /></Field>
          <Field label="Phone" error={form.formState.errors.phone?.message}><input {...form.register("phone")} className="form-input" /></Field>
        </div>
        <Field label="Categories (comma separated)" error={form.formState.errors.categories?.message}><input {...form.register("categories")} className="form-input" placeholder="Beverages, Snacks" /></Field>
        <Field label="Lead time (days)" error={form.formState.errors.leadTimeDays?.message}><input type="number" {...form.register("leadTimeDays")} className="form-input" /></Field>
        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={() => navigate("/suppliers")}>Cancel</Button>
          <Button type="submit" disabled={mut.isPending} className="bg-gradient-gold text-primary-foreground">
            {mut.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            {isEdit ? "Save changes" : "Create supplier"}
          </Button>
        </div>
      </form>
      <style>{`.form-input{width:100%;height:40px;padding:0 12px;background:oklch(0.18 0.006 270 / 0.6);border:1px solid var(--color-border);border-radius:10px;font-size:14px;color:var(--color-foreground);outline:none;transition:all 200ms}.form-input:focus{border-color:oklch(0.78 0.14 82 / 0.6);box-shadow:0 0 0 3px oklch(0.78 0.14 82 / 0.15)}`}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return <label className="block"><div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">{label}</div>{children}{error && <div className="text-xs text-destructive mt-1">{error}</div>}</label>;
}
