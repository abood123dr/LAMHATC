import { createClient } from '@supabase/supabase-js';

const explicitSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function inferSupabaseUrlFromAnonKey(key) {
  try {
    const [, payload] = key.split('.');
    if (!payload) return '';
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), '=');
    const decoded = JSON.parse(globalThis.atob(padded));
    return decoded?.ref ? `https://${decoded.ref}.supabase.co` : '';
  } catch (error) {
    return '';
  }
}

const supabaseUrl = explicitSupabaseUrl || inferSupabaseUrlFromAnonKey(supabaseKey || '');
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

class EmptyQuery {
  constructor() {
    this.pendingInsert = null;
    this.pendingUpdate = null;
  }

  select() { return this; }
  order() { return this; }
  limit() { return this; }
  eq() { return this; }
  delete() { return this; }
  update(record) {
    this.pendingUpdate = record;
    return this;
  }
  insert(records) {
    this.pendingInsert = Array.isArray(records) ? records : [records];
    return this;
  }
  single() {
    return Promise.resolve({
      data: this.pendingInsert?.[0] || this.pendingUpdate || null,
      error: null,
    });
  }
  then(resolve, reject) {
    return Promise.resolve({ data: [], error: null }).then(resolve, reject);
  }
}

const createMissingConfigClient = () => ({
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    signInWithPassword: async () => ({
      error: new Error('Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local.'),
    }),
    signOut: async () => ({ error: null }),
    onAuthStateChange: () => ({
      data: { subscription: { unsubscribe: () => {} } },
    }),
  },
  from: () => new EmptyQuery(),
  channel: () => ({
    on() { return this; },
    subscribe() { return this; },
  }),
  removeChannel: () => {},
  storage: {
    from: () => ({
      upload: async () => ({ data: null, error: new Error('Supabase storage is not configured.') }),
      getPublicUrl: () => ({ data: { publicUrl: '' } }),
    }),
  },
});

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : createMissingConfigClient();

export const publicSupabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    })
  : createMissingConfigClient();
