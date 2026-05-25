import React from "react";
import LinkPagePreview from "@/components/linktree/LinkPagePreview";

const BG_PRESETS = [
  "#f8f5ff", "#fff5f5", "#f0fdf4", "#fffbeb", "#f0f9ff",
  "#1e1b4b", "#0f172a", "#1a1a2e", "#0d0d0d", "#1c1917",
];

const BTN_PRESETS = [
  "#7c3aed", "#e11d48", "#059669", "#d97706", "#2563eb",
  "#0ea5e9", "#ec4899", "#10b981", "#f59e0b", "#6366f1",
];

const SHAPES = [
  { v: "pill", label: "دائري", class: "rounded-full" },
  { v: "rounded", label: "Rounded", class: "rounded-xl" },
  { v: "square", label: "مربع", class: "rounded-none" },
];

export default function Step4Customize({ data, update }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-3xl shadow-lg shadow-violet-100 p-6 space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">تخصيص التصميم</h2>
          <p className="text-sm text-gray-500 mt-1">اجعل صفحتك تعكس شخصيتك</p>
        </div>

        {/* Background Color */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">لون الخلفية</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {BG_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => update({ bg_color: c })}
                style={{ backgroundColor: c }}
                className={`w-9 h-9 rounded-xl border-2 transition-all ${data.bg_color === c ? "border-violet-600 scale-110" : "border-gray-200 hover:scale-105"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={data.bg_color}
              onChange={(e) => update({ bg_color: e.target.value })}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
            <span className="text-sm text-gray-500">أو اختر لوناً مخصصاً</span>
          </div>
        </div>

        {/* Button Color */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">لون الأزرار</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {BTN_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => update({ btn_color: c })}
                style={{ backgroundColor: c }}
                className={`w-9 h-9 rounded-xl border-2 transition-all ${data.btn_color === c ? "border-violet-600 scale-110" : "border-transparent hover:scale-105"}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <input
              type="color"
              value={data.btn_color}
              onChange={(e) => update({ btn_color: e.target.value })}
              className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
            />
            <span className="text-sm text-gray-500">أو اختر لوناً مخصصاً</span>
          </div>
        </div>

        {/* Button Shape */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">شكل الأزرار</p>
          <div className="flex gap-2">
            {SHAPES.map((s) => (
              <button
                key={s.v}
                onClick={() => update({ btn_shape: s.v })}
                style={{ backgroundColor: data.btn_color }}
                className={`flex-1 py-2 text-white text-sm font-medium transition-all ${s.class} ${data.btn_shape === s.v ? "ring-2 ring-violet-600 ring-offset-2" : "opacity-70 hover:opacity-90"}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Live Preview */}
      <div className="bg-white rounded-3xl shadow-lg shadow-violet-100 p-4">
        <p className="text-xs font-semibold text-gray-500 mb-3 text-center">معاينة الصفحة</p>
        <div className="overflow-hidden rounded-2xl" style={{ maxHeight: 380 }}>
          <LinkPagePreview data={data} />
        </div>
      </div>
    </div>
  );
}