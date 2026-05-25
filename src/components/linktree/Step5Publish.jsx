import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, QrCode, Rocket, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import LinkPagePreview from "@/components/linktree/LinkPagePreview";
import { toast } from "sonner";

export default function Step5Publish({ data, saving, published, publishedPage, onPublish }) {
  const [copied, setCopied] = useState(false);

  const pageUrl = `${window.location.origin}/p/${data.username}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(pageUrl)}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    toast.success("تم نسخ الرابط!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Preview */}
      <div className="bg-white rounded-3xl shadow-lg shadow-violet-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">معاينة صفحتك</h2>
            <p className="text-xs text-gray-400">{pageUrl}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        </div>
        <div className="overflow-hidden" style={{ maxHeight: 400 }}>
          <LinkPagePreview data={data} />
        </div>
      </div>

      {published ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-lg shadow-violet-100 p-6 space-y-5"
        >
          <div className="text-center">
            <div className="text-5xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-gray-900">تم نشر صفحتك!</h3>
            <p className="text-sm text-gray-500 mt-1">شارك رابطك الآن مع الجميع</p>
          </div>

          {/* Link Box */}
          <div className="bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3 flex items-center gap-2">
            <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="flex-1 text-violet-600 font-mono text-sm truncate">
              {pageUrl}
            </a>
            <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="text-violet-400 hover:text-violet-600">
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              className={`flex-1 gap-2 ${copied ? "bg-emerald-500 hover:bg-emerald-600" : "bg-violet-600 hover:bg-violet-700"} text-white`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "تم النسخ!" : "نسخ الرابط"}
            </Button>
          </div>

          {/* QR Code */}
          <div className="border border-gray-100 rounded-2xl p-5 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <QrCode className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-600">رمز QR</span>
            </div>
            <img src={qrUrl} alt="QR Code" className="mx-auto w-36 h-36 rounded-xl" />
            <p className="text-xs text-gray-400 mt-2">امسح الرمز لفتح الصفحة</p>
          </div>
        </motion.div>
      ) : (
        <div className="bg-white rounded-3xl shadow-lg shadow-violet-100 p-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">جاهز للنشر؟</h2>
            <p className="text-sm text-gray-500 mt-1">سيتم إنشاء رابطك الفريد فوراً</p>
          </div>

          <div className="bg-violet-50 border border-violet-200 rounded-2xl px-4 py-3">
            <p className="text-xs text-gray-500 mb-1">رابطك سيكون:</p>
            <p className="font-mono text-violet-700 font-bold">{pageUrl}</p>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>✓ رابط دائم</span>
            <span>·</span>
            <span>✓ قابل للتعديل</span>
            <span>·</span>
            <span>✓ يعمل فوراً</span>
          </div>

          <Button
            onClick={onPublish}
            disabled={saving}
            className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white py-3 text-base font-bold"
          >
            {saving ? "جاري النشر..." : "نشر الصفحة الآن"}
            <Rocket className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}