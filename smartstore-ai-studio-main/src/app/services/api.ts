/**
 * api.ts — Real backend API client for SmartStore AI
 *
 * Replaces the mock service layer with real HTTP calls to FastAPI backend.
 * All functions maintain the same signatures as the previous mock API
 * so no page-level component changes are needed.
 */

import axios from "axios";
import type {
  Product,
  Supplier,
  PurchaseOrder,
  AutomationLog,
  ChatMessage,
  Invoice,
  ForecastPoint,
  StockHistoryPoint,
  POItem,
  POStatus,
} from "./types";

// ── Base URL ──────────────────────────────────────────────────────────────────
// In development backend runs on 8000 by default in this project.
// In production set VITE_API_URL=https://your-backend.com
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8001";

// ── Axios instance ────────────────────────────────────────────────────────────
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

// Attach JWT token to every request automatically
apiClient.interceptors.request.use((config) => {
  const raw = localStorage.getItem("smartstore-auth");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      const token: string | null = parsed?.state?.token ?? null;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch {
      // ignore parse errors
    }
  }
  return config;
});

// Auto-logout on 401
apiClient.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("smartstore-auth");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// ── Type helpers: map backend snake_case → frontend camelCase ─────────────────

function mapProduct(p: any): Product {
  return {
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category,
    price: p.price,
    cost: p.price * 0.6, // backend has no cost field; estimate
    stock: p.stock,
    reorderLevel: p.reorder_threshold,
    expiryDate: p.expiry_date ?? "",
    supplierId: p.supplier_id ?? "",
    status: mapStockStatus(p.stock_status),
    velocity: 5, // calculated from forecast; default fallback
    description: p.description ?? "",
  };
}

function mapStockStatus(s: string): Product["status"] {
  if (s === "CRITICAL" || s === "EXPIRED") return "critical";
  if (s === "LOW") return "low";
  return "ok";
}

function mapSupplier(s: any): Supplier {
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    phone: s.phone ?? "",
    categories: s.categories_list ?? s.categories?.split(",").map((c: string) => c.trim()) ?? [],
    leadTimeDays: s.lead_time_days,
    rating: 4.5, // backend doesn't store rating; default
    totalOrders: 0,
    status: s.is_active ? "active" : "paused",
  };
}

function mapPO(po: any, suppliers: Supplier[]): PurchaseOrder {
  const supplier = suppliers.find((s) => s.id === po.supplier_id);
  return {
    id: po.id,
    supplierId: po.supplier_id,
    supplierName: supplier?.name ?? po.supplier_id,
    status: po.status as POStatus,
    createdAt: po.created_at,
    expectedAt: po.sent_at ?? po.created_at,
    total: po.total_amount,
    itemCount: po.items?.length ?? 0,
    items: (po.items ?? []).map((i: any): POItem => ({
      productId: i.product_id ?? "",
      productName: i.product_name,
      qty: i.quantity,
      unitPrice: i.unit_price,
    })),
  };
}

function mapAutomationLog(l: any): AutomationLog {
  return {
    id: l.id,
    jobName: l.job_name,
    schedule: l.job_name.includes("daily") ? "Daily 08:00 UTC" : "Monday 07:00 UTC",
    lastRunAt: l.started_at,
    status: l.status === "success" ? "success" : l.status === "failed" ? "error" : "warning",
    output: l.message ?? "",
  };
}

// ── Cache for supplier names (needed when mapping POs) ───────────────────────
let _cachedSuppliers: Supplier[] = [];

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH API
// ═══════════════════════════════════════════════════════════════════════════════
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await apiClient.post("/auth/login", { email, password });
    return data as { access_token: string; refresh_token: string; token_type: string };
  },
  register: async (email: string, password: string, full_name: string, role = "staff") => {
    const { data } = await apiClient.post("/auth/register", { email, password, full_name, role });
    return data;
  },
  me: async () => {
    const { data } = await apiClient.get("/auth/me");
    return data;
  },
  logout: async () => {
    await apiClient.post("/auth/logout").catch(() => {});
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRODUCTS API
// ═══════════════════════════════════════════════════════════════════════════════
export const productsApi = {
  list: async (): Promise<Product[]> => {
    const { data } = await apiClient.get("/products/", { params: { page: 1, page_size: 100 } });
    return (data.items ?? []).map(mapProduct);
  },

  get: async (id: string): Promise<Product> => {
    const { data } = await apiClient.get(`/products/${id}`);
    return mapProduct(data);
  },

  create: async (input: Omit<Product, "id" | "status">): Promise<Product> => {
    const payload = {
      name: input.name,
      sku: input.sku,
      category: input.category,
      stock: input.stock,
      price: input.price,
      expiry_date: input.expiryDate || null,
      reorder_threshold: input.reorderLevel,
    };
    const { data } = await apiClient.post("/products/", payload);
    return mapProduct(data);
  },

  update: async (id: string, input: Partial<Product>): Promise<Product> => {
    const payload: any = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.category !== undefined) payload.category = input.category;
    if (input.price !== undefined) payload.price = input.price;
    if (input.stock !== undefined) payload.stock = input.stock;
    if (input.reorderLevel !== undefined) payload.reorder_threshold = input.reorderLevel;
    if (input.expiryDate !== undefined) payload.expiry_date = input.expiryDate || null;
    const { data } = await apiClient.patch(`/products/${id}`, payload);
    return mapProduct(data);
  },

  remove: async (id: string): Promise<{ ok: boolean }> => {
    await apiClient.delete(`/products/${id}`);
    return { ok: true };
  },

  adjustStock: async (id: string, quantityChange: number, note?: string) => {
    const { data } = await apiClient.post(`/products/${id}/adjust-stock`, {
      quantity_change: quantityChange,
      change_type: quantityChange > 0 ? "purchase" : "sale",
      note: note ?? "",
    });
    return mapProduct(data);
  },

  forecast: async (id: string): Promise<ForecastPoint[]> => {
    const { data } = await apiClient.get(`/products/${id}/forecast`, { params: { days: 7 } });
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return (data.forecast as number[]).map((val, i) => {
      const d = new Date();
      d.setDate(d.getDate() + i);
      return {
        day: days[d.getDay()],
        date: d.toISOString().split("T")[0],
        forecast: Math.round(val),
        lower: Math.round(val * 0.8),
        upper: Math.round(val * 1.2),
        confidence: 85,
      };
    });
  },

  history: async (id: string): Promise<StockHistoryPoint[]> => {
    const { data } = await apiClient.get(`/products/${id}/inventory-logs`);
    return (data as any[]).slice(0, 30).map((log: any) => ({
      date: log.created_at.split("T")[0],
      stock: log.quantity_after,
      label: log.change_type,
    }));
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// SUPPLIERS API
// ═══════════════════════════════════════════════════════════════════════════════
export const suppliersApi = {
  list: async (): Promise<Supplier[]> => {
    const { data } = await apiClient.get("/suppliers/");
    _cachedSuppliers = (data as any[]).map(mapSupplier);
    return _cachedSuppliers;
  },

  get: async (id: string): Promise<Supplier | null> => {
    try {
      const { data } = await apiClient.get(`/suppliers/${id}`);
      return mapSupplier(data);
    } catch {
      return null;
    }
  },

  create: async (input: Omit<Supplier, "id" | "rating" | "totalOrders" | "status">): Promise<Supplier> => {
    const payload = {
      name: input.name,
      email: input.email,
      phone: input.phone,
      categories: Array.isArray(input.categories) ? input.categories.join(", ") : input.categories,
      lead_time_days: input.leadTimeDays,
    };
    const { data } = await apiClient.post("/suppliers/", payload);
    return mapSupplier(data);
  },

  update: async (id: string, input: Partial<Supplier>): Promise<Supplier> => {
    const payload: any = {};
    if (input.name !== undefined) payload.name = input.name;
    if (input.email !== undefined) payload.email = input.email;
    if (input.phone !== undefined) payload.phone = input.phone;
    if (input.categories !== undefined)
      payload.categories = Array.isArray(input.categories) ? input.categories.join(", ") : input.categories;
    if (input.leadTimeDays !== undefined) payload.lead_time_days = input.leadTimeDays;
    if (input.status !== undefined) payload.is_active = input.status === "active";
    const { data } = await apiClient.patch(`/suppliers/${id}`, payload);
    return mapSupplier(data);
  },

  remove: async (id: string): Promise<{ ok: boolean }> => {
    await apiClient.delete(`/suppliers/${id}`);
    return { ok: true };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PURCHASE ORDERS API
// ═══════════════════════════════════════════════════════════════════════════════
export const purchaseOrdersApi = {
  list: async (): Promise<PurchaseOrder[]> => {
    if (_cachedSuppliers.length === 0) await suppliersApi.list();
    const { data } = await apiClient.get("/purchase-orders/");
    return (data as any[]).map((po) => mapPO(po, _cachedSuppliers));
  },

  create: async (input: {
    supplierId: string;
    items: POItem[];
    expectedAt: string;
  }): Promise<PurchaseOrder> => {
    if (_cachedSuppliers.length === 0) await suppliersApi.list();
    const payload = {
      supplier_id: input.supplierId,
      notes: `Expected by ${input.expectedAt}`,
      items: input.items.map((i) => ({
        product_id: i.productId || null,
        product_name: i.productName,
        quantity: i.qty,
        unit_price: i.unitPrice,
      })),
    };
    const { data } = await apiClient.post("/purchase-orders/", payload);
    return mapPO(data, _cachedSuppliers);
  },

  updateStatus: async (id: string, status: POStatus): Promise<PurchaseOrder> => {
    if (_cachedSuppliers.length === 0) await suppliersApi.list();
    const { data } = await apiClient.patch(`/purchase-orders/${id}/status`, { status });
    return mapPO(data, _cachedSuppliers);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AUTOMATION API
// ═══════════════════════════════════════════════════════════════════════════════
export const automationApi = {
  logs: async (): Promise<AutomationLog[]> => {
    const { data } = await apiClient.get("/reports/automation-logs");
    return (data as any[]).map(mapAutomationLog);
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// INVOICES API
// ═══════════════════════════════════════════════════════════════════════════════
export const invoicesApi = {
  parse: async (file: File | null): Promise<Invoice> => {
    if (!file) throw new Error("No file provided");
    const form = new FormData();
    form.append("file", file);
    const { data } = await apiClient.post("/invoices/parse", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return {
      id: `inv_${Date.now()}`,
      supplierName: data.supplier_name ?? "Unknown Supplier",
      invoiceNumber: data.invoice_number ?? `INV-${Date.now()}`,
      invoiceDate: data.invoice_date ?? new Date().toISOString().split("T")[0],
      total: data.grand_total ?? 0,
      items: (data.line_items ?? []).map((i: any) => ({
        product: i.name,
        qty: i.qty,
        price: i.unit_price,
        total: i.total,
      })),
    };
  },

  confirm: async (_invoice: Invoice): Promise<{ ok: boolean }> => {
    // Backend doesn't have a confirm endpoint — return ok
    return { ok: true };
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// AI CHAT API
// ═══════════════════════════════════════════════════════════════════════════════
export const aiApi = {
  seed: (): ChatMessage[] => [
    {
      id: "seed_1",
      role: "assistant",
      content:
        "Hi! I'm your SmartStore AI assistant. I have live access to your inventory database. Try asking:\n\n- _\"Which products are low on stock?\"_\n- _\"Are any items expiring soon?\"_\n- _\"Create a draft purchase order for low stock items\"_",
      createdAt: new Date().toISOString(),
    },
  ],

  chat: async (history: ChatMessage[]): Promise<ChatMessage> => {
    const messages = history.map((m) => ({ role: m.role, content: m.content }));
    const { data } = await apiClient.post("/ai/chat", { messages });
    return {
      id: `m_${Date.now()}`,
      role: "assistant",
      content: data.response,
      createdAt: new Date().toISOString(),
      toolCall:
        data.tool_calls_made?.length > 0
          ? { name: data.tool_calls_made[0], result: "ok" }
          : undefined,
    };
  },
};
