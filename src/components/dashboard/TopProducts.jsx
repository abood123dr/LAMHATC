import React from "react";
import { formatNumber } from "@/lib/utils";
import { Trophy, Package } from "lucide-react";
import EmptyState from "../shared/EmptyState";

export default function TopProducts({ sales = [] }) {
  // Aggregate sales by product
  const map = {};
  sales.forEach((s) => {
    const key = s.product_name || "غير محدد";
    if (!map[key]) {
      map[key] = { name: key, count: 0, revenue: 0 };
    }
    map[key].count += s.quantity || 1;
    map[key].revenue += s.total_amount || 0;
  });

  const top = Object.values(map)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const max = top[0]?.count || 1;

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-luxe">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
          <Trophy className="w-5 h-5 text-gold" />
        </div>
        <div>
          <h3 className="font-bold text-foreground">المنتجات الأكثر مبيعًا</h3>
          <p className="text-xs text-muted-foreground">أعلى 5 منتجات</p>
        </div>
      </div>

      {top.length === 0 ? (
        <EmptyState icon={Package} title="لا توجد مبيعات بعد" />
      ) : (
        <div className="space-y-4">
          {top.map((p, idx) => (
            <div key={p.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 h-6 rounded-md bg-accent text-gold text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-sm text-foreground truncate">
                    {p.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-gold shrink-0 mr-2">
                  {formatNumber(p.count)} قطعة
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full gradient-gold rounded-full transition-all duration-700"
                  style={{ width: `${(p.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}