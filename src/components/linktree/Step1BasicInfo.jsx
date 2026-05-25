const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useRef } from "react";
import { User, AtSign, FileText, Camera } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { toast } from "sonner";

export default function Step1BasicInfo({ data, update }) {
  const fileRef = useRef();

  const handleAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    toast.loading("جاري رفع الصورة...", { id: "avatar" });
    const { file_url } = await db.integrations.Core.UploadFile({ file });
    update({ avatar_url: file_url });
    toast.success("تم رفع الصورة", { id: "avatar" });
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg shadow-violet-100 p-6 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">المعلومات الأساسية</h2>
        <p className="text-sm text-gray-500 mt-1">ستظهر هذه المعلومات في أعلى صفحتك</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          className="relative w-24 h-24 rounded-full bg-violet-50 border-2 border-dashed border-violet-300 hover:border-violet-500 flex items-center justify-center transition-all group overflow-hidden"
        >
          {data.avatar_url ? (
            <img src={data.avatar_url} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-1 text-violet-400 group-hover:text-violet-600">
              <Camera className="w-7 h-7" />
              <span className="text-xs font-medium">صورة</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        </button>
        <p className="text-xs text-gray-400">اضغط لرفع صورة شخصية</p>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div>
          <Label className="flex items-center gap-1.5 text-gray-700 mb-1.5">
            <AtSign className="w-4 h-4 text-violet-500" /> اسم المستخدم (لا يحتوي مسافات) *
          </Label>
          <Input
            placeholder="مثال: ahmed_store"
            value={data.username}
            onChange={(e) => update({ username: e.target.value.replace(/\s/g, "").toLowerCase() })}
            className="text-left"
            dir="ltr"
          />
          {data.username && (
            <p className="text-xs text-violet-600 mt-1">
              رابطك: <span className="font-mono font-bold">/p/{data.username}</span>
            </p>
          )}
        </div>

        <div>
          <Label className="flex items-center gap-1.5 text-gray-700 mb-1.5">
            <User className="w-4 h-4 text-violet-500" /> الاسم المعروض *
          </Label>
          <Input
            placeholder="مثال: متجر أحمد للإلكترونيات"
            value={data.display_name}
            onChange={(e) => update({ display_name: e.target.value })}
          />
        </div>

        <div>
          <Label className="flex items-center gap-1.5 text-gray-700 mb-1.5">
            <FileText className="w-4 h-4 text-violet-500" /> وصف قصير (Bio)
          </Label>
          <Textarea
            placeholder="اكتب وصفاً مختصراً عن نفسك أو نشاطك..."
            value={data.bio}
            onChange={(e) => update({ bio: e.target.value })}
            rows={3}
            maxLength={160}
          />
          <p className="text-xs text-gray-400 mt-1 text-left">{data.bio.length}/160</p>
        </div>
      </div>

      {/* Live Preview */}
      {(data.display_name || data.bio || data.avatar_url) && (
        <div className="border border-violet-100 bg-violet-50 rounded-2xl p-4">
          <p className="text-xs text-violet-500 font-medium mb-3 text-center">معاينة مباشرة</p>
          <div className="flex flex-col items-center gap-2">
            {data.avatar_url ? (
              <img src={data.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white shadow" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-violet-200 flex items-center justify-center text-violet-600 text-xl font-bold">
                {data.display_name?.[0] || "؟"}
              </div>
            )}
            <p className="font-bold text-gray-900 text-base">{data.display_name || "اسمك هنا"}</p>
            {data.bio && <p className="text-sm text-gray-500 text-center">{data.bio}</p>}
          </div>
        </div>
      )}
    </div>
  );
}