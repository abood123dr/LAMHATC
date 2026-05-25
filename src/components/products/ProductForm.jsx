const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import { Upload, Loader2 } from "lucide-react";

export default function ProductForm({ open, onOpenChange, product, onSubmit }) {
  const [form, setForm] = useState(
    product || {
      name: "",
      code: "",
      description: "",
      image_url: "",
      saudi_stock: 0,
      turkey_stock: 0,
      saudi_price: 0,
      turkey_price: 0,
      cost_price: 0,
      category: "",
    }
  );
  const [uploading, setUploading] = useState(false);

  React.useEffect(() => {
    setForm(
      product || {
        name: "",
        code: "",
        description: "",
        image_url: "",
        saudi_stock: 0,
        turkey_stock: 0,
        saudi_price: 0,
        turkey_price: 0,
        cost_price: 0,
        category: "",
      }
    );
  }, [product, open]);

  const handleImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    setForm((f) => ({ ...f, image_url: file_url }));
    setUploading(false);
  };

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      saudi_stock: Number(form.saudi_stock) || 0,
      turkey_stock: Number(form.turkey_stock) || 0,
      saudi_price: Number(form.saudi_price) || 0,
      turkey_price: Number(form.turkey_price) || 0,
      cost_price: Number(form.cost_price) || 0,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {product ? "تعديل المنتج" : "إضافة منتج جديد"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          {/* Image */}
          <div>
            <Label className="mb-2 block">صورة المنتج</Label>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border overflow-hidden bg-muted flex items-center justify-center shrink-0">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="w-full h-full object-cover" />
                ) : uploading ? (
                  <Loader2 className="w-6 h-6 text-gold animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border cursor-pointer hover:bg-accent text-sm">
                  <Upload className="w-4 h-4" />
                  اختر صورة
                  <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
                </label>
                <p className="text-xs text-muted-foreground mt-1">اختياري</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>اسم المنتج *</Label>
              <Input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="مثال: ستاند ذهبي"
              />
            </div>
            <div>
              <Label>الكود</Label>
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="SKU-001"
              />
            </div>
            <div>
              <Label>الفئة</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="ستاندات"
              />
            </div>
            <div>
              <Label>سعر التكلفة</Label>
              <Input
                type="number"
                step="0.01"
                value={form.cost_price}
                onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>الوصف</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف المنتج..."
              rows={2}
            />
          </div>

          {/* Saudi branch */}
          <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-4">
            <h4 className="font-bold text-emerald-700 mb-3 flex items-center gap-2">
              🇸🇦 فرع السعودية
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الكمية في المخزون</Label>
                <Input
                  type="number"
                  value={form.saudi_stock}
                  onChange={(e) => setForm({ ...form, saudi_stock: e.target.value })}
                />
              </div>
              <div>
                <Label>سعر البيع (ريال)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.saudi_price}
                  onChange={(e) => setForm({ ...form, saudi_price: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Turkey branch */}
          <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-4">
            <h4 className="font-bold text-rose-700 mb-3 flex items-center gap-2">
              🇹🇷 فرع تركيا
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الكمية في المخزون</Label>
                <Input
                  type="number"
                  value={form.turkey_stock}
                  onChange={(e) => setForm({ ...form, turkey_stock: e.target.value })}
                />
              </div>
              <div>
                <Label>سعر البيع (ليرة)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.turkey_price}
                  onChange={(e) => setForm({ ...form, turkey_price: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" className="bg-gold hover:bg-gold-dark text-white">
              {product ? "حفظ التعديلات" : "إضافة المنتج"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}