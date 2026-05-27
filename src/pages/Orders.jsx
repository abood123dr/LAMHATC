import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import base44 from "@/api/base44Client";

import { ShoppingBag, Bell, ExternalLink, ChevronDown, Copy, Check, Link } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import BranchBadge from "@/components/shared/BranchBadge";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";
import OrderDetail from "@/components/orders/OrderDetail";

const db = globalThis.__B44_DB__ || base44;

function playOrderSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const notes = [660, 880, 1040];
    notes.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.001, ctx.currentTime + index * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + index * 0.11 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.11 + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + index * 0.11);
      osc.stop(ctx.currentTime + index * 0.11 + 0.18);
    });
  } catch (error) {
    // Sound is optional and may be blocked until the user interacts with the page.
  }
}

const STATUS_LABELS = {
  new:        { label: "جديد",          color: "bg-blue-100 text-blue-700",     dot: "bg-blue-500" },
  processing: { label: "قيد التجهيز",   color: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-500" },
  shipped:    { label: "تم الشحن",      color: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  done:       { label: "مكتمل",         color: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500" },
  cancelled:  { label: "ملغي",          color: "bg-red-100 text-red-700",       dot: "bg-red-500" },
};

const STATUS_ORDER = ["new", "processing", "shipped", "done", "cancelled"];

function StatusDropdown({ order, onUpdate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const st = STATUS_LABELS[order.status] || STATUS_LABELS.new;

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 ${st.color}`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
        {st.label}
        <ChevronDown className="w-3 h-3 opacity-60" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[140px]">
          {STATUS_ORDER.map((s) => {
            const info = STATUS_LABELS[s];
            return (
              <button
                key={s}
                onClick={() => { onUpdate(order.id, s); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs font-semibold hover:bg-gray-50 transition-colors text-right ${order.status === s ? "bg-gray-50" : ""}`}
              >
                <span className={`w-2 h-2 rounded-full ${info.dot}`} />
                {info.label}
                {order.status === s && <span className="mr-auto text-gray-400">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Orders() {
  const qc = useQueryClient();
  const [branch, setBranch] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewing, setViewing] = useState(null);
  const [prevCount, setPrevCount] = useState(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["orders"],
    queryFn: () => db.entities.Order.list("-created_date", 500),
    refetchInterval: 15000,
  });

  // Real-time subscription for new orders
  useEffect(() => {
    const unsubscribe = db.entities.Order.subscribe?.((event) => {
      if (event.type === "create") {
        playOrderSound();
        qc.invalidateQueries({ queryKey: ["orders"] });
        toast(`🛍️ طلب جديد من ${event.data?.customer_name}!`, {
          description: `${event.data?.total_amount?.toLocaleString("ar-SA")} ${event.data?.branch === "saudi" ? "ر.س" : "₺"}`,
          duration: 6000,
          action: { label: "عرض", onClick: () => setViewing(event.data) },
        });
      }
    }) || (() => {});
    return unsubscribe;
  }, [qc]);

  // Notify on first load if new orders exist
  useEffect(() => {
    if (prevCount === null && orders.length > 0) {
      setPrevCount(orders.length);
      return;
    }
    if (prevCount !== null && orders.length > prevCount) {
      playOrderSound();
      toast.success("طلب جديد تمام", {
        description: "تم تحديث قائمة الطلبات تلقائياً.",
        duration: 5000,
      });
      setPrevCount(orders.length);
    }
  }, [orders.length]);

  const updateMut = useMutation({
    mutationFn: ({ id, status }) => db.entities.Order.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });

  const filtered = orders.filter((o) => {
    if (branch !== "all" && o.branch !== branch) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  const newCount = orders.filter((o) => o.status === "new").length;

  const menuUrl = `${window.location.origin}/menu`;
  const [copied, setCopied] = useState(null);

  const copyLink = (branch) => {
    const url = `${menuUrl}?branch=${branch}`;
    navigator.clipboard.writeText(url);
    setCopied(branch);
    toast.success("تم نسخ الرابط!");
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div>
      {/* Menu Links Card */}
      <div className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-luxe">
        <div className="flex items-center gap-2 mb-3">
          <Link className="w-4 h-4 text-gold" />
          <span className="font-bold text-sm">روابط المنيو للعملاء</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { branch: "saudi", label: "🇸🇦 منيو السعودية", color: "emerald" },
            { branch: "turkey", label: "🇹🇷 منيو تركيا", color: "rose" },
          ].map(({ branch, label, color }) => (
            <div key={branch} className="flex items-center gap-2 bg-muted/40 rounded-xl px-3 py-2.5 border border-border">
              <span className="text-xs text-muted-foreground flex-1 truncate" dir="ltr">
                {menuUrl}?branch={branch}
              </span>
              <button
                onClick={() => window.open(`${menuUrl}?branch=${branch}`, "_blank")}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0"
                title="فتح"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => copyLink(branch)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors shrink-0"
                title="نسخ الرابط"
              >
                {copied === branch
                  ? <Check className="w-3.5 h-3.5 text-emerald-500" />
                  : <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                }
              </button>
            </div>
          ))}
        </div>
      </div>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            الطلبات
            {newCount > 0 && (
              <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-sm px-3 py-1 rounded-full font-medium">
                <Bell className="w-3.5 h-3.5" />
                {newCount} جديد
              </span>
            )}
          </span>
        }
        subtitle="طلبات العملاء من صفحة المنيو"
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => window.open(menuUrl + "?branch=saudi", "_blank")}
              className="gap-2 text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              منيو السعودية
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(menuUrl + "?branch=turkey", "_blank")}
              className="gap-2 text-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              منيو تركيا
            </Button>
          </div>
        }
      />

      {/* Branch filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        {[
          { value: "all", label: "جميع الفروع", count: orders.length },
          { value: "saudi", label: "🇸🇦 السعودية", count: orders.filter(o => o.branch === "saudi").length },
          { value: "turkey", label: "🇹🇷 تركيا", count: orders.filter(o => o.branch === "turkey").length },
        ].map((b) => (
          <button
            key={b.value}
            onClick={() => setBranch(b.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              branch === b.value
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            {b.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-md font-bold ${branch === b.value ? "bg-white/20" : "bg-muted"}`}>
              {b.count}
            </span>
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {[
          { value: "all", label: "جميع الحالات" },
          { value: "new", label: "🔵 جديد" },
          { value: "processing", label: "🟡 قيد التجهيز" },
          { value: "shipped", label: "🟣 تم الشحن" },
          { value: "done", label: "🟢 مكتمل" },
          { value: "cancelled", label: "🔴 ملغي" },
        ].map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              statusFilter === s.value
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-luxe overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="لا توجد طلبات"
            description="ستظهر الطلبات هنا فور ورودها من صفحة المنيو"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-right px-5 py-3 font-medium">العميل</th>
                  <th className="text-right px-3 py-3 font-medium">الفرع</th>
                  <th className="text-right px-3 py-3 font-medium">المنتجات</th>
                  <th className="text-right px-3 py-3 font-medium">الإجمالي</th>
                  <th className="text-right px-3 py-3 font-medium">الحالة</th>
                  <th className="text-right px-3 py-3 font-medium">التاريخ</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((order) => {
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-accent/30 transition-colors text-sm cursor-pointer ${order.status === "new" ? "bg-blue-50/40" : ""}`}
                      onClick={() => setViewing(order)}
                    >
                      <td className="px-5 py-3">
                        <p className="font-bold">{order.customer_name}</p>
                        <p className="text-xs text-muted-foreground" dir="ltr">{order.customer_phone}</p>
                      </td>
                      <td className="px-3 py-3">
                        <BranchBadge branch={order.branch} size="sm" />
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {order.items?.length || 0} منتج
                      </td>
                      <td className="px-3 py-3 font-bold">
                        {formatCurrency(order.total_amount, order.branch)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusDropdown order={order} onUpdate={(id, status) => updateMut.mutate({ id, status })} />
                      </td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                        {order.created_date && format(new Date(order.created_date), "d MMM، HH:mm", { locale: ar })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <OrderDetail order={viewing} open={!!viewing} onOpenChange={(v) => !v && setViewing(null)} onStatusChange={(id, status) => updateMut.mutate({ id, status })} />
    </div>
  );
}
