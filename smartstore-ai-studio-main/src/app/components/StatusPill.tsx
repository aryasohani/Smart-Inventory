import { cn } from "@/lib/utils";

type Props = {
  status: "ok" | "low" | "critical" | "active" | "paused" | "draft" | "sent" | "acknowledged" | "received" | "success" | "warning" | "error";
  className?: string;
};

const map: Record<Props["status"], { label: string; cls: string; dot: string }> = {
  ok: { label: "In Stock", cls: "text-success bg-success/10 border-success/20", dot: "bg-success" },
  low: { label: "Low", cls: "text-warning bg-warning/10 border-warning/20", dot: "bg-warning" },
  critical: { label: "Critical", cls: "text-destructive bg-destructive/10 border-destructive/20", dot: "bg-destructive" },
  active: { label: "Active", cls: "text-success bg-success/10 border-success/20", dot: "bg-success" },
  paused: { label: "Paused", cls: "text-muted-foreground bg-muted/40 border-border", dot: "bg-muted-foreground" },
  draft: { label: "Draft", cls: "text-muted-foreground bg-muted/40 border-border", dot: "bg-muted-foreground" },
  sent: { label: "Sent", cls: "text-info bg-info/10 border-info/20", dot: "bg-info" },
  acknowledged: { label: "Acknowledged", cls: "text-primary bg-primary/10 border-primary/20", dot: "bg-primary" },
  received: { label: "Received", cls: "text-success bg-success/10 border-success/20", dot: "bg-success" },
  success: { label: "Success", cls: "text-success bg-success/10 border-success/20", dot: "bg-success" },
  warning: { label: "Warning", cls: "text-warning bg-warning/10 border-warning/20", dot: "bg-warning" },
  error: { label: "Error", cls: "text-destructive bg-destructive/10 border-destructive/20", dot: "bg-destructive" },
};

export function StatusPill({ status, className }: Props) {
  const m = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border", m.cls, className)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} />
      {m.label}
    </span>
  );
}
