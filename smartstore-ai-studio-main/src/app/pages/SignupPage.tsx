// import { useState, type FormEvent } from "react";
// import { Navigate, useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { Loader2, Lock, Mail, Sparkles, UserRound, UsersRound } from "lucide-react";
// import { toast } from "sonner";
// import { useAuthStore } from "@/app/store/authStore";
// import { authApi } from "@/app/services/api";
// import type { Role } from "@/app/services/types";
// import { Button } from "@/components/ui/button";

// export function SignupPage() {
//   const { isAuthenticated } = useAuthStore();
//   const navigate = useNavigate();
//   const [fullName, setFullName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [role, setRole] = useState<Role>("staff");
//   const [loading, setLoading] = useState(false);

//   if (isAuthenticated) return <Navigate to="/dashboard" replace />;

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (loading) return;
//     setLoading(true);
//     try {
//       await authApi.register(email, password, fullName, role);
//       toast.success("Account created", { description: "You can now sign in with your new account" });
//       navigate("/login", { state: { email } });
//     } catch (error: any) {
//       const detail = error?.response?.data?.detail;
//       toast.error("Sign up failed", {
//         description: typeof detail === "string" ? detail : "Please verify your details and try again",
//       });
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full flex relative overflow-hidden">
//       <div className="hidden lg:flex flex-1 relative overflow-hidden border-r border-border">
//         <div className="absolute inset-0 bg-gradient-mesh" />
//         <div className="absolute inset-0" style={{ background: "var(--gradient-radial-gold)" }} />
//         <div className="relative z-10 flex flex-col justify-between p-14 w-full">
//           <div className="flex items-center gap-2.5">
//             <div className="size-10 rounded-xl bg-gradient-gold grid place-items-center shadow-glow">
//               <Sparkles className="size-5 text-primary-foreground" strokeWidth={2.5} />
//             </div>
//             <div className="leading-tight">
//               <div className="font-display font-bold">SmartStore</div>
//               <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">AI Platform</div>
//             </div>
//           </div>
//           <motion.div
//             initial={{ opacity: 0, y: 20 }}
//             animate={{ opacity: 1, y: 0 }}
//             transition={{ delay: 0.1, duration: 0.5 }}
//             className="max-w-md"
//           >
//             <h1 className="text-4xl xl:text-5xl font-display font-bold leading-[1.1] tracking-tight">
//               One signup, <span className="text-gradient-gold">all operator roles.</span>
//             </h1>
//             <p className="text-muted-foreground mt-5 text-base leading-relaxed">
//               Create users for admin and staff roles from one screen, backed by the same secure auth service.
//             </p>
//           </motion.div>
//           <div className="text-xs text-muted-foreground/60">© 2026 SmartStore AI · Enterprise grade</div>
//         </div>
//       </div>

//       <div className="flex-1 flex items-center justify-center p-6 lg:p-10 relative">
//         <div className="lg:hidden absolute inset-0" style={{ background: "var(--gradient-radial-gold)" }} />
//         <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm">
//           <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
//             <div className="size-10 rounded-xl bg-gradient-gold grid place-items-center shadow-glow">
//               <Sparkles className="size-5 text-primary-foreground" strokeWidth={2.5} />
//             </div>
//             <div className="font-display font-bold text-lg">SmartStore AI</div>
//           </div>

//           <h2 className="text-2xl font-display font-bold tracking-tight">Create account</h2>
//           <p className="text-sm text-muted-foreground mt-1.5">Register admin or staff access from one signup form</p>

//           <form onSubmit={handleSubmit} className="mt-8 space-y-4">
//             <Field icon={<UserRound className="size-4" />} label="Full name">
//               <input
//                 type="text"
//                 value={fullName}
//                 onChange={(e) => setFullName(e.target.value)}
//                 required
//                 className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
//                 placeholder="John Doe"
//               />
//             </Field>
//             <Field icon={<Mail className="size-4" />} label="Email">
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 required
//                 className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
//                 placeholder="you@company.com"
//               />
//             </Field>
//             <Field icon={<Lock className="size-4" />} label="Password">
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 required
//                 minLength={8}
//                 className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
//                 placeholder="Minimum 8 characters"
//               />
//             </Field>
//             <Field icon={<UsersRound className="size-4" />} label="Role">
//               <select
//                 value={role}
//                 onChange={(e) => setRole(e.target.value as Role)}
//                 className="w-full bg-transparent text-sm outline-none"
//               >
//                 <option value="staff">Staff</option>
//                 <option value="admin">Admin</option>
//               </select>
//             </Field>

//             <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-gold text-primary-foreground hover:opacity-90 shadow-glow font-semibold">
//               {loading ? <><Loader2 className="size-4 mr-2 animate-spin" /> Creating account...</> : "Sign up"}
//             </Button>
//             <Button type="button" variant="outline" className="w-full h-11" onClick={() => navigate("/login")}>
//               Back to sign in
//             </Button>
//           </form>
//         </motion.div>
//       </div>
//     </div>
//   );
// }

// function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
//   return (
//     <label className="block">
//       <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 font-semibold">{label}</div>
//       <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border bg-input/40 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-ring/30 transition-all">
//         <span className="text-muted-foreground">{icon}</span>
//         {children}
//       </div>
//     </label>
//   );
// }

import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock, Mail, Sparkles, UserRound, UsersRound } from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/app/store/authStore";
import { authApi } from "@/app/services/api";
import type { Role } from "@/app/services/types";
import { Button } from "@/components/ui/button";

export function SignupPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [full_name, setFull_name] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const validate = () => {
    if (!full_name.trim()) {
      toast.error("Validation Error", { description: "Full name is required" });
      return false;
    }

    if (!email.trim()) {
      toast.error("Validation Error", { description: "Email is required" });
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      toast.error("Validation Error", { description: "Invalid email format" });
      return false;
    }

    if (!password || password.length < 8) {
      toast.error("Validation Error", {
        description: "Password must be at least 8 characters",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // ✅ FRONTEND VALIDATION
    if (!validate()) return;

    setLoading(true);

    try {
      console.log("🚀 Register Payload:", {
        email,
        password,
        full_name,
        role,
      });

      await authApi.register(email, password, full_name, role);

      toast.success("Account created", {
        description: "You can now sign in with your new account",
      });

      navigate("/login", { state: { email } });

    } catch (error: any) {
      console.error("❌ FULL REGISTER ERROR:", error);

      let message = "Something went wrong";

      if (error?.response?.data) {
        const data = error.response.data;

        // FastAPI typical formats
        if (typeof data.detail === "string") {
          message = data.detail;
        } else if (Array.isArray(data.detail)) {
          message = data.detail.map((d: any) => d.msg).join(", ");
        } else {
          message = JSON.stringify(data);
        }
      } else if (error?.message) {
        message = error.message;
      }

      toast.error("Sign up failed", {
        description: message,
      });

    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden">
      <div className="hidden lg:flex flex-1 relative overflow-hidden border-r border-border">
        <div className="absolute inset-0 bg-gradient-mesh" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-radial-gold)" }} />
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-gradient-gold grid place-items-center shadow-glow">
              <Sparkles className="size-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold">SmartStore</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-primary font-semibold">
                AI Platform
              </div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-4xl font-bold">
              One signup, <span className="text-gradient-gold">all roles</span>
            </h1>
            <p className="text-muted-foreground mt-4">
              Create admin or staff accounts securely.
            </p>
          </motion.div>

          <div className="text-xs text-muted-foreground/60">
            © 2026 SmartStore AI
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold">Create account</h2>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">

            <Field label="Full name" icon={<UserRound size={16} />}>
              <input
                type="text"
                value={full_name}
                onChange={(e) => setFull_name(e.target.value)}
                placeholder="John Doe"
                className="w-full bg-transparent outline-none"
              />
            </Field>

            <Field label="Email" icon={<Mail size={16} />}>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full bg-transparent outline-none"
              />
            </Field>

            <Field label="Password" icon={<Lock size={16} />}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full bg-transparent outline-none"
              />
            </Field>

            <Field label="Role" icon={<UsersRound size={16} />}>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full bg-transparent outline-none"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </Field>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} />
                  Creating...
                </>
              ) : (
                "Sign up"
              )}
            </Button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}

function Field({ label, icon, children }: any) {
  return (
    <label className="block">
      <div className="text-xs mb-1">{label}</div>
      <div className="flex items-center gap-2 border p-2 rounded">
        {icon}
        {children}
      </div>
    </label>
  );
}