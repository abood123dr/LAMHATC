import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/lib/supabase-client";
import { useAuth } from "@/lib/AuthContext";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  Package,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";

const previewTabs = [
  { id: "sales", label: "المبيعات", icon: ShoppingBag, value: "42,850", caption: "ر.س هذا الشهر" },
  { id: "stock", label: "المخزون", icon: Package, value: "318", caption: "منتج متابع" },
  { id: "orders", label: "الطلبات", icon: ClipboardList, value: "24", caption: "طلب قيد المتابعة" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState("sales");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const activePreview = previewTabs.find((tab) => tab.id === activeTab) || previewTabs[0];
  const ActivePreviewIcon = activePreview.icon;

  const handleLogin = async (event) => {
    event.preventDefault();

    if (isAuthenticated) {
      navigate("/dashboard");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      if (loginError) throw loginError;
      navigate("/dashboard");
    } catch (loginError) {
      setError(
        isSupabaseConfigured
          ? "بيانات الدخول غير صحيحة أو لا تملك صلاحية دخول."
          : "أضف إعدادات Supabase في .env.local قبل تسجيل الدخول."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f4] text-slate-950" dir="rtl">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-slate-950/70" />
        <div className="relative mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 content-center gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
          <div className="flex min-h-[52vh] flex-col justify-center py-10 text-white">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold backdrop-blur">
              <ShieldCheck className="h-4 w-4 text-emerald-300" />
              دخول آمن لفريق لمحاتك فقط
            </div>

            <h1 className="max-w-3xl text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
              لمحاتك
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/82 sm:text-lg">
              لوحة تشغيل بسيطة لإدارة الطلبات، المخزون، العملاء، المبيعات، والعروض من مكان واحد.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => navigate("/menu?branch=saudi")}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 text-sm font-black text-slate-950 transition hover:bg-amber-200"
              >
                تصفح الكتالوج
                <ShoppingBag className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => document.getElementById("login-panel")?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/24 bg-white/10 px-5 text-sm font-black text-white transition hover:bg-white/16"
              >
                دخول الإدارة
                <LockKeyhole className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
              {previewTabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-right transition ${
                      active
                        ? "border-amber-300 bg-amber-300 text-slate-950"
                        : "border-white/18 bg-white/10 text-white hover:bg-white/16"
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm font-bold">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-center pb-6 lg:pb-0">
            <div id="login-panel" className="w-full max-w-md rounded-lg border border-white/14 bg-white p-4 shadow-2xl sm:p-5">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-500">تسجيل دخول</p>
                  <h2 className="text-2xl font-black text-slate-950">بوابة النظام</h2>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-amber-300">
                  <LockKeyhole className="h-5 w-5" />
                </div>
              </div>

              <form className="space-y-3" onSubmit={handleLogin}>
                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-slate-700">البريد الإلكتروني</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-sm font-bold text-slate-700">كلمة المرور</span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-4 text-base text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-200"
                    autoComplete="current-password"
                    required
                  />
                </label>

                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                >
                  {loading ? "جاري الدخول..." : isAuthenticated ? "فتح لوحة التحكم" : "دخول للنظام"}
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </form>

              <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ActivePreviewIcon className="h-5 w-5 text-amber-600" />
                    <span className="text-sm font-black text-slate-700">{activePreview.label}</span>
                  </div>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-3xl font-black text-slate-950">{activePreview.value}</p>
                    <p className="text-sm font-semibold text-slate-500">{activePreview.caption}</p>
                  </div>
                  <div className="flex h-16 items-end gap-1.5" aria-hidden="true">
                    {[34, 48, 28, 58, 46, 66].map((height, index) => (
                      <span
                        key={height + index}
                        className="w-4 rounded-t bg-amber-400"
                        style={{ height }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-bold text-slate-600">
                <span className="rounded-lg bg-slate-100 px-2 py-2">طلبات</span>
                <span className="rounded-lg bg-slate-100 px-2 py-2">مخزون</span>
                <span className="rounded-lg bg-slate-100 px-2 py-2">عملاء</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
        {[
          { icon: BarChart3, title: "قرارات أسرع", text: "أرقام واضحة للمبيعات والمخزون بدون تنقل كثير." },
          { icon: ClipboardList, title: "طلبات مرتبة", text: "متابعة حالات الطلب من الاستلام إلى الاكتمال." },
          { icon: Users, title: "فريق محدود", text: "الدخول محمي بالحسابات المصرح لها فقط." },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-black text-slate-950">{item.title}</h3>
              <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
            </article>
          );
        })}
      </section>

      <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-sm font-semibold text-slate-500">
        <span className="inline-flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          نظام لمحاتك لإدارة التشغيل اليومي
        </span>
      </footer>
    </main>
  );
}
