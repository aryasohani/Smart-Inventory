// Mock data for SmartStore AI
import type { Product, Supplier, PurchaseOrder, AutomationLog, ChatMessage, Invoice, ForecastPoint, StockHistoryPoint } from "./types";

export const mockSuppliers: Supplier[] = [
  { id: "sup_1", name: "Aurora Wholesale Co.", email: "orders@aurora-wholesale.com", phone: "+1 415 555 0142", categories: ["Beverages", "Snacks"], leadTimeDays: 4, rating: 4.8, totalOrders: 124, status: "active" },
  { id: "sup_2", name: "MediCore Distribution", email: "supply@medicore.io", phone: "+1 212 555 0188", categories: ["Pharmacy", "Health"], leadTimeDays: 2, rating: 4.9, totalOrders: 312, status: "active" },
  { id: "sup_3", name: "GreenFields Organic", email: "sales@greenfields.co", phone: "+1 503 555 0123", categories: ["Produce", "Dairy"], leadTimeDays: 1, rating: 4.6, totalOrders: 87, status: "active" },
  { id: "sup_4", name: "Northwind Electronics", email: "b2b@northwind.tech", phone: "+1 206 555 0167", categories: ["Electronics"], leadTimeDays: 7, rating: 4.4, totalOrders: 56, status: "active" },
  { id: "sup_5", name: "Pacific Paper Goods", email: "info@pacificpaper.com", phone: "+1 408 555 0199", categories: ["Household"], leadTimeDays: 5, rating: 4.2, totalOrders: 42, status: "paused" },
];

const today = new Date();
const addDays = (n: number) => new Date(today.getTime() + n * 86400000).toISOString();

export const mockProducts: Product[] = [
  { id: "prd_1", sku: "BEV-COLA-330", name: "Premium Cola 330ml", category: "Beverages", price: 1.49, cost: 0.62, stock: 12, reorderLevel: 80, expiryDate: addDays(45), supplierId: "sup_1", status: "critical", velocity: 38, image: "" },
  { id: "prd_2", sku: "SNK-CHIP-150", name: "Sea Salt Chips 150g", category: "Snacks", price: 2.99, cost: 1.05, stock: 240, reorderLevel: 100, expiryDate: addDays(120), supplierId: "sup_1", status: "ok", velocity: 22, image: "" },
  { id: "prd_3", sku: "MED-PARA-500", name: "Paracetamol 500mg (24ct)", category: "Pharmacy", price: 6.50, cost: 2.10, stock: 58, reorderLevel: 60, expiryDate: addDays(8), supplierId: "sup_2", status: "low", velocity: 14, image: "" },
  { id: "prd_4", sku: "MED-VITC-1000", name: "Vitamin C 1000mg (60ct)", category: "Health", price: 14.99, cost: 5.40, stock: 320, reorderLevel: 80, expiryDate: addDays(180), supplierId: "sup_2", status: "ok", velocity: 9, image: "" },
  { id: "prd_5", sku: "PRD-MILK-1L", name: "Organic Whole Milk 1L", category: "Dairy", price: 3.99, cost: 1.80, stock: 24, reorderLevel: 50, expiryDate: addDays(5), supplierId: "sup_3", status: "critical", velocity: 31, image: "" },
  { id: "prd_6", sku: "PRD-EGG-12", name: "Free-Range Eggs (12)", category: "Dairy", price: 5.49, cost: 2.40, stock: 88, reorderLevel: 40, expiryDate: addDays(14), supplierId: "sup_3", status: "ok", velocity: 18, image: "" },
  { id: "prd_7", sku: "PRD-AVO-1", name: "Hass Avocado", category: "Produce", price: 1.25, cost: 0.55, stock: 6, reorderLevel: 30, expiryDate: addDays(4), supplierId: "sup_3", status: "critical", velocity: 27, image: "" },
  { id: "prd_8", sku: "ELEC-USB-C", name: "USB-C Charging Cable 2m", category: "Electronics", price: 12.99, cost: 3.20, stock: 152, reorderLevel: 50, expiryDate: addDays(900), supplierId: "sup_4", status: "ok", velocity: 6, image: "" },
  { id: "prd_9", sku: "ELEC-EAR-W", name: "Wireless Earbuds Pro", category: "Electronics", price: 79.99, cost: 28.40, stock: 18, reorderLevel: 25, expiryDate: addDays(900), supplierId: "sup_4", status: "low", velocity: 4, image: "" },
  { id: "prd_10", sku: "HSE-PAPER-12", name: "Bath Tissue 12-pack", category: "Household", price: 9.99, cost: 4.20, stock: 410, reorderLevel: 80, expiryDate: addDays(900), supplierId: "sup_5", status: "ok", velocity: 11, image: "" },
  { id: "prd_11", sku: "BEV-WTR-500", name: "Spring Water 500ml", category: "Beverages", price: 0.99, cost: 0.22, stock: 38, reorderLevel: 150, expiryDate: addDays(60), supplierId: "sup_1", status: "low", velocity: 52, image: "" },
  { id: "prd_12", sku: "MED-IBU-200", name: "Ibuprofen 200mg (50ct)", category: "Pharmacy", price: 8.49, cost: 2.80, stock: 14, reorderLevel: 40, expiryDate: addDays(10), supplierId: "sup_2", status: "critical", velocity: 12, image: "" },
];

export const mockPurchaseOrders: PurchaseOrder[] = [
  { id: "po_1001", supplierId: "sup_1", supplierName: "Aurora Wholesale Co.", status: "received", createdAt: addDays(-12), expectedAt: addDays(-8), total: 1284.50, itemCount: 8, items: [] },
  { id: "po_1002", supplierId: "sup_2", supplierName: "MediCore Distribution", status: "acknowledged", createdAt: addDays(-3), expectedAt: addDays(1), total: 4210.00, itemCount: 14, items: [] },
  { id: "po_1003", supplierId: "sup_3", supplierName: "GreenFields Organic", status: "sent", createdAt: addDays(-1), expectedAt: addDays(2), total: 612.30, itemCount: 5, items: [] },
  { id: "po_1004", supplierId: "sup_4", supplierName: "Northwind Electronics", status: "draft", createdAt: addDays(0), expectedAt: addDays(7), total: 2890.00, itemCount: 3, items: [] },
  { id: "po_1005", supplierId: "sup_1", supplierName: "Aurora Wholesale Co.", status: "received", createdAt: addDays(-22), expectedAt: addDays(-18), total: 980.10, itemCount: 6, items: [] },
];

export const mockAutomationLogs: AutomationLog[] = [
  { id: "log_1", jobName: "Daily Stock Alert", schedule: "0 8 * * *", lastRunAt: new Date(today.setHours(8,0,0,0)).toISOString(), status: "success", output: "12 low-stock SKUs identified, 3 critical alerts sent to Admin." },
  { id: "log_2", jobName: "Expiry Alert System", schedule: "0 9 * * *", lastRunAt: new Date(today.setHours(9,0,0,0)).toISOString(), status: "success", output: "5 products expiring within 7 days flagged." },
  { id: "log_3", jobName: "Weekly Report Generator", schedule: "0 7 * * 1", lastRunAt: addDays(-2), status: "success", output: "Weekly summary generated and emailed to 4 recipients." },
  { id: "log_4", jobName: "Demand Forecast Refresh", schedule: "0 */6 * * *", lastRunAt: addDays(0), status: "success", output: "Forecasts updated for 1,284 SKUs (avg confidence 87%)." },
  { id: "log_5", jobName: "Auto-PO Suggestions", schedule: "0 6 * * *", lastRunAt: addDays(0), status: "warning", output: "8 reorder suggestions generated. 1 supplier (Pacific Paper Goods) is paused." },
];

export const mockChatSeed: ChatMessage[] = [
  {
    id: "m_seed",
    role: "assistant",
    content: "Hi 👋 I'm your SmartStore AI assistant. I can help with stock levels, forecasts, supplier insights, and creating purchase orders. Try asking *\"Which products will run out soon?\"*",
    createdAt: new Date().toISOString(),
  },
];

export const mockInvoice: Invoice = {
  id: "inv_demo",
  supplierName: "Aurora Wholesale Co.",
  invoiceNumber: "AWC-2025-04812",
  invoiceDate: addDays(-2),
  total: 1284.5,
  items: [
    { product: "Premium Cola 330ml (case of 24)", qty: 20, price: 18.40, total: 368.0 },
    { product: "Sea Salt Chips 150g (case of 12)", qty: 15, price: 19.20, total: 288.0 },
    { product: "Spring Water 500ml (case of 24)", qty: 30, price: 7.20, total: 216.0 },
    { product: "Energy Drink 250ml (case of 12)", qty: 18, price: 22.90, total: 412.5 },
  ],
};

export function generateForecast(velocity: number): ForecastPoint[] {
  const out: ForecastPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const noise = (Math.sin(i * 1.3) + 1) * 0.15;
    const trend = i * 0.04;
    const value = Math.max(0, Math.round(velocity * (1 + noise + trend)));
    const conf = Math.round(85 + Math.cos(i) * 6);
    out.push({
      day: `Day ${i + 1}`,
      date: new Date(today.getTime() + i * 86400000).toISOString(),
      forecast: value,
      lower: Math.max(0, Math.round(value * 0.78)),
      upper: Math.round(value * 1.22),
      confidence: conf,
    });
  }
  return out;
}

export function generateStockHistory(currentStock: number): StockHistoryPoint[] {
  const out: StockHistoryPoint[] = [];
  let stock = currentStock + Math.round(Math.random() * 80) + 40;
  for (let i = 13; i >= 0; i--) {
    const change = Math.round((Math.random() - 0.55) * 18);
    stock = Math.max(0, stock + change);
    out.push({
      date: new Date(today.getTime() - i * 86400000).toISOString(),
      stock,
      label: `${14 - i}d ago`,
    });
  }
  out[out.length - 1].stock = currentStock;
  return out;
}
