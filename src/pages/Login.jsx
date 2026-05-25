// src/pages/Login.jsx
// صفحة تسجيل الدخول - استبدال Base44 login

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = '/';
    } catch (err) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#f8fafc', fontFamily: 'sans-serif', direction: 'rtl'
    }}>
      <div style={{
        background: '#fff', padding: '2.5rem', borderRadius: '12px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)', width: '100%', maxWidth: '400px'
      }}>
        <h2 style={{ marginBottom: '1.5rem', textAlign: 'center', color: '#1e293b' }}>
          تسجيل الدخول
        </h2>

        {error && (
          <div style={{
            background: '#fee2e2', color: '#dc2626', padding: '0.75rem',
            borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: '#475569' }}>
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', padding: '0.65rem 0.9rem',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '1rem', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.4rem', color: '#475569' }}>
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '0.65rem 0.9rem',
                border: '1px solid #cbd5e1', borderRadius: '8px',
                fontSize: '1rem', boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '0.75rem',
              background: loading ? '#94a3b8' : '#2563eb',
              color: '#fff', border: 'none', borderRadius: '8px',
              fontSize: '1rem', cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: '600'
            }}
          >
            {loading ? 'جاري الدخول...' : 'دخول'}
          </button>
        </form>
      </div>
    </div>
  );
}
