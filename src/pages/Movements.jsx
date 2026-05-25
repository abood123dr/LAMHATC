const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { ArrowUpRight, ArrowDownLeft, Settings2, History } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import BranchBadge from "@/components/shared/BranchBadge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function Movements() {
  const [branch, setBranch] = useState("all");

  const { data: movements = [] } = useQuery({
    queryKey: ["movements"],
    queryFn: () => db.entities.StockMovement.list("-created_date", 500),
  });

  const filtered = branch === "all" ? movements : movements.filter((m) => m.branch === branch);

  const typeConfig = {
    in: { icon: ArrowDownLeft, label: "إضافة", color: "text-emerald-600 bg-emerald-50" },
    out: { icon: ArrowUpRight, label: "بيع / خروج", color: "text-rose-600 bg-rose-50" },
    adjustment: { icon: Settings2, label: "تعديل", color: "text-amber-600 bg-amber-50" },
  };

  return (
    <div>
      <PageHeader
        title="سجل حركة المخزون"
        subtitle="جميع حركات الدخول والخروج لكل فرع"
      />

      <div className="mb-5">
        <Tabs value={branch} onValueChange={setBranch}>
          <TabsList>
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="saudi">🇸🇦 السعودية</TabsTrigger>
            <TabsTrigger value="turkey">🇹🇷 تركيا</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="لا توجد حركات بعد"
          description="ستظهر هنا كل حركات المخزون تلقائيًا عند تسجيل المبيعات"
        />
      ) : (
        <div className="bg-card border border-border rounded-2xl shadow-luxe overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((m) => {
              const cfg = typeConfig[m.movement_type] || typeConfig.adjustment;
              const Icon = cfg.icon;
              return (
                <div key={m.id} className="flex items-center gap-4 p-4 hover:bg-accent/30">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{m.product_name}</p>
                      <BranchBadge branch={m.branch} size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {cfg.label}
                      {m.notes && ` · ${m.notes}`}
                    </p>
                  </div>
                  <div className="text-left shrink-0">
                    <p className={cn(
                      "font-bold text-sm",
                      m.movement_type === "out" ? "text-rose-600" : "text-emerald-600"
                    )}>
                      {m.movement_type === "out" ? "−" : "+"}
                      {m.quantity}
                    </p>
                    <p className="text-[11px] text-muted-foreground whitespace-nowrap">
                      رصيد: {m.balance_after}
                    </p>
                  </div>
                  <div className="hidden md:block text-xs text-muted-foreground whitespace-nowrap shrink-0">
                    {m.created_date && format(new Date(m.created_date), "d MMM · HH:mm", { locale: ar })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}