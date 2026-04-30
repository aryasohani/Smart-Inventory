import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productsApi, suppliersApi } from "@/app/services/api";
import { PageHeader } from "@/app/components/PageHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useEffect } from "react";

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  sku: z.string().trim().min(1, "SKU is required").max(40),
  category: z.string().trim().min(1, "Category is required"),
  price: z.coerce.number().positive("Price must be positive"),
  cost: z.coerce.number().nonnegative("Cost cannot be negative"),
  stock: z.coerce.number().int().nonnegative("Stock cannot be negative"),
  reorderLevel: z.coerce.number().int().positive("Reorder level must be positive"),
  velocity: z.coerce.number().nonnegative(),
  expiryDate: z.string().refine((v) => new Date(v).getTime() > Date.now(), "Expiry must be in the future"),
  supplierId: z.string().min(1, "Supplier required"),
});

type FormValues = z.infer<typeof schema>;

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const existing = useQuery({ queryKey: ["products", id], queryFn: () => productsApi.get(id!), enabled: isEdit });
  const suppliers = useQuery({ queryKey: ["suppliers"], queryFn: suppliersApi.list });

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "", sku: "", category: "Beverages", price: 0, cost: 0, stock: 0, reorderLevel: 10, velocity: 0,
      expiryDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
      supplierId: "",
    },
  });

  useEffect(() => {
    if (existing.data) {
      form.reset({
        name: existing.data.name,
        sku: existing.data.sku,
        category: existing.data.category,
        price: existing.data.price,
        cost: existing.data.cost,
        stock: existing.data.stock,
        reorderLevel: existing.data.reorderLevel,
        velocity: existing.data.velocity,
        expiryDate: existing.data.expiryDate.slice(0, 10),
        supplierId: existing.data.supplierId,
      });
    }
  }, [existing.data, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = { ...values, expiryDate: new Date(values.expiryDate).toISOString() };
      if (isEdit) return productsApi.update(id!, payload);
      return productsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success(isEdit ? "Product updated" : "Product created");
      navigate("/products");
    },
    onError: () => toast.error("Failed to save product"),
  });

  return (
    <div className="space-y-6 max-w-3xl">
      <Button asChild variant="ghost" size="sm" className="text-muted-foreground -ml-2">
        <Link to="/products"><ArrowLeft className="size-4 mr-1.5" /> Back</Link>
      </Button>

      <PageHeader
        title={isEdit ? "Edit Product" : "New Product"}
        description="Provide accurate stock levels and supplier links so AI forecasts stay sharp."
      />

      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Product name" error={form.formState.errors.name?.message}>
            <input {...form.register("name")} className="input" placeholder="e.g. Premium Cola 330ml" />
          </Field>
          <Field label="SKU" error={form.formState.errors.sku?.message}>
            <input {...form.register("sku")} className="input" placeholder="BEV-COLA-330" />
          </Field>
          <Field label="Category" error={form.formState.errors.category?.message}>
            <input {...form.register("category")} className="input" placeholder="Beverages" />
          </Field>
          <Field label="Supplier" error={form.formState.errors.supplierId?.message}>
            <select {...form.register("supplierId")} className="input">
              <option value="">Select supplier...</option>
              {(suppliers.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Price ($)" error={form.formState.errors.price?.message}>
            <input type="number" step="0.01" {...form.register("price")} className="input tabular-nums" />
          </Field>
          <Field label="Cost ($)" error={form.formState.errors.cost?.message}>
            <input type="number" step="0.01" {...form.register("cost")} className="input tabular-nums" />
          </Field>
          <Field label="Current stock" error={form.formState.errors.stock?.message}>
            <input type="number" {...form.register("stock")} className="input tabular-nums" />
          </Field>
          <Field label="Reorder level" error={form.formState.errors.reorderLevel?.message}>
            <input type="number" {...form.register("reorderLevel")} className="input tabular-nums" />
          </Field>
          <Field label="Daily velocity (units/day)" error={form.formState.errors.velocity?.message}>
            <input type="number" step="0.1" {...form.register("velocity")} className="input tabular-nums" />
          </Field>
          <Field label="Expiry date" error={form.formState.errors.expiryDate?.message}>
            <input type="date" {...form.register("expiryDate")} className="input" />
          </Field>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-border">
          <Button type="button" variant="outline" onClick={() => navigate("/products")}>Cancel</Button>
          <Button type="submit" disabled={mutation.isPending} className="bg-gradient-gold text-primary-foreground">
            {mutation.isPending && <Loader2 className="size-4 mr-2 animate-spin" />}
            {isEdit ? "Save changes" : "Create product"}
          </Button>
        </div>
      </form>

      <style>{`
        .input {
          width: 100%;
          height: 40px;
          padding: 0 12px;
          background: oklch(0.18 0.006 270 / 0.6);
          border: 1px solid var(--color-border);
          border-radius: 10px;
          font-size: 14px;
          color: var(--color-foreground);
          outline: none;
          transition: all 200ms;
        }
        .input:focus {
          border-color: oklch(0.78 0.14 82 / 0.6);
          box-shadow: 0 0 0 3px oklch(0.78 0.14 82 / 0.15);
        }
      `}</style>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5">{label}</div>
      {children}
      {error && <div className="text-xs text-destructive mt-1">{error}</div>}
    </label>
  );
}
