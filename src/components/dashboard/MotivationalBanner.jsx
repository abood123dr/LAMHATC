import React, { useMemo } from "react";
import { Sparkles, TrendingUp, Star, Zap, Award, Flame } from "lucide-react";

const QUOTES = [
  { text: "كل بيعة هي خطوة نحو القمة — استمر!", icon: TrendingUp, color: "from-amber-400 to-orange-500" },
  { text: "النجاح ليس صدفة، بل هو نتيجة عملك المستمر اليوم.", icon: Star, color: "from-gold to-amber-600" },
  { text: "أفضل استثمار هو الوقت الذي تضعه في عملك اليوم.", icon: Zap, color: "from-purple-500 to-indigo-600" },
  { text: "كل عميل راضٍ هو إعلان مجاني عن تميزك.", icon: Award, color: "from-emerald-500 to-teal-600" },
  { text: "الفرق بين العادي والاستثنائي هو ذلك الجهد الإضافي.", icon: Flame, color: "from-rose-500 to-pink-600" },
  { text: "ابدأ يومك بنية النجاح وستجد الفرص تفتح أبوابها.", icon: Sparkles, color: "from-sky-500 to-blue-600" },
  { text: "لمحاتك تبني المستقبل بيعة تلو الأخرى.", icon: Star, color: "from-gold to-yellow-600" },
];

export default function MotivationalBanner() {
  // Pick a quote based on the day of the year so it changes daily
  const quote = useMemo(() => {
    const dayOfYear = Math.floor(
      (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
    );
    return QUOTES[dayOfYear % QUOTES.length];
  }, []);

  const Icon = quote.icon;

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-l ${quote.color} p-5 mb-7 shadow-luxe-lg`}>
      {/* decorative circles */}
      <div className="absolute -top-6 -left-6 w-28 h-28 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 left-10 w-16 h-16 rounded-full bg-white/10" />

      <div className="relative flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="text-[11px] text-white/70 uppercase tracking-widest mb-1 font-medium">شعار اليوم</p>
          <p className="text-white font-bold text-base leading-snug">{quote.text}</p>
        </div>
        <Sparkles className="absolute left-2 top-1 w-4 h-4 text-white/30" />
      </div>
    </div>
  );
}