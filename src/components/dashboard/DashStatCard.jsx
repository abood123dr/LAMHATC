import React from "react";
import { cn } from "@/lib/utils";

const COLORS = {
  gold:    { bg: "bg-amber-50",   icon: "bg-amber-100 text-amber-600",   value: "text-amber-600" },
  purple:  { bg: "bg-purple-50",  icon: "bg-purple-100 text-purple-600", value: "text-purple-600" },
  emerald: { bg: "bg-emerald-50", icon: "bg-emerald-100 text-emerald-600", value: "text-emerald-700" },
  rose:    { bg: "bg-rose-50",    icon: "bg-rose-100 text-rose-600",     value: "text-rose-600" },
};

export default function DashStatCard({ icon: Icon, label, value, sub, color = "gold", loading }) {
  const c = COLORS[color];

  if (loading) {
    return (
      <div className={cn("rounded-2xl p-4 md:p-5 border border-border bg-card space-y-3 animate-pulse")}>
        <div className="w-10 h-10 rounded-xl bg-muted" />
        <div className="h-3 bg-muted rounded w-2/3" />
        <div className="h-7 bg-muted rounded w-4/5" />
        <div className="h-2.5 bg-muted rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className={cn(
      "rounded-2xl p-4 md:p-5 border border-border bg-card",
      "hover:shadow-md transition-all duration-200 active:scale-[0.98] cursor-default group"
    )}>
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", c.icon)}>
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <p className="text-xs text-muted-foreground font-medium mb-1 truncate">{label}</p>
      <p className={cn("text-xl md:text-2xl font-bold tracking-tight", c.value)}>{value}</p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1 truncate">{sub}</p>}
    </div>
  );
}