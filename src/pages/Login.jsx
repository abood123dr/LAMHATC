import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { isSupabaseConfigured } from '@/lib/supabase-client';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard', { replace: true });
    } catch (loginError) {
      setError(
        isSupabaseConfigured
          ? 'بيانات الدخول غير صحيحة أو لا تملك صلاحية دخول.'
          : 'تسجيل الدخول غير مفعّل لأن إعدادات Supabase غير موجودة في Vercel.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f8f4] px-4 py-8 text-slate-950" dir="rtl">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <section className="w-full rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-500">لمحاتك</p>
              <h1 className="text-2xl font-black">تسجيل الدخول</h1>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-amber-300">
              <LockKeyhole className="h-5 w-5" />
            </div>
          </div>

          {!isSupabaseConfigured && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800">
              أضف متغيرات Supabase في Vercel حتى يعمل تسجيل الدخول.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
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

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="flex h-12 w-full items-center justify-center rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {loading ? 'جاري الدخول...' : 'دخول للنظام'}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
