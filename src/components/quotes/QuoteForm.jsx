import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Package } from "lucide-react";

function generateNumber(type) {
  const prefix = type === "quote" ? "QT" : "INV";
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = String(Math.floor(Math.random() * 900) + 100);
  return `${prefix}-${y}${m}${d}-${rand}`;
}

const today = () => new Date().toISOString().split("T")[0];
const futureDate = (days = 14) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
};

export default function QuoteForm({ open, onOpenChange, type, customers, products, onSubmit }) {
  const [form, setForm] = useState({});
  const [items, setItems] = useState([{ name: "", quantity: 1, unit_price: 0, total: 0, image_url: "" }]);
  const [selectedBranch, setSelectedBranch] = useState("saudi");

  useEffect(() => {
    if (open) {
      setSelectedBranch("saudi");
      setForm({
        type,
        number: generateNumber(type),
        branch: "saudi",
        customer_id: "",
        customer_name: "",
        customer_phone: "",
        customer_city: "",
        issue_date: today(),
        valid_until: futureDate(14),
        tax_percent: type === "invoice" ? 15 : 0,
        discount_amount: 0,
        notes: "",
      });
      setItems([{ name: "", quantity: 1, unit_price: 0, total: 0, image_url: "" }]);
    }
  }, [open, type]);

  const branchCustomers = customers.filter((c) => c.branch === selectedBranch);

  const handleBranchChange = (branch) => {
    setSelectedBranch(branch);
    setForm((f) => ({ ...f, branch, customer_id: "", customer_name: "", customer_phone: "", customer_city: "" }));
  };

  const selectCustomer = (id) => {
    if (!id || id === "__none__") {
      setForm((f) => ({ ...f, customer_id: "", customer_name: "", customer_phone: "", customer_city: "" }));
      return;
    }
    const c = customers.find((x) => x.id === id);
    if (c) setForm((f) => ({ ...f, customer_id: id, customer_name: c.name, customer_phone: c.phone || "", customer_city: c.city || "" }));
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "quantity" || field === "unit_price") {
        const qty = field === "quantity" ? Number(value) : Number(next[idx].quantity);
        const price = field === "unit_price" ? Number(value) : Number(next[idx].unit_price);
        next[idx].total = qty * price;
      }
      return next;
    });
  };

  const selectProduct = (idx, productId) => {
    if (productId === "__manual__") {
      setItems((prev) => {
        const next = [...prev];
        next[idx] = { ...next[idx], product_id: "", image_url: "" };
        return next;
      });
      return;
    }
    const p = products.find((x) => x.id === productId);
    if (!p) return;
    const price = selectedBranch === "saudi" ? (p.saudi_price || 0) : (p.turkey_price || 0);
    setItems((prev) => {
      const next = [...prev];
      next[idx] = {
        ...next[idx],
        name: p.name,
        product_id: productId,
        unit_price: price,
        total: price * Number(next[idx].quantity),
        image_url: p.image_url || "",
      };
      return next;
    });
  };

  const addItem = () => setItems((p) => [...p, { name: "", quantity: 1, unit_price: 0, total: 0, image_url: "" }]);
  const removeItem = (idx) => setItems((p) => p.filter((_, i) => i !== idx));

  const subtotal = items.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const taxAmount = (subtotal - Number(form.discount_amount || 0)) * (Number(form.tax_percent || 0) / 100);
  const total = subtotal - Number(form.discount_amount || 0) + taxAmount;

  const submit = (e) => {
    e.preventDefault();
    onSubmit({
      ...form,
      branch: selectedBranch,
      items,
      subtotal,
      tax_amount: taxAmount,
      total,
      discount_amount: Number(form.discount_amount || 0),
      tax_percent: Number(form.tax_percent || 0),
    });
  };

  const currencyLabel = selectedBranch === "saudi" ? "ر.س" : "₺";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {type === "quote" ? "🗒️ إنشاء عرض سعر" : "🧾 إنشاء فاتورة"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5">
          {/* Branch */}
          <div className="grid grid-cols-2 gap-2">
            {[{ v: "saudi", label: "🇸🇦 السعودية" }, { v: "turkey", label: "🇹🇷 تركيا" }].map((b) => (
              <button
                key={b.v}
                type="button"
                onClick={() => handleBranchChange(b.v)}
                className={`py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                  selectedBranch === b.v
                    ? b.v === "saudi" ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-rose-500 bg-rose-50 text-rose-700"
                    : "border-border hover:border-gold/40"
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>

          {/* Header info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>رقم المستند</Label>
              <Input value={form.number || ""} onChange={(e) => setForm({ ...form, number: e.target.value })} />
            </div>
            <div>
              <Label>تاريخ الإصدار</Label>
              <Input type="date" value={form.issue_date || ""} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
            </div>
            {type === "quote" && (
              <div className="col-span-2">
                <Label>صالح حتى</Label>
                <Input type="date" value={form.valid_until || ""} onChange={(e) => setForm({ ...form, valid_until: e.target.value })} />
              </div>
            )}
          </div>

          {/* Customer */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-3">
            <p className="text-sm font-bold text-foreground">بيانات العميل</p>
            <div>
              <Label className="text-xs text-muted-foreground mb-1.5 block">اختر من العملاء المسجلين</Label>
              <Select
                value={form.customer_id || "__none__"}
                onValueChange={selectCustomer}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="— اختر عميل أو أدخل يدوياً —" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— إدخال يدوي —</SelectItem>
                  {branchCustomers.length === 0 && (
                    <div className="py-2 px-3 text-xs text-muted-foreground">لا يوجد عملاء لهذا الفرع</div>
                  )}
                  {branchCustomers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` — ${c.phone}` : ""}{c.city ? ` · ${c.city}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم *</Label>
                <Input
                  required
                  value={form.customer_name || ""}
                  onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                  placeholder="اسم العميل"
                />
              </div>
              <div>
                <Label>الجوال</Label>
                <Input
                  value={form.customer_phone || ""}
                  onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
                  placeholder="05xxxxxxxx"
                  dir="ltr"
                />
              </div>
              <div className="col-span-2">
                <Label>المدينة</Label>
                <Input
                  value={form.customer_city || ""}
                  onChange={(e) => setForm({ ...form, customer_city: e.target.value })}
                  placeholder="المدينة"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold">البنود</p>
              <Button type="button" size="sm" variant="outline" onClick={addItem} className="gap-1 h-7 text-xs">
                <Plus className="w-3 h-3" /> إضافة بند
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="bg-muted/30 border border-border/60 rounded-xl p-3 space-y-2">
                  <div className="flex gap-2 items-center">
                    {/* Product thumbnail */}
                    <div className="w-10 h-10 rounded-lg bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image_url
                        ? <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                        : <Package className="w-4 h-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1">
                      <Select
                        value={item.product_id || "__manual__"}
                        onValueChange={(v) => selectProduct(idx, v)}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="اختر منتج من المخزون" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__manual__">✏️ كتابة يدوية</SelectItem>
                          {products.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <Input
                    placeholder="وصف البند *"
                    value={item.name}
                    required
                    onChange={(e) => updateItem(idx, "name", e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">الكمية</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">السعر ({currencyLabel})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">الإجمالي</Label>
                      <div className="h-8 bg-gold/10 border border-gold/20 rounded-md flex items-center px-3 text-sm font-bold text-gold">
                        {Number(item.total || 0).toFixed(2)} {currencyLabel}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="bg-muted/40 rounded-xl p-4 space-y-2.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">خصم ({currencyLabel})</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.discount_amount || 0}
                  onChange={(e) => setForm({ ...form, discount_amount: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">ضريبة %</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={form.tax_percent || 0}
                  onChange={(e) => setForm({ ...form, tax_percent: e.target.value })}
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>المجموع الفرعي</span>
                <span className="font-medium">{subtotal.toFixed(2)} {currencyLabel}</span>
              </div>
              {Number(form.discount_amount) > 0 && (
                <div className="flex justify-between text-sm text-destructive">
                  <span>خصم</span>
                  <span>− {Number(form.discount_amount).toFixed(2)} {currencyLabel}</span>
                </div>
              )}
              {Number(form.tax_percent) > 0 && (
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>ضريبة {form.tax_percent}%</span>
                  <span>+ {taxAmount.toFixed(2)} {currencyLabel}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-base pt-2 border-t border-border">
                <span>الإجمالي النهائي</span>
                <span className="text-gold text-lg">{total.toFixed(2)} {currencyLabel}</span>
              </div>
            </div>
          </div>

          <div>
            <Label>ملاحظات</Label>
            <Textarea
              value={form.notes || ""}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={2}
              placeholder="ملاحظات إضافية..."
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" className="bg-gold hover:bg-gold-dark text-white">
              {type === "quote" ? "إنشاء العرض" : "إنشاء الفاتورة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}