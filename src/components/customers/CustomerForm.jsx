import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export default function CustomerForm({ open, onOpenChange, customer, onSubmit }) {
  const [form, setForm] = useState(customer || {
    name: "", phone: "", city: "", branch: "saudi", notes: ""
  });

  useEffect(() => {
    setForm(customer || { name: "", phone: "", city: "", branch: "saudi", notes: "" });
  }, [customer, open]);

  const submit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{customer ? "تعديل العميل" : "عميل جديد"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>الاسم *</Label>
            <Input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="اسم العميل"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>رقم الجوال</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="05xxxxxxxx"
                dir="ltr"
              />
            </div>
            <div>
              <Label>المدينة</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="الرياض"
              />
            </div>
          </div>
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
                  onClick={() => setForm({ ...form, branch: b.v })}
                  className={`px-4 py-2.5 rounded-xl border-2 font-semibold transition-all ${
                    form.branch === b.v
                      ? b.cls === "emerald"
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                        : "border-rose-500 bg-rose-50 text-rose-700"
                      : "border-border hover:border-gold/50"
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" className="bg-gold hover:bg-gold-dark text-white">
              {customer ? "حفظ" : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}