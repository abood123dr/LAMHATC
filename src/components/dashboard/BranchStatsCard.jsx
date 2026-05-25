import React from "react";
import { BRANCHES, formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, Package, ShoppingBag, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BranchStatsCard({ branch, stats, delay = 0 }) {
  const info = BRANCHES[branch];
  const accent = branch === "saudi" ? "emerald" : "rose";

  const bgAccents = {
    emerald: "bg-emerald-50 border-emerald-100",
    rose: "bg-rose-50 border-rose-100",
  };

  const textAccents = {
    emerald: "text-emerald-700",
    rose: "text-rose-700",
  };

  return (
    <div
      className="bg-card border border-border rounded-2xl overflow-hidden shadow-luxe animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={cn("px-6 py-4 border-b border-border flex items-center justify-between", bgAccents[accent])}>
        <div className="flex items-center gap-3">
          <span className="text-3xl">{info.flag}</span>
          <div>
            <h3 className={cn("font-bold text-lg", textAccents[accent])}>
              فرع {info.label}
            </h3>
            <p className="text-xs text-muted-foreground">إحصائيات الفرع</p>
          </div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-5">
        <StatLine
          icon={DollarSign}
          label="إجمالي المبيعات"
          value={formatCurrency(stats.totalSales, branch)}
        />
        <StatLine
          icon={TrendingUp}
          label="إجمالي الأرباح"
          value={formatCurrency(stats.totalProfit, branch)}
          accent
        />
        <StatLine
          icon={ShoppingBag}
          label="عدد المبيعات"
          value={formatNumber(stats.salesCount)}
        />
        <StatLine
          icon={Package}
          label="المخزون المتبقي"
          value={formatNumber(stats.stockCount)}
        />
      </div>
    </div>
  );
}

function StatLine({ icon: Icon, label, value, accent }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className={cn("font-bold text-base md:text-lg tracking-tight", accent && "text-gold")}>
        {value}
      </p>
    </div>
  );
}