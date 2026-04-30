import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { motion } from "framer-motion";

type Props = {
  label: string;
  value: ReactNode;
  delta?: string;
  trend?: "up" | "down" | "neutral";
  icon: ReactNode;
  accent?: "primary" | "danger" | "warning" | "success";
  hint?: string;
};

const accentMap: Record<NonNullable<Props["accent"]>, string> = {
  primary: "from-primary/15 to-primary/5 text-primary",
  danger: "from-destructive/15 to-destructive/5 text-destructive",
  warning: "from-warning/15 to-warning/5 text-warning",
  success: "from-success/15 to-success/5 text-success",
};

export function StatCard({ label, value, delta, trend = "neutral", icon, accent = "primary", hint }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-card p-5"
    >
      <div className="absolute inset-0 bg-gradient-to-br opacity-50 pointer-events-none" />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
          <span className="text-3xl font-display font-bold tracking-tight">{value}</span>
          {(delta || hint) && (
            <div className="flex items-center gap-2 mt-1">
              {delta && (
                <span
                  className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-md",
                    trend === "up" && "text-success bg-success/10",
                    trend === "down" && "text-destructive bg-destructive/10",
                    trend === "neutral" && "text-muted-foreground bg-muted/40"
                  )}
                >
                  {delta}
                </span>
              )}
              {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
            </div>
          )}
        </div>
        <div
          className={cn(
            "size-11 rounded-xl grid place-items-center bg-gradient-to-br shrink-0 ring-1 ring-inset ring-white/5",
            accentMap[accent]
          )}
        >
          {icon}
        </div>
      </div>
    </motion.div>
  );
}
