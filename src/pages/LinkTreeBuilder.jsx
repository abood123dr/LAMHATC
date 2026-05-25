const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Plus, ArrowRight, ArrowLeft, Rocket, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Step1BasicInfo from "@/components/linktree/Step1BasicInfo";
import Step2Links from "@/components/linktree/Step2Links";
import Step3Socials from "@/components/linktree/Step3Socials";
import Step4Customize from "@/components/linktree/Step4Customize";
import Step5Publish from "@/components/linktree/Step5Publish";

import { toast } from "sonner";

const STEPS = [
  { id: 1, label: "المعلومات الأساسية" },
  { id: 2, label: "الروابط" },
  { id: 3, label: "السوشيال" },
  { id: 4, label: "التخصيص" },
  { id: 5, label: "النشر" },
];

const defaultData = {
  username: "",
  display_name: "",
  bio: "",
  avatar_url: "",
  links: [],
  socials: [],
  bg_color: "#f8f5ff",
  btn_color: "#7c3aed",
  btn_shape: "rounded",
  bg_image_url: "",
};

export default function LinkTreeBuilder() {
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);
  const [data, setData] = useState(defaultData);
  const [saving, setSaving] = useState(false);
  const [published, setPublished] = useState(false);
  const [publishedPage, setPublishedPage] = useState(null);

  const update = (fields) => setData((d) => ({ ...d, ...fields }));

  const handlePublish = async () => {
    if (!data.username || !data.display_name) {
      toast.error("يرجى إدخال اسم المستخدم والاسم المعروض");
      return;
    }
    setSaving(true);
    const page = await db.entities.LinkPage.create({ ...data, published: true, views: 0 });
    setPublishedPage(page);
    setPublished(true);
    setSaving(false);
    toast.success("🎉 تم نشر صفحتك بنجاح!");
  };

  if (!started) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 px-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-lg"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-200 mb-6">
            <Link2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">أنشئ صفحتك الخاصة الآن</h1>
          <p className="text-gray-500 text-lg mb-8 leading-relaxed">
            صفحة احترافية تجمع كل روابطك في مكان واحد، جاهزة خلال دقائق
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
            {["لا يحتاج برمجة", "مجاني 100%", "جاهز فوراً"].map((f) => (
              <span key={f} className="inline-flex items-center gap-1.5 bg-white border border-violet-100 text-violet-700 text-sm font-medium px-4 py-2 rounded-full shadow-sm">
                ✓ {f}
              </span>
            ))}
          </div>
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setStarted(true)}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white text-lg font-bold px-10 py-4 rounded-2xl shadow-xl shadow-violet-300 transition-all"
          >
            ابدأ الآن
            <Rocket className="w-5 h-5" />
          </motion.button>

          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-gray-400">
            <Share2 className="w-4 h-4" />
            <span>لديك صفحة سابقة؟</span>
            <button onClick={() => navigate("/p/me")} className="text-violet-600 underline underline-offset-2 font-medium">
              عدّل صفحتك
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 px-4 py-8" dir="rtl">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            {STEPS.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                  step > s.id ? "bg-violet-600 text-white" :
                  step === s.id ? "bg-violet-600 text-white ring-4 ring-violet-200" :
                  "bg-white border-2 border-gray-200 text-gray-400"
                }`}>
                  {step > s.id ? "✓" : s.id}
                </div>
                <span className={`text-[10px] font-medium hidden sm:block ${step >= s.id ? "text-violet-700" : "text-gray-400"}`}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
              animate={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3 }}
          >
            {step === 1 && <Step1BasicInfo data={data} update={update} />}
            {step === 2 && <Step2Links data={data} update={update} />}
            {step === 3 && <Step3Socials data={data} update={update} />}
            {step === 4 && <Step4Customize data={data} update={update} />}
            {step === 5 && (
              <Step5Publish
                data={data}
                saving={saving}
                published={published}
                publishedPage={publishedPage}
                onPublish={handlePublish}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {!published && (
          <div className="flex justify-between mt-6 gap-3">
            <Button
              variant="outline"
              onClick={() => step === 1 ? setStarted(false) : setStep((s) => s - 1)}
              className="gap-2"
            >
              <ArrowRight className="w-4 h-4" /> السابق
            </Button>
            {step < 5 ? (
              <Button
                onClick={() => setStep((s) => s + 1)}
                className="gap-2 bg-violet-600 hover:bg-violet-700 text-white"
                disabled={step === 1 && (!data.username || !data.display_name)}
              >
                التالي <ArrowLeft className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handlePublish}
                disabled={saving}
                className="gap-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white"
              >
                {saving ? "جاري النشر..." : "نشر الصفحة"} <Rocket className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}