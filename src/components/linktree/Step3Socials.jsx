import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: "📸", color: "#E1306C", placeholder: "https://instagram.com/username" },
  { id: "twitter", label: "X (Twitter)", icon: "🐦", color: "#1DA1F2", placeholder: "https://x.com/username" },
  { id: "snapchat", label: "Snapchat", icon: "👻", color: "#FFFC00", placeholder: "https://snapchat.com/add/username" },
  { id: "tiktok", label: "TikTok", icon: "🎵", color: "#010101", placeholder: "https://tiktok.com/@username" },
  { id: "whatsapp", label: "WhatsApp", icon: "💬", color: "#25D366", placeholder: "https://wa.me/966XXXXXXXXX" },
  { id: "youtube", label: "YouTube", icon: "▶️", color: "#FF0000", placeholder: "https://youtube.com/@channel" },
  { id: "telegram", label: "Telegram", icon: "✈️", color: "#2CA5E0", placeholder: "https://t.me/username" },
  { id: "linkedin", label: "LinkedIn", icon: "💼", color: "#0A66C2", placeholder: "https://linkedin.com/in/username" },
  { id: "facebook", label: "Facebook", icon: "📘", color: "#1877F2", placeholder: "https://facebook.com/username" },
  { id: "website", label: "موقع إلكتروني", icon: "🌐", color: "#6366f1", placeholder: "https://yourwebsite.com" },
];

let idC = 1;
const uid = () => `soc_${Date.now()}_${idC++}`;

export default function Step3Socials({ data, update }) {
  const [showPicker, setShowPicker] = useState(false);
  const [selected, setSelected] = useState(null);
  const [urlVal, setUrlVal] = useState("");

  const existing = data.socials.map((s) => s.platform);

  const pickPlatform = (p) => {
    setSelected(p);
    setUrlVal("");
  };

  const addSocial = () => {
    if (!urlVal.trim()) return;
    update({ socials: [...data.socials, { id: uid(), platform: selected.id, url: urlVal.trim() }] });
    setShowPicker(false);
    setSelected(null);
    setUrlVal("");
    toast.success(`تم إضافة ${selected.label}`);
  };

  const removeSocial = (id) => {
    update({ socials: data.socials.filter((s) => s.id !== id) });
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg shadow-violet-100 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">السوشيال ميديا</h2>
        <p className="text-sm text-gray-500 mt-1">أضف أيقونات منصاتك الاجتماعية</p>
      </div>

      {/* Added socials */}
      {data.socials.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {data.socials.map((s) => {
            const p = PLATFORMS.find((pl) => pl.id === s.platform);
            return (
              <motion.div
                key={s.id}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="relative group"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-md cursor-pointer"
                  style={{ backgroundColor: p?.color + "20", border: `2px solid ${p?.color}40` }}
                  title={p?.label}
                >
                  {p?.icon}
                </div>
                <button
                  onClick={() => removeSocial(s.id)}
                  className="absolute -top-2 -left-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-[10px] text-gray-500 text-center mt-1 max-w-[56px] truncate">{p?.label}</p>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Picker */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-violet-200 bg-violet-50 rounded-2xl p-4 space-y-4"
          >
            {!selected ? (
              <>
                <p className="text-sm font-semibold text-gray-700">اختر المنصة:</p>
                <div className="grid grid-cols-5 gap-2">
                  {PLATFORMS.filter((p) => !existing.includes(p.id)).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => pickPlatform(p)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white border border-transparent hover:border-violet-200 transition-all"
                    >
                      <span className="text-2xl">{p.icon}</span>
                      <span className="text-[9px] text-gray-600 font-medium leading-tight text-center">{p.label}</span>
                    </button>
                  ))}
                </div>
                <Button onClick={() => setShowPicker(false)} variant="outline" size="sm" className="w-full">
                  إلغاء
                </Button>
              </>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selected.icon}</span>
                  <p className="font-semibold text-gray-800">{selected.label}</p>
                </div>
                <Input
                  placeholder={selected.placeholder}
                  value={urlVal}
                  onChange={(e) => setUrlVal(e.target.value)}
                  dir="ltr"
                  className="text-left"
                />
                <div className="flex gap-2">
                  <Button onClick={addSocial} size="sm" className="bg-violet-600 hover:bg-violet-700 text-white flex-1" disabled={!urlVal.trim()}>
                    إضافة
                  </Button>
                  <Button onClick={() => setSelected(null)} size="sm" variant="outline">
                    رجوع
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!showPicker && (
        <Button
          onClick={() => setShowPicker(true)}
          variant="outline"
          className="w-full border-dashed border-violet-300 text-violet-600 hover:bg-violet-50 gap-2"
          disabled={data.socials.length >= PLATFORMS.length}
        >
          <Plus className="w-4 h-4" /> إضافة أيقونة سوشيال
        </Button>
      )}
    </div>
  );
}