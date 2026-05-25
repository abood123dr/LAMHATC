// src/api/base44Client.js
// استبدال كامل لـ Base44 SDK بـ Supabase

import { supabase } from '@/lib/supabase-client';

// =============================================
// Entity Class - نفس واجهة Base44
// =============================================
class Entity {
  constructor(tableName) {
    this.tableName = tableName;
  }

  async list(sortBy = null, limit = 1000) {
    let query = supabase.from(this.tableName).select('*');
    if (sortBy) {
      const desc = sortBy.startsWith('-');
      query = query.order(desc ? sortBy.slice(1) : sortBy, { ascending: !desc });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) { console.error(error); return []; }
    return data || [];
  }

  async filter(conditions = {}, sortBy = null) {
    let query = supabase.from(this.tableName).select('*');
    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query = query.eq(key, value);
      }
    });
    if (sortBy) {
      const desc = sortBy.startsWith('-');
      query = query.order(desc ? sortBy.slice(1) : sortBy, { ascending: !desc });
    } else {
      query = query.order('created_at', { ascending: false });
    }
    const { data, error } = await query;
    if (error) { console.error(error); return []; }
    return data || [];
  }

  async get(id) {
    const { data, error } = await supabase
      .from(this.tableName).select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  }

  async create(record) {
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from(this.tableName)
      .insert([{ ...record, created_by: user?.email || null }])
      .select().single();
    if (error) throw error;
    return data;
  }

  async update(id, updates) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id).select().single();
    if (error) throw error;
    return data;
  }

  async delete(id) {
    const { error } = await supabase.from(this.tableName).delete().eq('id', id);
    if (error) throw error;
    return { success: true };
  }
}

// =============================================
// Auth - نفس واجهة Base44
// =============================================
const auth = {
  async me() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');
    const { data: profile } = await supabase
      .from('user_profiles').select('*').eq('id', user.id).single();
    return { ...user, ...(profile || {}) };
  },

  async isAuthenticated() {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user;
  },

  async logout() {
    await supabase.auth.signOut();
    window.location.href = '/';
  },

  redirectToLogin() {
    window.location.href = '/login';
  },
};

// =============================================
// Integrations - نفس واجهة Base44
// =============================================
const integrations = {
  Core: {
    async UploadFile({ file }) {
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `${Date.now()}_${file.name}`;
      const path = `uploads/${user?.id || 'anonymous'}/${fileName}`;
      const { data, error } = await supabase.storage
        .from('files').upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('files').getPublicUrl(path);
      return { file_url: publicUrl };
    },

    async InvokeLLM({ prompt }) {
      console.warn('InvokeLLM: غير متاح بدون Base44');
      return { output: '' };
    },

    async SendEmail({ to, subject, body }) {
      console.warn('SendEmail: غير متاح بدون Base44');
      return { success: false };
    },
  }
};

// =============================================
// Entities
// =============================================
export const Customer      = new Entity('customers');
export const Product       = new Entity('products');
export const Order         = new Entity('orders');
export const Quote         = new Entity('quotes');
export const Sale          = new Entity('sales');
export const StockMovement = new Entity('stock_movements');
export const DiscountCode  = new Entity('discount_codes');
export const LinkPage      = new Entity('link_pages');

// =============================================
// Export الرئيسي - نفس base44 القديم
// =============================================
export const base44 = {
  entities: {
    Customer,
    Product,
    Order,
    Quote,
    Sale,
    StockMovement,
    DiscountCode,
    LinkPage,
  },
  auth,
  integrations,
  functions: {},
};

export default base44;
