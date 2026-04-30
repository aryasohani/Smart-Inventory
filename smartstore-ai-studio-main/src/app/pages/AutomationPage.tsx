import { useQuery } from "@tanstack/react-query";
import { automationApi } from "@/app/services/api";
import { PageHeader } from "@/app/components/PageHeader";
import { StatusPill } from "@/app/components/StatusPill";
import { Skeleton } from "@/app/components/Skeleton";
import { Workflow, Clock, AlertTriangle, FileBarChart, Bot, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ICONS: Record<string, React.ReactNode> = {
  "Daily Stock Alert": <AlertTriangle className="size-4" />,
  "Expiry Alert System": <Clock className="size-4" />,
  "Weekly Report Generator": <FileBarChart className="size-4" />,
  "Demand Forecast Refresh": <Bot className="size-4" />,
  "Auto-PO Suggestions": <RefreshCw className="size-4" />,
};

export function AutomationPage() {
  const { data, isLoading } = useQuery({ queryKey: ["automation-logs"], queryFn: automationApi.logs });

  return (
    <div className="space-y-6">
      <PageHeader title="Automation" description="Background jobs that keep SmartStore AI humming — alerts, forecasts, and reports." />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? [1,2,3,4,5].map(i => <Skeleton key={i} className="h-40 rounded-2xl" />) : (data ?? []).map((log) => (
          <div key={log.id} className="rounded-2xl border border-border bg-card p-5 shadow-card relative overflow-hidden">
            <div className="absolute -right-12 -top-12 size-32 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
            <div className="relative">
              <div className="flex items-start justify-between mb-3">
                <div className="size-10 rounded-xl bg-gradient-to-br from-primary/15 to-transparent text-primary grid place-items-center">{ICONS[log.jobName] ?? <Workflow className="size-4" />}</div>
                <StatusPill status={log.status} />
              </div>
              <h3 className="font-display font-semibold text-base">{log.jobName}</h3>
              <code className="text-[10px] text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded mt-1 inline-block">{log.schedule}</code>
              <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{log.output}</p>
              <div className="text-[11px] text-muted-foreground mt-3 pt-3 border-t border-border flex items-center gap-1.5"><Clock className="size-3" />Last run {formatDistanceToNow(new Date(log.lastRunAt), { addSuffix: true })}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-5 border-b border-border"><h3 className="font-display font-semibold text-base">Run history</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="bg-muted/20 text-[11px] uppercase tracking-wider text-muted-foreground"><th className="text-left py-3 px-4">Job</th><th className="text-left py-3 px-4">Schedule</th><th className="text-left py-3 px-4">Last Run</th><th className="text-left py-3 px-4">Status</th><th className="text-left py-3 px-4">Output</th></tr></thead>
          <tbody>
            {(data ?? []).map((log) => (
              <tr key={log.id} className="border-t border-border">
                <td className="py-3 px-4 font-medium">{log.jobName}</td>
                <td className="py-3 px-4"><code className="text-xs text-muted-foreground">{log.schedule}</code></td>
                <td className="py-3 px-4 text-muted-foreground text-xs">{formatDistanceToNow(new Date(log.lastRunAt), { addSuffix: true })}</td>
                <td className="py-3 px-4"><StatusPill status={log.status} /></td>
                <td className="py-3 px-4 text-muted-foreground text-xs max-w-md truncate">{log.output}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
