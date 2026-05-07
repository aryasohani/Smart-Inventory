import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/app/store/authStore";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, Lock, Loader2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

export function LoginPage() {
  const { isAuthenticated, login } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string; email?: string } };
  const [email, setEmail] = useState(location.state?.email ?? "admin.e2e@smartstore.ai");
  const [password, setPassword] = useState("StrongPass123");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back", { description: "Signed in to SmartStore AI" });
      navigate(location.state?.from ?? "/dashboard");
    } catch {
      toast.error("Sign in failed", { description: "Please check your credentials" });
    } finally {
      setLoading(false);
    }
  };

  const quick = (e: string) => {
    setEmail(e);
    setPassword("StrongPass123");
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-radial-gold)" }} />
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-gradient-gold grid place-items-center shadow-glow">
              <Sparkles className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="leading-tight">
              <div className="font-display font-bold">SmartStore</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">AI Platform</div>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="max-w-md"
          >
            <h1 className="text-4xl xl:text-5xl font-display font-bold leading-[1.1] tracking-tight">
              Inventory that <span className="text-gradient-gold">thinks ahead.</span>
            </h1>
            <p className="text-muted-foreground mt-5 text-base leading-relaxed">
              AI-powered demand forecasting, vendor intelligence, and automation. Built for operators who don't want to babysit spreadsheets.
            </p>

            <div className="mt-10 space-y-3">
              {[
                { k: "94%", v: "Forecast accuracy across 1,200+ SKUs" },
                { k: "12hr", v: "Average reduction in stockout response" },
                { k: "8×", v: "Faster purchase order workflows" },
              ].map((s) => (
                <div key={s.k} className="flex items-center gap-4">
                  <div className="text-2xl font-display font-bold text-gradient-gold w-16">{s.k}</div>
                  <div className="text-sm text-muted-foreground">{s.v}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="text-xs text-muted-foreground/60">© 2026 SmartStore AI · Enterprise grade</div>
        </div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative">
        <div className="lg:hidden absolute inset-0" style={{ background: "var(--gradient-radial-gold)" }} />
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-sm"
        >
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="size-10 rounded-xl bg-gradient-gold grid place-items-center shadow-glow">
              <Sparkles className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <div className="font-display font-bold text-lg">SmartStore AI</div>
          </div>

          <h2 className="text-2xl font-display font-bold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground mt-1.5">Sign in to your operator dashboard</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <Field icon={<Mail className="size-4" />} label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="you@company.com"
              />
            </Field>
            <Field icon={<Lock className="size-4" />} label="Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="••••••••"
              />
            </Field>

            <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-glow font-semibold">
              {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Signing in...</> : "Sign in"}
            </Button>
            <Button type="button" variant="outline" className="w-full h-11" onClick={() => navigate("/signup")}>
              Create a new account
            </Button>
          </form>

          <div className="mt-7 pt-6 border-t border-border">
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="size-3" /> Demo accounts
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => quick("admin.e2e@smartstore.ai")} className="text-left rounded-lg border border-border p-2.5 hover:border-primary/40 transition-colors">
                <div className="text-xs font-semibold">Admin (E2E)</div>
                <div className="text-[10px] text-muted-foreground truncate">admin.e2e@smartstore.ai</div>
              </button>
              <button onClick={() => quick("staff.e2e@smartstore.ai")} className="text-left rounded-lg border border-border p-2.5 hover:border-primary/40 transition-colors">
                <div className="text-xs font-semibold">Staff (E2E)</div>
                <div className="text-[10px] text-muted-foreground truncate">staff.e2e@smartstore.ai</div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">{label}</div>
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-input/40 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/30 transition-all">
        <span className="text-muted-foreground">{icon}</span>
        {children}
      </div>
    </label>
  );
}
