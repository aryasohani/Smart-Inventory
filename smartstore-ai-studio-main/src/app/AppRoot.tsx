import { MemoryRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoginPage } from "@/app/pages/LoginPage";
import { SignupPage } from "@/app/pages/SignupPage";
import { ProtectedRoute } from "@/app/auth/ProtectedRoute";
import { AppLayout } from "@/app/layouts/AppLayout";
import { DashboardPage } from "@/app/pages/DashboardPage";
import { ProductsPage } from "@/app/pages/ProductsPage";
import { ProductDetailPage } from "@/app/pages/ProductDetailPage";
import { ProductFormPage } from "@/app/pages/ProductFormPage";
import { SuppliersPage } from "@/app/pages/SuppliersPage";
import { SupplierFormPage } from "@/app/pages/SupplierFormPage";
import { PurchaseOrdersPage } from "@/app/pages/PurchaseOrdersPage";
import { PurchaseOrderFormPage } from "@/app/pages/PurchaseOrderFormPage";
import { InvoiceOcrPage } from "@/app/pages/InvoiceOcrPage";
import { AutomationPage } from "@/app/pages/AutomationPage";
import { ReportsPage } from "@/app/pages/ReportsPage";
import { NotFoundPage } from "@/app/pages/NotFoundPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

export function AppRoot() {
  const initialEntry =
    typeof window === "undefined"
      ? "/"
      : `${window.location.pathname}${window.location.search}${window.location.hash}`;

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={150}>
        <div className="dark">
          <MemoryRouter initialEntries={[initialEntry]}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/new" element={<ProductFormPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/products/:id/edit" element={<ProductFormPage />} />
                  <Route path="/suppliers" element={<SuppliersPage />} />
                  <Route path="/suppliers/new" element={<SupplierFormPage />} />
                  <Route path="/suppliers/:id/edit" element={<SupplierFormPage />} />
                  <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                  <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
                  <Route path="/invoices" element={<InvoiceOcrPage />} />
                  <Route path="/automation" element={<AutomationPage />} />
                  <Route path="/reports" element={<ReportsPage />} />
                </Route>
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </MemoryRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              classNames: {
                toast: "glass border-border text-foreground",
              },
            }}
          />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
