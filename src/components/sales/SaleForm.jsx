const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUploader from "@/components/shared/ImageUploader";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, UserPlus, X } from "lucide-react";

export default function SaleForm({ open, onOpenChange, products = [], customers = [], onSubmit }) {
  const today = new Date().toISOString().split("T")[0];

  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", city: "" });
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [localCustomers, setLocalCustomers] = useState([]);

  useEffect(() => {
    setLocalCustomers(customers);
  }, [customers]);

  const allCustomers = localCustomers;

  const [form, setForm] = useState({
    branch: "saudi",
    product_id: "",
    customer_id: "",
    quantity: 1,
    unit_price: 0,
    sale_date: today,
    installation_images: [],
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        branch: "saudi",
        product_id: "",
        customer_id: "",
        quantity: 1,
        unit_price: 0,
        sale_date: today,
        installation_images: [],
        notes: "",
      });
      setShowNewCustomer(false);
      setNewCustomer({ name: "", phone: "", city: "" });
    }
    // eslint-disable-next-line
  }, [open]);

  const selectedProduct = products.find((p) => p.id === form.product_id);
  const selectedCustomer = allCustomers.find((c) => c.id === form.customer_id);

  // Filter customers by branch
  const branchCustomers = allCustomers.filter((c) => c.branch === form.branch);

  const handleAddNewCustomer = async () => {
    if (!newCustomer.name.trim()) return;
    setSavingCustomer(true);
    const created = await db.entities.Customer.create({
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
      city: newCustomer.city.trim(),
      branch: form.branch,
    });
    setLocalCustomers((prev) => [...prev, created]);
    setForm((f) => ({ ...f, customer_id: created.id }));
    setShowNewCustomer(false);
    setNewCustomer({ name: "", phone: "", city: "" });
    setSavingCustomer(false);
  };

  // Auto-fill price when product or branch changes
  useEffect(() => {
    if (selectedProduct) {
      const price = form.branch === "saudi" ? selectedProduct.saudi_price : selectedProduct.turkey_price;
      setForm((f) => ({ ...f, unit_price: price || 0 }));
    }
    // eslint-disable-next-line
  }, [form.product_id, form.branch]);

  const stockKey = form.branch === "saudi" ? "saudi_stock" : "turkey_stock";
  const availableStock = selectedProduct?.[stockKey] || 0;
  const quantity = Number(form.quantity) || 0;
  const unitPrice = Number(form.unit_price) || 0;
  const total = quantity * unitPrice;
  const cost = (selectedProduct?.cost_price || 0) * quantity;
  const profit = total - cost;

  const outOfStock = selectedProduct && quantity > availableStock;
  const branchMismatch = selectedCustomer && selectedCustomer.branch !== form.branch;

  const submit = (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (outOfStock) return;

    onSubmit({
      ...form,
      quantity,
      unit_price: unitPrice,
      product_name: selectedProduct.name,
      customer_name: selectedCustomer?.name || "",
      cost_price: selectedProduct.cost_price || 0,
      total_amount: total,
      profit,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">تسجيل عملية بيع جديدة</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          {/* Branch */}
          <div>
            <Label>الفرع *</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {[
                { v: "saudi", label: "🇸🇦 السعودية", cls: "emerald" },
                { v: "turkey", label: "🇹🇷 تركيا", cls: "rose" },
              ].map((b) => (
                <button
                  key={b.v}
                  type="button"
                  onClick={() => setForm({ ...form, branch: b.v, product_id: "", customer_id: "" })}
                  className={`px-4 py-3 rounded-xl border-2 font-semibold transition-all ${
                    form.branch === b.v
                      ? b.cls === "emerald"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-border bg-card hover:border-gold/50"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <Label>المنتج *</Label>
            <Select
              value={form.product_id}
              onValueChange={(v) => setForm({ ...form, product_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="اختر منتج" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — متبقي {p[stockKey] || 0}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct && (
              <p className="text-xs text-muted-foreground mt-1">
                المخزون المتاح: <span className="font-bold">{availableStock}</span> قطعة
              </p>
            )}
          </div>

          {/* Customer */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Label>العميل (اختياري)</Label>
              <button
                type="button"
                onClick={() => setShowNewCustomer(!showNewCustomer)}
                className="flex items-center gap-1 text-xs text-gold hover:text-gold-dark font-medium transition-colors"
              >
                {showNewCustomer ? <X className="w-3.5 h-3.5" /> : <UserPlus className="w-3.5 h-3.5" />}
                {showNewCustomer ? "إلغاء" : "إضافة عميل جديد"}
              </button>
            </div>

            {showNewCustomer ? (
              <div className="border border-gold/30 bg-accent/30 rounded-xl p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">الاسم *</Label>
                    <Input
                      placeholder="اسم العميل"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">رقم الجوال</Label>
                    <Input
                      placeholder="05xxxxxxxx"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">المدينة</Label>
                  <Input
                    placeholder="المدينة"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer({ ...newCustomer, city: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddNewCustomer}
                  disabled={savingCustomer || !newCustomer.name.trim()}
                  className="bg-gold hover:bg-gold-dark text-white w-full"
                >
                  {savingCustomer ? "جاري الحفظ..." : "حفظ وربط بالبيعة"}
                </Button>
              </div>
            ) : (
              <Select
                value={form.customer_id}
                onValueChange={(v) => setForm({ ...form, customer_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر عميل موجود" />
                </SelectTrigger>
                <SelectContent>
                  {branchCustomers.length === 0 ? (
                    <div className="py-2 px-3 text-sm text-muted-foreground">
                      لا يوجد عملاء لهذا الفرع
                    </div>
                  ) : (
                    branchCustomers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.phone && `— ${c.phone}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>الكمية *</Label>
              <Input
                type="number"
                min="1"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div>
              <Label>سعر القطعة *</Label>
              <Input
                type="number"
                step="0.01"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
              />
            </div>
            <div>
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={form.sale_date}
                onChange={(e) => setForm({ ...form, sale_date: e.target.value })}
              />
            </div>
          </div>

          {/* Calculation preview */}
          {selectedProduct && (
            <div className="bg-accent/50 border border-gold/20 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الإجمالي:</span>
                <span className="font-bold text-lg text-foreground">
                  {formatCurrency(total, form.branch)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">الربح المتوقع:</span>
                <span className="font-bold text-gold">
                  {formatCurrency(profit, form.branch)}
                </span>
              </div>
            </div>
          )}

          {outOfStock && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>الكمية المطلوبة أكبر من المخزون المتاح ({availableStock} قطعة)</span>
            </div>
          )}

          {branchMismatch && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>العميل المختار ينتمي إلى فرع آخر</span>
            </div>
          )}

          <div>
            <Label>صور التركيب (اختياري)</Label>
            <ImageUploader
              value={form.installation_images}
              onChange={(v) => setForm({ ...form, installation_images: v })}
            />
          </div>

          <div>
            <Label>ملاحظات</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={!selectedProduct || outOfStock}
              className="bg-gold hover:bg-gold-dark text-white"
            >
              تسجيل البيع
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
