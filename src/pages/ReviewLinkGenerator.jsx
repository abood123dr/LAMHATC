import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, Copy, Check, ExternalLink, QrCode, AlertCircle, ArrowRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ReviewLinkGenerator() {
  const navigate = useNavigate();
  const [placeId, setPlaceId] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = () => {
    if (!placeId.trim()) {
      setError("يرجى إدخال معرّف المكان للمتابعة.");
      setGeneratedLink("");
      setQrUrl("");
      return;
    }
    setError("");
    const link = `https://search.google.com/local/writereview?placeid=${placeId.trim()}`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(link)}`;
    setGeneratedLink(link);
    setQrUrl(qr);
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleGenerate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-600 to-blue-500 flex flex-col" dir="rtl">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 pt-safe pt-5 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-white/80 hover:text-white transition-colors text-sm font-medium active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
          رجوع
        </button>
        <span className="text-white/0 text-sm">.</span>
      </div>

      {/* Hero */}
      <div className="text-center px-6 pb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur mb-4">
          <Star className="w-8 h-8 text-white" fill="white" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">مولّد رابط تقييم جوجل</h1>
        <p className="text-blue-100 text-sm">أدخل معرّف المكان لإنشاء رابط تقييم مباشر</p>
      </div>

      {/* Main Card */}
      <div className="flex-1 bg-white rounded-t-3xl px-5 pt-7 pb-10 overflow-y-auto">
        {/* Input Section */}
        <div className="space-y-3 mb-5">
          <label className="block text-sm font-semibold text-gray-700">معرّف المكان (Place ID)</label>
          <input
            type="text"
            value={placeId}
            onChange={(e) => { setPlaceId(e.target.value); setError(""); }}
            onKeyDown={handleKeyDown}
            placeholder="أدخل Place ID هنا..."
            className="w-full px-4 py-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all text-right"
          />

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-2 text-red-500 text-sm bg-red-50 px-3 py-2.5 rounded-xl"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-base font-semibold rounded-2xl shadow-lg shadow-blue-200 transition-all"
          >
            إنشاء الرابط
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Helper link */}
        <p className="text-center text-xs text-gray-400 mb-6">
          لا تعرف الـ Place ID؟{" "}
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 underline"
          >
            ابحث عنه هنا
          </a>
        </p>

        {/* Result */}
        <AnimatePresence>
          {generatedLink && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="space-y-4"
            >
              <div className="h-px bg-gray-100" />

              {/* Link box */}
              <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-blue-600 text-sm font-medium truncate"
                >
                  {generatedLink}
                </a>
                <a
                  href={generatedLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-blue-400 hover:text-blue-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* Copy button */}
              <button
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold transition-all active:scale-95 ${
                  copied
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                    : "bg-gray-900 hover:bg-gray-800 text-white shadow-lg shadow-gray-200"
                }`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                {copied ? "تم النسخ!" : "نسخ الرابط"}
              </button>

              {/* QR Code */}
              <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <QrCode className="w-4 h-4 text-gray-500" />
                  <span className="text-sm font-semibold text-gray-600">رمز QR</span>
                </div>
                <div className="flex justify-center">
                  <img
                    src={qrUrl}
                    alt="QR Code"
                    className="w-52 h-52 rounded-xl"
                  />
                </div>
                <p className="text-center text-xs text-gray-400 mt-3">امسح الرمز لفتح صفحة التقييم مباشرة</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}