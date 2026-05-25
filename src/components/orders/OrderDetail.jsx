const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import BranchBadge from "@/components/shared/BranchBadge";
import { Phone, MapPin, MessageCircle, Package, Calendar, Hash, CheckCircle2, Truck, Clock, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

import { toast } from "sonner";

const STATUS_LABELS = {
  new:        { label: "جديد",        color: "bg-blue-100 text-blue-700",      dot: "bg-blue-500",     icon: Clock },
  processing: { label: "قيد التجهيز", color: "bg-yellow-100 text-yellow-700",  dot: "bg-yellow-500",   icon: Package },
  shipped:    { label: "تم الشحن",    color: "bg-purple-100 text-purple-700",  dot: "bg-purple-500",   icon: Truck },
  done:       { label: "مكتمل",       color: "bg-emerald-100 text-emerald-700",dot: "bg-emerald-500",  icon: CheckCircle2 },
  cancelled:  { label: "ملغي",        color: "bg-red-100 text-red-700",        dot: "bg-red-500",      icon: XCircle },
};

const STATUS_FLOW = [
  { key: "new", label: "جديد" },
  { key: "processing", label: "قيد التجهيز" },
  { key: "shipped", label: "تم الشحن" },
  { key: "done", label: "مكتمل" },
];

const NEXT_STATUS = { new: "processing", processing: "shipped", shipped: "done" };
const NEXT_LABEL  = { new: "بدء التجهيز", processing: "تأكيد الشحن", shipped: "تأكيد الاستلام ✓" };
const NEXT_COLOR  = { new: "bg-yellow-500 hover:bg-yellow-600", processing: "bg-purple-500 hover:bg-purple-600", shipped: "bg-emerald-500 hover:bg-emerald-600" };

// عند اكتمال الطلب: إنشاء بيعة + خصم المخزون تلقائياً
async function completeSaleAutomatically(order) {
  const branch = order.branch;
  const stockKey = branch === "saudi" ? "saudi_stock" : "turkey_stock";
  const orderRef = `طلب #${order.id?.slice(-6)}`;

  for (const item of (order.items || [])) {
    // جلب جميع المنتجات والبحث بالـ id يدوياً (filter لا يدعم البحث بالـ id)
    let product = null;
    if (item.product_id) {
      const allProducts = await db.entities.Product.list("-created_date", 500);
      product = allProducts.find((p) => p.id === item.product_id) || null;
    }

    const costPrice = product?.cost_price || 0;
    const currentStock = product?.[stockKey] || 0;
    const newStock = Math.max(0, currentStock - item.quantity);

    // إنشاء سجل بيعة
    await db.entities.Sale.create({
      product_id: item.product_id || null,
      product_name: item.product_name,
      customer_id: order.customer_id || null,
      customer_name: order.customer_name,
      branch,
      quantity: item.quantity,
      unit_price: item.unit_price,
      cost_price: costPrice,
      total_amount: item.total,
      profit: item.total - (costPrice * item.quantity),
      sale_date: new Date().toISOString().split("T")[0],
      notes: orderRef,
    });

    // تحديث المخزون وحركة المخزون
    if (product) {
      await db.entities.Product.update(product.id, { [stockKey]: newStock });
      await db.entities.StockMovement.create({
        product_id: product.id,
        product_name: item.product_name,
        branch,
        movement_type: "out",
        quantity: item.quantity,
        balance_after: newStock,
        reference: orderRef,
        notes: "بيع تلقائي عند إتمام الطلب",
      });
    }
  }
}

export default function OrderDetail({ order, open, onOpenChange, onStatusChange }) {
  if (!order) return null;

  const st = STATUS_LABELS[order.status] || STATUS_LABELS.new;
  const StatusIcon = st.icon;
  const currency = order.branch === "saudi" ? "ر.س" : "₺";
  const nextStatus = NEXT_STATUS[order.status];
  const currentStepIndex = STATUS_FLOW.findIndex((s) => s.key === order.status);

  // فتح واتساب للعميل (رقم بادئة 90)
  const openWhatsApp = () => {
    let phone = order.customer_phone?.replace(/\D/g, "") || "";
    // إزالة أي بادئة دولية وإضافة 90
    if (phone.startsWith("00")) phone = phone.slice(2);
    if (phone.startsWith("90") && phone.length > 10) {
      // already has 90
    } else if (phone.startsWith("966") && phone.length > 9) {
      phone = "90" + phone.slice(3);
    } else {
      phone = "90" + phone;
    }
    const msg = `السلام عليكم ${order.customer_name}،\nبخصوص طلبكم رقم #${order.id?.slice(-6)}\nالحالة الحالية: ${st.label}\nشكراً لثقتكم 💛`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDone = async () => {
    try {
      await completeSaleAutomatically(order);
      onStatusChange(order.id, "done");
      onOpenChange(false);
      toast.success("✅ تم إتمام الطلب وإنشاء البيعة وتحديث المخزون تلقائياً");
    } catch (e) {
      toast.error("حدث خطأ أثناء إتمام الطلب");
    }
  };

  // إذا كان الموقع مرفق
  const locationUrl = order.customer_location_url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-5 text-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs font-semibold mb-1 flex items-center gap-1.5">
                <Hash className="w-3 h-3" />
                طلب رقم {order.id?.slice(-6).toUpperCase()}
              </p>
              <h2 className="text-xl font-black">{order.customer_name}</h2>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${st.color}`}>
              <StatusIcon className="w-3.5 h-3.5" />
              {st.label}
            </div>
          </div>

          {/* Progress */}
          {order.status !== "cancelled" && (
            <>
              <div className="flex items-center gap-1">
                {STATUS_FLOW.map((s, i) => {
                  const done = i <= currentStepIndex;
                  const active = i === currentStepIndex;
                  return (
                    <React.Fragment key={s.key}>
                      <div className={`flex flex-col items-center gap-1 ${active ? "opacity-100" : done ? "opacity-70" : "opacity-30"}`}>
                        <div className={`w-2 h-2 rounded-full ${done ? "bg-amber-400" : "bg-slate-600"} ${active ? "ring-2 ring-amber-400/30" : ""}`} />
                      </div>
                      {i < STATUS_FLOW.length - 1 && (
                        <div className={`flex-1 h-px ${i < currentStepIndex ? "bg-amber-400/60" : "bg-slate-600"}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="flex justify-between mt-1">
                {STATUS_FLOW.map((s, i) => (
                  <span key={s.key} className={`text-[9px] font-semibold ${i <= currentStepIndex ? "text-amber-300" : "text-slate-600"}`}>
                    {s.label}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Customer info */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center shrink-0 text-slate-600 font-black text-base">
              {order.customer_name?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800">{order.customer_name}</p>
              <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                {order.customer_phone && (
                  <span className="text-xs text-slate-500 flex items-center gap-1" dir="ltr">
                    <Phone className="w-3 h-3" />{order.customer_phone}
                  </span>
                )}
                {order.customer_city && (
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />{order.customer_city}
                  </span>
                )}
              </div>
            </div>
            <BranchBadge branch={order.branch} size="sm" />
          </div>

          {/* Location link if available */}
          {locationUrl && (
            <a href={locationUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm font-bold hover:bg-blue-100 transition-colors">
              <MapPin className="w-4 h-4" />
              عرض موقع العميل على الخريطة
              <ExternalLink className="w-3.5 h-3.5 mr-auto" />
            </a>
          )}

          {/* Date */}
          {order.created_date && (
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calendar className="w-3.5 h-3.5" />
              {format(new Date(order.created_date), "EEEE d MMMM yyyy، HH:mm", { locale: ar })}
            </div>
          )}

          {/* Items */}
          <div>
            <p className="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              المنتجات المطلوبة ({order.items?.length || 0})
            </p>
            <div className="space-y-2">
              {order.items?.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-2.5 px-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-800">{item.product_name}</span>
                  <div className="flex items-center gap-2 text-slate-500 text-xs">
                    <span>{item.unit_price} {currency} × {item.quantity}</span>
                    <span className="font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200">{item.total} {currency}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-black text-base mt-3 px-1">
              <span className="text-slate-600">الإجمالي</span>
              <span className="text-amber-600">{order.total_amount} {currency}</span>
            </div>
          </div>

          {order.notes && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs font-bold text-amber-700 mb-1">ملاحظات</p>
              <p className="text-sm text-slate-700 whitespace-pre-line">{order.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={openWhatsApp} className="gap-2 flex-1 rounded-xl border-slate-200">
              <MessageCircle className="w-4 h-4 text-green-600" />
              <span>واتساب</span>
            </Button>
            {nextStatus && order.status !== "cancelled" && nextStatus !== "done" && (
              <Button
                onClick={() => { onStatusChange(order.id, nextStatus); onOpenChange(false); }}
                className={`gap-2 flex-1 rounded-xl text-white ${NEXT_COLOR[order.status]}`}
              >
                {NEXT_LABEL[order.status]}
              </Button>
            )}
            {order.status === "shipped" && (
              <Button
                onClick={handleDone}
                className="gap-2 flex-1 rounded-xl text-white bg-emerald-500 hover:bg-emerald-600"
              >
                تأكيد الاستلام ✓
              </Button>
            )}
            {order.status === "new" && (
              <Button
                variant="outline"
                onClick={() => { onStatusChange(order.id, "cancelled"); onOpenChange(false); }}
                className="rounded-xl border-red-200 text-red-500 hover:bg-red-50 px-3"
              >
                <XCircle className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}