const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { motion } from "framer-motion";
import { ExternalLink } from "lucide-react";

const PLATFORMS = {
  instagram: { icon: "📸", label: "Instagram", color: "#E1306C" },
  twitter: { icon: "🐦", label: "X (Twitter)", color: "#1DA1F2" },
  snapchat: { icon: "👻", label: "Snapchat", color: "#FFFC00" },
  tiktok: { icon: "🎵", label: "TikTok", color: "#010101" },
  whatsapp: { icon: "💬", label: "WhatsApp", color: "#25D366" },
  youtube: { icon: "▶️", label: "YouTube", color: "#FF0000" },
  telegram: { icon: "✈️", label: "Telegram", color: "#2CA5E0" },
  linkedin: { icon: "💼", label: "LinkedIn", color: "#0A66C2" },
  facebook: { icon: "📘", label: "Facebook", color: "#1877F2" },
  website: { icon: "🌐", label: "موقع", color: "#6366f1" },
};

const RADIUS = { pill: "9999px", rounded: "12px", square: "0px" };

function isLight(hex) {
  if (!hex) return true;
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}

export default function PublicLinkPage() {
  const { username } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const load = async () => {
      const results = await db.entities.LinkPage.filter({ username });
      if (!results || results.length === 0) {
        setNotFound(true);
      } else {
        const p = results[0];
        setPage(p);
        // Increment views
        db.entities.LinkPage.update(p.id, { views: (p.views || 0) + 1 });
      }
      setLoading(false);
    };
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50">
        <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50 px-4 text-center">
        <div className="text-6xl mb-4">😕</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">الصفحة غير موجودة</h1>
        <p className="text-gray-500">لم نجد صفحة باسم <span className="font-mono text-violet-600">@{username}</span></p>
      </div>
    );
  }

  const radius = RADIUS[page.btn_shape] || "12px";
  const dark = !isLight(page.bg_color);
  const textColor = dark ? "#ffffff" : "#1a1a1a";
  const subColor = dark ? "#dddddd" : "#555555";

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: page.bg_color || "#f8f5ff",
        backgroundImage: page.bg_image_url ? `url(${page.bg_image_url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
      dir="rtl"
    >
      <div className="max-w-md mx-auto px-4 py-12 flex flex-col items-center">
        {/* Avatar */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="mb-4"
        >
          {page.avatar_url ? (
            <img
              src={page.avatar_url}
              alt={page.display_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-xl"
            />
          ) : (
            <div
              className="w-24 h-24 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-4xl font-bold"
              style={{ backgroundColor: page.btn_color + "30", color: page.btn_color }}
            >
              {page.display_name?.[0]}
            </div>
          )}
        </motion.div>

        {/* Name */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold mb-1 text-center"
          style={{ color: textColor }}
        >
          {page.display_name}
        </motion.h1>

        {/* Bio */}
        {page.bio && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-sm text-center mb-5 max-w-xs leading-relaxed"
            style={{ color: subColor }}
          >
            {page.bio}
          </motion.p>
        )}

        {/* Socials */}
        {page.socials?.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex gap-3 mb-6 flex-wrap justify-center"
          >
            {page.socials.map((s) => {
              const pl = PLATFORMS[s.platform];
              return (
                <a
                  key={s.id}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-white shadow-md flex items-center justify-center text-2xl hover:scale-110 transition-transform"
                  title={pl?.label}
                >
                  {pl?.icon}
                </a>
              );
            })}
          </motion.div>
        )}

        {/* Links */}
        <div className="w-full space-y-3">
          {page.links?.map((link, i) => (
            <motion.a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 + i * 0.07 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-5 text-center text-base font-bold text-white shadow-lg"
              style={{ backgroundColor: page.btn_color, borderRadius: radius }}
            >
              {link.title}
              <ExternalLink className="w-4 h-4 opacity-70" />
            </motion.a>
          ))}
        </div>

        {/* Views counter */}
        {page.views > 0 && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-10 text-xs opacity-40"
            style={{ color: textColor }}
          >
            👁 {page.views.toLocaleString("ar-SA")} مشاهدة
          </motion.p>
        )}

        {/* Branding */}
        <p className="mt-4 text-xs opacity-30" style={{ color: textColor }}>
          صُنع بـ لمحاتك
        </p>
      </div>
    </div>
  );
}