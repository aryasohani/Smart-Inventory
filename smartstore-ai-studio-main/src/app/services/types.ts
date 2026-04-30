export type Role = "admin" | "staff";

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  reorderLevel: number;
  expiryDate: string;
  supplierId: string;
  status: "ok" | "low" | "critical";
  velocity: number; // units / day
  image?: string;
  description?: string;
};

export type Supplier = {
  id: string;
  name: string;
  email: string;
  phone: string;
  categories: string[];
  leadTimeDays: number;
  rating: number;
  totalOrders: number;
  status: "active" | "paused";
};

export type POStatus = "draft" | "sent" | "acknowledged" | "received";

export type POItem = {
  productId: string;
  productName: string;
  sku?: string;
  qty: number;
  unitPrice: number;
};

export type PurchaseOrder = {
  id: string;
  supplierId: string;
  supplierName: string;
  status: POStatus;
  createdAt: string;
  expectedAt: string;
  total: number;
  itemCount: number;
  items: POItem[];
};

export type AutomationLog = {
  id: string;
  jobName: string;
  schedule: string;
  lastRunAt: string;
  status: "success" | "warning" | "error";
  output: string;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  toolCall?: { name: string; result: string };
};

export type Invoice = {
  id: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  total: number;
  items: { product: string; qty: number; price: number; total: number }[];
};

export type ForecastPoint = {
  day: string;
  date: string;
  forecast: number;
  lower: number;
  upper: number;
  confidence: number;
};

export type StockHistoryPoint = {
  date: string;
  stock: number;
  label: string;
};
