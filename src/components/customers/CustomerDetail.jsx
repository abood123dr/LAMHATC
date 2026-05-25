import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import BranchBadge from "../shared/BranchBadge";
import { Phone, MapPin, Package } from "lucide-react";

export default function CustomerDetail({ customer, sales = [], open, onOpenChange }) {
  if (!customer) return null;
  const customerSales = sales.filter((s) => s.customer_id === customer.id);
  const allImages = customerSales.flatMap((s) =>
    (s.installation_images || []).map((url) => ({ url, product: s.product_name, date: s.sale_date }))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center text-white font-bold">
              {customer.name?.charAt(0)}
            </div>
            <div>
              <div>{customer.name}</div>
              <BranchBadge branch={customer.branch} size="sm" />
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {customer.phone && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <Phone className="w-3 h-3" /> الجوال
                </div>
                <p className="font-semibold" dir="ltr">{customer.phone}</p>
              </div>
            )}
            {customer.city && (
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-1">
                  <MapPin className="w-3 h-3" /> المدينة
                </div>
                <p className="font-semibold">{customer.city}</p>
              </div>
            )}
          </div>

          {customer.notes && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">ملاحظات</p>
              <p className="text-sm">{customer.notes}</p>
            </div>
          )}

          {/* Orders */}
          <div>
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-gold" />
              الطلبات ({customerSales.length})
            </h3>
            {customerSales.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">
                لا توجد طلبات لهذا العميل
              </p>
            ) : (
              <div className="space-y-2">
                {customerSales.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{s.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.quantity} × {formatCurrency(s.unit_price, s.branch)}
                        {s.sale_date && ` · ${format(new Date(s.sale_date), "d MMM yyyy", { locale: ar })}`}
                      </p>
                    </div>
                    <p className="font-bold text-gold">
                      {formatCurrency(s.total_amount, s.branch)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          {allImages.length > 0 && (
            <div>
              <h3 className="font-bold mb-3">صور التركيب ({allImages.length})</h3>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {allImages.map((img, i) => (
                  <a
                    key={i}
                    href={img.url}
                    target="_blank"
                    rel="noreferrer"
                    className="relative aspect-square rounded-lg overflow-hidden border border-border group"
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <p className="text-[10px] text-white truncate">{img.product}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}