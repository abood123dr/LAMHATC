import React, { useMemo } from "react";
import { Sparkles, TrendingUp, Star, Zap, Award, Flame } from "lucide-react";

const QUOTES = [
  { text: "كل بيعة هي خطوة نحو القمة — استمر!", icon: TrendingUp, from: "#f59e0b", to: "#ea580c" },
  { text: "النجاح ليس صدفة، بل هو نتيجة عملك المستمر.", icon: Star, from: "#d97706", to: "#b45309" },
  { text: "أفضل استثمار هو الوقت الذي تضعه في عملك.", icon: Zap, from: "#7c3aed", to: "#4338ca" },
  { text: "كل عميل راضٍ هو إعلان مجاني عن تميزك.", icon: Award, from: "#059669", to: "#0d9488" },
  { text: "الفرق بين العادي والاستثنائي هو ذلك الجهد الإضافي.", icon: Flame, from: "#e11d48", to: "#db2777" },
  { text: "ابدأ يومك بنية النجاح وستجد الفرص تفتح أبوابها.", icon: Sparkles, from: "#0284c7", to: "#2563eb" },
  { text: "لمحاتك تبني المستقبل بيعة تلو الأخرى.", icon: Star, from: "#d97706", to: "#ca8a04" },
];

export default function DashBanner() {
  const quote = useMemo(() => {
    const day = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
    return QUOTES[day % QUOTES.length];
  }, []);

  const Icon = quote.icon;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-4 md:p-5"
      style={{ background: `linear-gradient(135deg, ${quote.from}, ${quote.to})` }}
    >
      <div className="absolute -top-8 -left-8 w-32 h-32 rounded-full bg-white/10" />
      <div className="absolute -bottom-5 left-16 w-20 h-20 rounded-full bg-white/10" />
      <div className="relative flex items-center gap-3">
        <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-[10px] text-white/70 uppercase tracking-widest mb-0.5 font-medium">شعار اليوم</p>
          <p className="text-white font-bold text-sm md:text-base leading-snug">{quote.text}</p>
        </div>
      </div>
    </div>
  );
}