import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DiscountCode } from "@/api/base44Client";
import { Tag, Plus, Trash2, CheckCircle2, XCircle, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const EMPTY_FORM = { code: "", discount_type: "percentage", discount_value: "", branch: "both", is_active: true, max_uses: "", expiry_date: "" };
const BRANCH_LABELS = { both: "الكل", saudi: "🇸🇦 السعودية", turkey: "🇹🇷 تركيا" };

export default function DiscountCodes() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: codes = [] } = useQuery({
    queryKey: ["discount-codes"],
    queryFn: () => DiscountCode.list('-created_at', 200),
  });

  const saveMut = useMutation({
    mutationFn: (data) => editing ? DiscountCode.update(editing.id, data) : DiscountCode.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["discount-codes"] });
      setShowForm(false); setEditing(null); setForm(EMPTY_FORM);
      toast.success(editing ? "تم تحديث الكود" : "تم إنشاء الكود");
    },
    onError: (e) => toast.error("خطأ: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => DiscountCode.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["discount-codes"] }); toast.success("تم حذف الكود"); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, is_active }) => DiscountCode.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["discount-codes"] }),
  });

  const handleSave = () => {
    if (!form.code.trim() || !form.discount_value) { toast.error("يرجى تعبئة الكود والقيمة"); return; }
    saveMut.mutate({ ...form, code: form.code.trim().toUpperCase(), discount_value: Number(form.discount_value), max_uses: form.max_uses ? Number(form.max_uses) : null });
  };

  const startEdit = (code) => {
    setEditing(code);
    setForm({ ...code, max_uses: code.max_uses || "", expiry_date: code.expiry_date || "" });
    setShowForm(true);
  };

  return (
    <div>
      <PageHeader
        title="أكواد الخصم"
        subtitle="إدارة أكواد الخصم للعملاء"
        action={<Button onClick={() => { setShowForm(true); setEditing(null); setForm(EMPTY_FORM); }} className="gap-2"><Plus className="w-4 h-4" /> إنشاء كود جديد</Button>}
      />
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 shadow-luxe">
          <h3 className="font-bold text-foreground mb-4">{editing ? "تعديل الكود" : "كود خصم جديد"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">الكود *</label><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="مثال: SAVE20" dir="ltr" className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring font-mono" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">نوع الخصم *</label><select value={form.discount_type} onChange={e => setForm({ ...form, discount_type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"><option value="percentage">نسبة مئوية (%)</option><option value="fixed">مبلغ ثابت</option></select></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">قيمة الخصم *</label><input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === "percentage" ? "مثال: 20" : "المبلغ"} className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">الفرع</label><select value={form.branch} onChange={e => setForm({ ...form, branch: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"><option value="both">الكل</option><option value="saudi">السعودية</option><option value="turkey">تركيا</option></select></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">الحد الأقصى للاستخدام</label><input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="اتركه فارغاً = غير محدود" className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
            <div><label className="text-xs font-semibold text-muted-foreground mb-1 block">تاريخ الانتهاء</label><input type="date" value={form.expiry_date} onChange={e => setForm({ ...form, expiry_date: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" /></div>
          </div>
          <div className="flex items-center gap-2 mt-4"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 rounded" /><span className="text-sm font-semibold">مفعّل</span></label></div>
          <div className="flex gap-2 mt-4">
            <Button onClick={handleSave} disabled={saveMut.isPending} className="gap-2">{saveMut.isPending ? "جاري الحفظ..." : editing ? "تحديث" : "إنشاء"}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditing(null); setForm(EMPTY_FORM); }}>إلغاء</Button>
          </div>
        </div>
      )}
      <div className="bg-card border border-border rounded-2xl shadow-luxe overflow-hidden">
        {codes.length === 0 ? (
          <EmptyState icon={Tag} title="لا توجد أكواد خصم" description="أنشئ كوداً لتقديم خصومات للعملاء" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-xs text-muted-foreground">
                  <th className="text-right px-5 py-3 font-medium">الكود</th>
                  <th className="text-right px-3 py-3 font-medium">الخصم</th>
                  <th className="text-right px-3 py-3 font-medium">الفرع</th>
                  <th className="text-right px-3 py-3 font-medium">الاستخدام</th>
                  <th className="text-right px-3 py-3 font-medium">الانتهاء</th>
                  <th className="text-right px-3 py-3 font-medium">الحالة</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {codes.map(code => {
                  const expired = code.expiry_date && new Date(code.expiry_date) < new Date();
                  const maxed = code.max_uses && code.used_count >= code.max_uses;
                  const effective = code.is_active && !expired && !maxed;
                  return (
                    <tr key={code.id} className="hover:bg-accent/30 transition-colors text-sm">
                      <td className="px-5 py-3"><span className="font-black text-foreground font-mono tracking-wider">{code.code}</span></td>
                      <td className="px-3 py-3 font-bold text-amber-600">{code.discount_type === "percentage" ? `${code.discount_value}%` : `${code.discount_value}`}</td>
                      <td className="px-3 py-3 text-muted-foreground">{BRANCH_LABELS[code.branch]}</td>
                      <td className="px-3 py-3 text-muted-foreground">{code.used_count || 0}{code.max_uses ? ` / ${code.max_uses}` : ""}</td>
                      <td className="px-3 py-3 text-muted-foreground text-xs">{code.expiry_date ? format(new Date(code.expiry_date), "d MMM yyyy", { locale: ar }) : "—"}</td>
                      <td className="px-3 py-3"><button onClick={() => toggleMut.mutate({ id: code.id, is_active: !code.is_active })} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80 ${effective ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{effective ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}{effective ? "مفعّل" : expired ? "منتهي" : maxed ? "نفد" : "معطّل"}</button></td>
                      <td className="px-3 py-3"><div className="flex items-center gap-1"><button onClick={() => startEdit(code)} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={() => deleteMut.mutate(code.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"><Trash2 className="w-3.5 h-3.5 text-red-400" /></button></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}