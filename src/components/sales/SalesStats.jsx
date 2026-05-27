import React from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function SalesStats({ sales = [], branch }) {
  const filtered = branch === "all" ? sales : sales.filter((s) => s.branch === branch);

  const totalQty = filtered.reduce((sum, s) => sum + (s.quantity || 1), 0);
  const total = filtered.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const profit = filtered.reduce((sum, s) => sum + (s.profit || 0), 0);
  const avg = totalQty > 0 ? total / totalQty : 0;

  // Use first sale's currency, or fallback
  const displayBranch = branch === "all" ? "saudi" : branch;

  const cards = [
    { label: "عدد المبيعات", value: formatNumber(filtered.length), sub: `${formatNumber(totalQty)} قطعة` },
    { label: "إجمالي المبيعات", value: formatCurrency(total, displayBranch), highlight: true },
    { label: "متوسط سعر القطعة", value: formatCurrency(avg, displayBranch) },
    { label: "إجمالي الأرباح", value: formatCurrency(profit, displayBranch), profit: true },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
      {cards.map((c, i) => (
        <div
          key={i}
          className={cn(
            "bg-card border rounded-xl p-4 shadow-sm",
            c.highlight && "border-gold/30 bg-gradient-to-br from-amber-50/60 to-transparent",
            c.profit && "border-emerald-200 bg-emerald-50/30"
          )}
        >
          <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
          <p className={cn(
            "text-lg md:text-2xl font-bold tracking-tight",
            c.highlight && "text-gold",
            c.profit && "text-emerald-700"
          )}>
            {c.value}
          </p>
          {c.sub && <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}