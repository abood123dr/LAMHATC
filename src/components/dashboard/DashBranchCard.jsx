import React from "react";
import { BRANCHES, formatCurrency, formatNumber } from "@/lib/utils";
import { TrendingUp, Package, ShoppingBag, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

const BRANCH_STYLES = {
  saudi:  { header: "bg-emerald-50 border-emerald-100", title: "text-emerald-700", bar: "bg-emerald-500" },
  turkey: { header: "bg-rose-50 border-rose-100",       title: "text-rose-700",    bar: "bg-rose-500" },
};

export default function DashBranchCard({ branch, stats, loading }) {
  const info = BRANCHES[branch];
  const s = BRANCH_STYLES[branch];

  const items = [
    { icon: DollarSign, label: "المبيعات",    value: formatCurrency(stats.totalSales, branch) },
    { icon: TrendingUp, label: "الأرباح",     value: formatCurrency(stats.totalProfit, branch), highlight: true },
    { icon: ShoppingBag, label: "عدد البيعات", value: formatNumber(stats.salesCount) },
    { icon: Package,    label: "المخزون",     value: formatNumber(stats.stockCount) },
  ];

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl overflow-hidden animate-pulse">
        <div className={cn("px-5 py-4 border-b", s.header)}>
          <div className="h-5 bg-muted rounded w-32" />
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 bg-muted rounded w-3/4" />
              <div className="h-5 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
      <div className={cn("px-5 py-4 border-b flex items-center gap-3", s.header)}>
        <span className="text-2xl">{info.flag}</span>
        <div>
          <h3 className={cn("font-bold", s.title)}>فرع {info.label}</h3>
          <p className="text-xs text-muted-foreground">إحصائيات الفرع</p>
        </div>
      </div>
      <div className="p-5 grid grid-cols-2 gap-4">
        {items.map(({ icon: Icon, label, value, highlight }) => (
          <div key={label}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
            <p className={cn("font-bold text-base tracking-tight", highlight ? "text-gold" : "text-foreground")}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}