import React from "react";
import { formatNumber } from "@/lib/utils";
import { Trophy } from "lucide-react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const RANK_COLORS = ["text-amber-500", "text-slate-400", "text-amber-700", "text-muted-foreground", "text-muted-foreground"];

export default function DashTopProducts({ sales = [], loading }) {
  const map = {};
  sales.forEach((s) => {
    const key = s.product_name || "غير محدد";
    if (!map[key]) map[key] = { name: key, count: 0 };
    map[key].count += s.quantity || 1;
  });

  const top = Object.values(map).sort((a, b) => b.count - a.count).slice(0, 5);
  const max = top[0]?.count || 1;

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
            <Trophy className="w-4.5 h-4.5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">الأكثر مبيعًا</h3>
            <p className="text-xs text-muted-foreground">أعلى 5 منتجات</p>
          </div>
        </div>
        <Link to="/sales" className="text-xs text-gold hover:underline flex items-center gap-1">
          عرض الكل <ArrowLeft className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="space-y-1.5 animate-pulse">
              <div className="flex justify-between">
                <div className="h-3.5 bg-muted rounded w-2/3" />
                <div className="h-3.5 bg-muted rounded w-12" />
              </div>
              <div className="h-1.5 bg-muted rounded-full w-full" />
            </div>
          ))}
        </div>
      ) : top.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">لا توجد مبيعات بعد</p>
      ) : (
        <div className="space-y-3.5">
          {top.map((p, idx) => (
            <div key={p.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-xs font-bold w-4 shrink-0 ${RANK_COLORS[idx]}`}>#{idx + 1}</span>
                  <span className="font-medium text-sm text-foreground truncate">{p.name}</span>
                </div>
                <span className="text-xs font-bold text-gold shrink-0 mr-2">{formatNumber(p.count)} قطعة</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${(p.count / max) * 100}%`,
                    background: "linear-gradient(90deg, hsl(var(--gold-light)), hsl(var(--gold)))",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}