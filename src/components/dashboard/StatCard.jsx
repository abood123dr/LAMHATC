import React from "react";
import { cn } from "@/lib/utils";

export default function StatCard({ icon: Icon, label, value, sublabel, accent = "gold", delay = 0 }) {
  const accents = {
    gold: "from-amber-50 to-transparent text-gold",
    emerald: "from-emerald-50 to-transparent text-emerald-600",
    rose: "from-rose-50 to-transparent text-rose-600",
    slate: "from-slate-50 to-transparent text-slate-700",
  };

  return (
    <div
      className="relative overflow-hidden bg-card border border-border rounded-2xl p-6 shadow-luxe hover:shadow-luxe-lg transition-all duration-300 animate-fade-up group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("absolute -top-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-br opacity-60", accents[accent])} />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center bg-white border border-border shadow-sm", accents[accent])}>
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
        </div>

        <p className="text-xs font-medium text-muted-foreground tracking-wide">
          {label}
        </p>
        <p className="text-2xl md:text-3xl font-bold text-foreground mt-1.5 tracking-tight">
          {value}
        </p>
        {sublabel && (
          <p className="text-xs text-muted-foreground mt-1.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}