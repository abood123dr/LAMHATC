import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Sale, Product, Customer, StockMovement } from "@/api/base44Client";
import { Plus, ShoppingBag, Trash2, Images } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import BranchBadge from "@/components/shared/BranchBadge";
import SaleForm from "@/components/sales/SaleForm";
import SalesStats from "@/components/sales/SalesStats";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Sales() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [branch, setBranch] = useState("all");
  const [deleting, setDeleting] = useState(null);

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: () => Sale.list('-sale_date', 500),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => Product.list('-created_at', 500),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => Customer.list('-created_at', 500),
  });

  const createMut = useMutation({
    mutationFn: async (data) => {
      const sale = await Sale.create(data);
      const product = products.find((p) => p.id === data.product_id);
      if (product) {
        const key = data.branch === "saudi" ? "saudi_stock" : "turkey_stock";
        const newStock = Math.max(0, (product[key] || 0) - (data.quantity || 1));
        await Product.update(product.id, { [key]: newStock });
        await StockMovement.create({
          product_id: product.id,
          product_name: product.name,
          branch: data.branch,
          movement_type: "out",
          quantity: data.quantity || 1,
          balance_after: newStock,
          reference: sale.id,
          notes: `بيع${data.customer_name ? " لـ " + data.customer_name : ""}`,
        });
      }
      return sale;
    },
    onSuccess: (sale) => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      setFormOpen(false);
      const motivations = ["🔥 رائع! بيعة جديدة تُضاف لرصيدك!", "🎯 أحسنت! استمر في هذا الإيقاع المذهل!", "⭐ بيعة ناجحة! أنت على الطريق الصحيح!", "🚀 ممتاز! كل بيعة تقربك من هدفك!", "💪 عظيم! مبيعاتك تتصاعد!"];
      toast.success(motivations[Math.floor(Math.random() * motivations.length)], {
        description: `${sale.product_name} — ${sale.total_amount?.toLocaleString("ar-SA")} ${sale.branch === "saudi" ? "ر.س" : "₺"}`,
        duration: 4000,
      });
    },
    onError: (e) => toast.error("خطأ: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (sale) => {
      await Sale.delete(sale.id);
      const product = products.find((p) => p.id === sale.product_id);
      if (product) {
        const key = sale.branch === "saudi" ? "saudi_stock" : "turkey_stock";
        const newStock = (product[key] || 0) + (sale.quantity || 1);
        await Product.update(product.id, { [key]: newStock });
        await StockMovement.create({
          product_id: product.id,
          product_name: product.name,
          branch: sale.branch,
          movement_type: "in",
          quantity: sale.quantity || 1,
          balance_after: newStock,
          reference: sale.id,
          notes: "إلغاء بيع — إعادة الكمية للمخزون",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["movements"] });
      setDeleting(null);
      toast.success("تم حذف عملية البيع");
    },
    onError: (e) => toast.error("خطأ: " + e.message),
  });

  const filtered = branch === "all" ? sales : sales.filter((s) => s.branch === branch);

  return (
    <div>
      <PageHeader
        title="المبيعات"
        subtitle="سجل كامل لعمليات البيع مع حساب الأرباح تلقائيًا"
        action={<Button onClick={() => setFormOpen(true)} className="hidden md:flex bg-gold hover:bg-gold-dark text-white gap-2"><Plus className="w-4 h-4" /> بيع جديد</Button>}
      />
      <button onClick={() => setFormOpen(true)} className="md:hidden fixed bottom-20 left-4 z-40 w-14 h-14 bg-gold hover:bg-gold-dark text-white rounded-full shadow-xl flex items-center justify-center active:scale-95 transition-all">
        <Plus className="w-6 h-6" />
      </button>
      <SalesStats sales={sales} branch={branch} />
      <div className="bg-card border border-border rounded-2xl shadow-luxe overflow-hidden">
        <div className="p-4 md:p-5 border-b border-border">
          <Tabs value={branch} onValueChange={setBranch}>
            <TabsList>
              <TabsTrigger value="all">الكل</TabsTrigger>
              <TabsTrigger value="saudi">🇸🇦 السعودية</TabsTrigger>
              <TabsTrigger value="turkey">🇹🇷 تركيا</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        {filtered.length === 0 ? (
          <EmptyState icon={ShoppingBag} title="لا توجد مبيعات" description="ابدأ بتسجيل أول عملية بيع" action={<Button onClick={() => setFormOpen(true)} className="bg-gold hover:bg-gold-dark text-white gap-2"><Plus className="w-4 h-4" /> تسجيل بيع</Button>} />
        ) : (
          <>
            <div className="md:hidden divide-y divide-border">
              {filtered.map((s) => (
                <div key={s.id} className="px-4 py-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-foreground truncate">{s.product_name}</p>
                      {s.installation_images?.length > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-gold bg-accent px-1.5 py-0.5 rounded-full shrink-0"><Images className="w-3 h-3" />{s.installation_images.length}</span>}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <BranchBadge branch={s.branch} size="sm" />
                      {s.customer_name && <span className="text-xs text-muted-foreground">· {s.customer_name}</span>}
                      {s.sale_date && <span className="text-xs text-muted-foreground">· {format(new Date(s.sale_date), "d MMM", { locale: ar })}</span>}
                    </div>
                  </div>
                  <div className="text-left shrink-0 ml-2">
                    <p className="font-bold text-gold text-sm">{formatCurrency(s.total_amount, s.branch)}</p>
                    <p className="text-[11px] text-emerald-600 mt-0.5">+{formatCurrency(s.profit, s.branch)}</p>
                  </div>
                  <button onClick={() => setDeleting(s)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-xs text-muted-foreground">
                    <th className="text-right px-5 py-3 font-medium">المنتج</th>
                    <th className="text-right px-3 py-3 font-medium">الفرع</th>
                    <th className="text-right px-3 py-3 font-medium">العميل</th>
                    <th className="text-right px-3 py-3 font-medium">الكمية</th>
                    <th className="text-right px-3 py-3 font-medium">سعر القطعة</th>
                    <th className="text-right px-3 py-3 font-medium">الإجمالي</th>
                    <th className="text-right px-3 py-3 font-medium">الربح</th>
                    <th className="text-right px-3 py-3 font-medium">التاريخ</th>
                    <th className="text-right px-3 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-accent/30 transition-colors text-sm">
                      <td className="px-5 py-3 font-medium"><div className="flex items-center gap-2">{s.product_name}{s.installation_images?.length > 0 && <span className="inline-flex items-center gap-1 text-[10px] text-gold bg-accent px-1.5 py-0.5 rounded-full"><Images className="w-3 h-3" />{s.installation_images.length}</span>}</div></td>
                      <td className="px-3 py-3"><BranchBadge branch={s.branch} size="sm" /></td>
                      <td className="px-3 py-3 text-muted-foreground">{s.customer_name || "—"}</td>
                      <td className="px-3 py-3">{s.quantity}</td>
                      <td className="px-3 py-3">{formatCurrency(s.unit_price, s.branch)}</td>
                      <td className="px-3 py-3 font-bold">{formatCurrency(s.total_amount, s.branch)}</td>
                      <td className="px-3 py-3 text-emerald-600 font-semibold">{formatCurrency(s.profit, s.branch)}</td>
                      <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">{s.sale_date && format(new Date(s.sale_date), "d MMM yyyy", { locale: ar })}</td>
                      <td className="px-3 py-3"><button onClick={() => setDeleting(s)} className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
      <SaleForm open={formOpen} onOpenChange={setFormOpen} products={products} customers={customers} onSubmit={(data) => createMut.mutate(data)} />
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>حذف عملية البيع؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف العملية وإعادة الكمية إلى المخزون.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => deleting && deleteMut.mutate(deleting)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}