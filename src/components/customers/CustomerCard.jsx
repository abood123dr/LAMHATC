import React from "react";
import { Phone, MapPin, Pencil, Trash2, ShoppingBag, Images, MessageCircle } from "lucide-react";
import BranchBadge from "../shared/BranchBadge";
import { formatCurrency } from "@/lib/utils";

export default function CustomerCard({ customer, sales = [], onEdit, onDelete, onView, onReminder }) {
  const customerSales = sales.filter((s) => s.customer_id === customer.id);
  const total = customerSales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const imageCount = customerSales.reduce((sum, s) => sum + (s.installation_images?.length || 0), 0);

  return (
    <div
      onClick={() => onView?.(customer)}
      className="group bg-card border border-border rounded-2xl p-5 shadow-luxe hover:shadow-luxe-lg transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center text-white font-bold text-lg shrink-0">
            {customer.name?.charAt(0) || "؟"}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-foreground truncate">{customer.name}</h3>
            <BranchBadge branch={customer.branch} size="sm" />
          </div>
        </div>
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onReminder?.(customer); }}
            className="w-8 h-8 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 flex items-center justify-center text-emerald-500"
            title="إرسال تذكير"
          >
            <MessageCircle className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(customer); }}
            className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(customer); }}
            className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1.5 text-sm text-muted-foreground mb-4">
        {customer.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5" />
            <span dir="ltr">{customer.phone}</span>
          </div>
        )}
        {customer.city && (
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            <span>{customer.city}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border">
        <div>
          <p className="text-[10px] text-muted-foreground">طلبات</p>
          <p className="text-sm font-bold flex items-center gap-1">
            <ShoppingBag className="w-3 h-3 text-gold" />
            {customerSales.length}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">الإجمالي</p>
          <p className="text-sm font-bold text-gold">
            {formatCurrency(total, customer.branch)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground">صور</p>
          <p className="text-sm font-bold flex items-center gap-1">
            <Images className="w-3 h-3 text-gold" />
            {imageCount}
          </p>
        </div>
      </div>
    </div>
  );
}