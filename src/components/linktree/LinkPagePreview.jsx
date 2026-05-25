import React from "react";

const PLATFORMS = {
  instagram: { icon: "📸", label: "Instagram" },
  twitter: { icon: "🐦", label: "X (Twitter)" },
  snapchat: { icon: "👻", label: "Snapchat" },
  tiktok: { icon: "🎵", label: "TikTok" },
  whatsapp: { icon: "💬", label: "WhatsApp" },
  youtube: { icon: "▶️", label: "YouTube" },
  telegram: { icon: "✈️", label: "Telegram" },
  linkedin: { icon: "💼", label: "LinkedIn" },
  facebook: { icon: "📘", label: "Facebook" },
  website: { icon: "🌐", label: "موقع" },
};

const RADIUS = {
  pill: "9999px",
  rounded: "12px",
  square: "0px",
};

export default function LinkPagePreview({ data }) {
  const radius = RADIUS[data.btn_shape] || "12px";

  return (
    <div
      className="w-full min-h-full flex flex-col items-center px-4 py-8"
      style={{
        backgroundColor: data.bg_color || "#f8f5ff",
        backgroundImage: data.bg_image_url ? `url(${data.bg_image_url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Avatar */}
      <div className="mb-4">
        {data.avatar_url ? (
          <img
            src={data.avatar_url}
            alt="avatar"
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
          />
        ) : (
          <div
            className="w-20 h-20 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold"
            style={{ backgroundColor: data.btn_color + "30", color: data.btn_color }}
          >
            {data.display_name?.[0] || "؟"}
          </div>
        )}
      </div>

      {/* Name & Bio */}
      <h1 className="text-xl font-bold text-center mb-1" style={{ color: isLight(data.bg_color) ? "#1a1a1a" : "#ffffff" }}>
        {data.display_name || "اسمك هنا"}
      </h1>
      {data.bio && (
        <p className="text-sm text-center mb-4 max-w-xs opacity-80" style={{ color: isLight(data.bg_color) ? "#555" : "#ddd" }}>
          {data.bio}
        </p>
      )}

      {/* Socials */}
      {data.socials?.length > 0 && (
        <div className="flex gap-2 mb-5 flex-wrap justify-center">
          {data.socials.map((s) => (
            <div
              key={s.id}
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg shadow"
              style={{ backgroundColor: "white" }}
              title={PLATFORMS[s.platform]?.label}
            >
              {PLATFORMS[s.platform]?.icon}
            </div>
          ))}
        </div>
      )}

      {/* Links */}
      <div className="w-full max-w-sm space-y-3">
        {data.links?.length > 0 ? (
          data.links.map((link) => (
            <div
              key={link.id}
              className="w-full py-3 px-5 text-center text-sm font-bold text-white shadow-md transition-transform hover:scale-105 cursor-pointer"
              style={{ backgroundColor: data.btn_color, borderRadius: radius }}
            >
              {link.title}
            </div>
          ))
        ) : (
          <div
            className="w-full py-3 px-5 text-center text-sm font-bold text-white shadow-md opacity-40"
            style={{ backgroundColor: data.btn_color, borderRadius: radius }}
          >
            رابط تجريبي
          </div>
        )}
      </div>
    </div>
  );
}

function isLight(hex) {
  if (!hex) return true;
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 128;
}