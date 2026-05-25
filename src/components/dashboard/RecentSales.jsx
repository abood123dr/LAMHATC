import React from "react";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/utils";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import BranchBadge from "../shared/BranchBadge";
import EmptyState from "../shared/EmptyState";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function RecentSales({ sales = [] }) {
  const recent = sales.slice(0, 6);

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-luxe">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">أحدث المبيعات</h3>
            <p className="text-xs text-muted-foreground">آخر العمليات</p>
          </div>
        </div>
        <Link
          to="/sales"
          className="text-xs text-gold hover:underline flex items-center gap-1"
        >
          عرض الكل <ArrowLeft className="w-3 h-3" />
        </Link>
      </div>

      {recent.length === 0 ? (
        <EmptyState icon={ShoppingBag} title="لا توجد مبيعات بعد" />
      ) : (
        <div className="divide-y divide-border">
          {recent.map((s) => (
            <div
              key={s.id}
              className="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-foreground truncate">
                  {s.product_name}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <BranchBadge branch={s.branch} size="sm" />
                  {s.customer_name && (
                    <span className="text-xs text-muted-foreground truncate">
                      · {s.customer_name}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-left shrink-0">
                <p className="font-bold text-gold text-sm">
                  {formatCurrency(s.total_amount, s.branch)}
                </p>
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