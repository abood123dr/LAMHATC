import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

const TEMPLATES = [
  {
    label: "متابعة عامة",
    icon: "👋",
    text: (name) =>
      `السلام عليكم ${name}،\n\nنتمنى أن تكونوا بخير 😊\nنود الاطمئنان عليكم وعلى تجربتكم مع منتجاتنا.\nهل هناك أي شيء يمكننا مساعدتكم به؟\n\nلمحاتك — خدمتكم دائماً 🌟`,
  },
  {
    label: "عروض وخصومات",
    icon: "🎁",
    text: (name) =>
      `السلام عليكم ${name}،\n\nلدينا عروض حصرية لعملائنا المميزين!\n✨ خصومات على أحدث المنتجات\n📦 توفر مخزون جديد\n\nلا تفوتوا الفرصة، تواصلوا معنا الآن!\n\nلمحاتك 💛`,
  },
  {
    label: "طلب تقييم",
    icon: "⭐",
    text: (name) =>
      `السلام عليكم ${name}،\n\nشكراً جزيلاً لثقتكم بنا 🙏\nنتمنى أن تكونوا راضين عن تجربتكم.\n\nهل يمكنكم مشاركتنا رأيكم؟ رأيكم يهمنا كثيراً ويساعدنا على التحسين المستمر.\n\nلمحاتك — نسعى دائماً لخدمتكم بأفضل صورة 💛`,
  },
  {
    label: "صيانة / متابعة تركيب",
    icon: "🔧",
    text: (name) =>
      `السلام عليكم ${name}،\n\nنتمنى أن يكون المنتج في أفضل حال 😊\nنود التذكير بأهمية الصيانة الدورية للحفاظ على جودة المنتج.\n\nهل تحتاجون لأي متابعة أو خدمة؟ نحن هنا!\n\nلمحاتك 💛`,
  },
];

export default function ReminderDialog({ open, onOpenChange, customer }) {
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && customer) {
      setMessage(TEMPLATES[0].text(customer.name));
      setSelected(0);
      setCopied(false);
    }
  }, [open, customer]);

  const selectTemplate = (idx) => {
    setSelected(idx);
    setMessage(TEMPLATES[idx].text(customer?.name || ""));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    toast.success("تم نسخ الرسالة!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!customer?.phone) {
      toast.error("لا يوجد رقم جوال لهذا العميل");
      return;
    }
    const phone = customer.phone.replace(/\D/g, "");
    const fullPhone = phone.startsWith("0") ? "966" + phone.slice(1) : phone;
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-gold" />
            إرسال تذكير لـ {customer.name}
          </DialogTitle>
        </DialogHeader>

        {/* Templates */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-medium">اختر قالب الرسالة</p>
          <div className="grid grid-cols-2 gap-2">
            {TEMPLATES.map((t, i) => (
              <button
                key={i}
                onClick={() => selectTemplate(i)}
                className={`text-right px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  selected === i
                    ? "border-gold bg-gold/10 text-gold"
                    : "border-border hover:border-gold/30 text-foreground"
                }`}
              >
                <span className="ml-1">{t.icon}</span> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Message editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-medium">نص الرسالة (قابل للتعديل)</p>
            <span className="text-xs text-muted-foreground">{message.length} حرف</span>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={7}
            className="text-sm leading-relaxed resize-none"
            dir="rtl"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            onClick={handleCopy}
            className="gap-2 flex-1"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? "تم النسخ!" : "نسخ الرسالة"}
          </Button>
          <Button
            onClick={handleWhatsApp}
            className="gap-2 flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
            disabled={!customer.phone}
          >
            <MessageCircle className="w-4 h-4" />
            فتح واتساب
          </Button>
        </div>

        {!customer.phone && (
          <p className="text-xs text-destructive text-center">
            ⚠️ لا يوجد رقم جوال — أضف رقم الجوال أولاً لإرسال عبر واتساب
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}