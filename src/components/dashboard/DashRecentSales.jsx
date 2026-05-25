import React from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import BranchBadge from "../shared/BranchBadge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function DashRecentSales({ sales = [], loading }) {
  const recent = sales.slice(0, 6);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center">
            <ShoppingBag className="w-4.5 h-4.5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-foreground">أحدث المبيعات</h3>
            <p className="text-xs text-muted-foreground">آخر العمليات</p>
          </div>
        </div>
        <Link to="/sales" className="text-xs text-gold hover:underline flex items-center gap-1">
          عرض الكل <ArrowLeft className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="flex items-center justify-between py-2 animate-pulse">
              <div className="space-y-1.5 flex-1">
                <div className="h-3.5 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/3" />
              </div>
              <div className="h-4 bg-muted rounded w-20" />
            </div>
          ))}
        </div>
      ) : recent.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-8">لا توجد مبيعات بعد</p>
      ) : (
        <div className="divide-y divide-border">
          {recent.map((s) => (
            <div key={s.id} className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground truncate">{s.product_name}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <BranchBadge branch={s.branch} size="sm" />
                  {s.customer_name && (
                    <span className="text-xs text-muted-foreground truncate">· {s.customer_name}</span>
                  )}
                </div>
              </div>
              <div className="text-left shrink-0">
                <p className="font-bold text-gold text-sm">{formatCurrency(s.total_amount, s.branch)}</p>
                {s.sale_date && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {format(new Date(s.sale_date), "d MMM", { locale: ar })}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}