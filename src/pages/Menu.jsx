const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useMemo, useRef, useEffect } from "react";

import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart, Plus, Minus, X, Search, CheckCircle2,
  ChevronRight, Trash2, MessageCircle, Package, Sparkles,
  ArrowRight, MapPin, Phone, User, FileText, Star,
  CreditCard, Banknote, Camera, ShoppingBag, Zap, Tag, Navigation
} from "lucide-react";
import { toast } from "sonner";

const BRANCH_WHATSAPP = { saudi: "905010099997", turkey: "905010099997" };
const urlParams = new URLSearchParams(window.location.search);
const BRANCH = urlParams.get("branch") === "turkey" ? "turkey" : "saudi";
const CURRENCY = BRANCH === "saudi" ? "ر.س" : "₺";
const PRICE_KEY = BRANCH === "saudi" ? "saudi_price" : "turkey_price";
const STOCK_KEY = BRANCH === "saudi" ? "saudi_stock" : "turkey_stock";
const BRANCH_LABEL = BRANCH === "saudi" ? "السعودية" : "تركيا";
const BRANCH_FLAG = BRANCH === "saudi" ? "🇸🇦" : "🇹🇷";

const STEP_MENU = "menu";
const STEP_CART = "cart";
const STEP_INFO = "info";
const STEP_SUCCESS = "success";

const PAYMENT_METHODS = [
  { id: "cod", label: "الدفع عند الاستلام", icon: Banknote, desc: "ادفع نقداً عند وصول طلبك" },
  { id: "transfer", label: "تحويل بنكي", icon: CreditCard, desc: "حوّل للحساب وأرفق الإيصال (اختياري)" },
];

const BANK_INFO = { name: "VAFAA ALAGHBAR", iban: "TR980020500009881402200003", currency: "TL" };

export default function Menu() {
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState(STEP_MENU);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [form, setForm] = useState({ name: "", phone: "", city: "", notes: "" });
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [locationUrl, setLocationUrl] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  // كود الخصم
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    db.entities.Product.list("-created_date", 500)
      .then((data) => { setProducts(data || []); setLoadingProducts(false); })
      .catch(() => setLoadingProducts(false));
  }, []);

  useEffect(() => {
    const unsub = db.entities.Product.subscribe((event) => {
      if (event.type === "create") setProducts(p => [...p, event.data]);
      else if (event.type === "update") setProducts(p => p.map(x => x.id === event.id ? event.data : x));
      else if (event.type === "delete") setProducts(p => p.filter(x => x.id !== event.id));
    });
    return unsub;
  }, []);

  const categories = useMemo(() => [...new Set(products.map(p => p.category).filter(Boolean))], [products]);

  const filtered = useMemo(() => products.filter(p => {
    if (activeCategory !== "all" && p.category !== activeCategory) return false;
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase()) &&
        !p.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [products, activeCategory, search]);

  const cartSubtotal = cart.reduce((s, i) => s + i.total, 0);
  const discountAmount = appliedDiscount
    ? appliedDiscount.discount_type === "percentage"
      ? Math.round(cartSubtotal * appliedDiscount.discount_value / 100)
      : appliedDiscount.discount_value
    : 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const addToCart = (product) => {
    const price = product[PRICE_KEY] || 0;
    const stock = product[STOCK_KEY] || 0;
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= stock) { toast.error("لا يوجد مخزون كافٍ"); return prev; }
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * price } : i);
      }
      return [...prev, { product_id: product.id, product_name: product.name, quantity: 1, unit_price: price, total: price, image_url: product.image_url, max_stock: stock }];
    });
    toast.success("أُضيف للسلة", { description: product.name, duration: 1500 });
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.product_id !== id));

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i.product_id !== id) return i;
      const qty = i.quantity + delta;
      if (qty <= 0) return null;
      if (qty > i.max_stock) { toast.error("لا يوجد مخزون كافٍ"); return i; }
      return { ...i, quantity: qty, total: qty * i.unit_price };
    }).filter(Boolean));
  };

  const handleReceiptUpload = async (file) => {
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      setReceiptUrl(file_url);
      toast.success("تم رفع الإيصال ✓");
    } catch { toast.error("فشل رفع الإيصال"); }
    setUploadingReceipt(false);
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) { toast.error("المتصفح لا يدعم تحديد الموقع"); return; }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const url = `https://maps.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        setLocationUrl(url);
        setGettingLocation(false);
        toast.success("تم تحديد موقعك ✓");
      },
      () => { toast.error("تعذّر تحديد الموقع"); setGettingLocation(false); }
    );
  };

  const handleApplyDiscount = async () => {
    if (!discountCode.trim()) return;
    setCheckingCode(true);
    try {
      const codes = await db.entities.DiscountCode.filter({ code: discountCode.trim().toUpperCase() });
      const code = codes?.[0];
      if (!code) { toast.error("كود الخصم غير صحيح"); setCheckingCode(false); return; }
      if (!code.is_active) { toast.error("هذا الكود غير مفعّل"); setCheckingCode(false); return; }
      if (code.expiry_date && new Date(code.expiry_date) < new Date()) { toast.error("انتهت صلاحية الكود"); setCheckingCode(false); return; }
      if (code.max_uses && code.used_count >= code.max_uses) { toast.error("تم استنفاد هذا الكود"); setCheckingCode(false); return; }
      if (code.branch !== "both" && code.branch !== BRANCH) { toast.error("هذا الكود غير متاح لفرعك"); setCheckingCode(false); return; }
      setAppliedDiscount(code);
      toast.success(`✓ تم تطبيق الخصم: ${code.discount_type === "percentage" ? code.discount_value + "%" : code.discount_value + " " + CURRENCY}`);
    } catch { toast.error("خطأ في التحقق من الكود"); }
    setCheckingCode(false);
  };

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error("يرجى إدخال الاسم ورقم الجوال"); return; }
    setSubmitting(true);
    let customerId = null;
    try {
      const existing = await db.entities.Customer.filter({ phone: form.phone.trim(), branch: BRANCH });
      if (existing?.length > 0) customerId = existing[0].id;
      else { const nc = await db.entities.Customer.create({ name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim(), branch: BRANCH }); customerId = nc.id; }
    } catch { const nc = await db.entities.Customer.create({ name: form.name.trim(), phone: form.phone.trim(), city: form.city.trim(), branch: BRANCH }); customerId = nc.id; }

    // تحديث عداد استخدام كود الخصم
    if (appliedDiscount) {
      await db.entities.DiscountCode.update(appliedDiscount.id, { used_count: (appliedDiscount.used_count || 0) + 1 });
    }

    await db.entities.Order.create({
      customer_name: form.name.trim(), customer_phone: form.phone.trim(), customer_city: form.city.trim(),
      branch: BRANCH,
      items: cart.map(i => ({ product_id: i.product_id, product_name: i.product_name, quantity: i.quantity, unit_price: i.unit_price, total: i.total })),
      total_amount: cartTotal,
      status: "new",
      notes: [
        `[طريقة الدفع: ${paymentMethod === "cod" ? "دفع عند الاستلام" : "تحويل بنكي"}]`,
        receiptUrl ? `[إيصال: ${receiptUrl}]` : "",
        appliedDiscount ? `[كود خصم: ${appliedDiscount.code} - خصم ${discountAmount} ${CURRENCY}]` : "",
        locationUrl ? `[موقع العميل: ${locationUrl}]` : "",
        form.notes.trim(),
      ].filter(Boolean).join("\n"),
      customer_id: customerId,
      customer_location_url: locationUrl || null,
    });

    const payText = paymentMethod === "cod" ? "💵 الدفع: عند الاستلام" : `🏦 الدفع: تحويل بنكي${receiptUrl ? "\n✅ تم رفع الإيصال" : ""}`;
    const itemsText = cart.map(i => `• ${i.product_name} × ${i.quantity} = ${i.total} ${CURRENCY}`).join("\n");
    const discountText = appliedDiscount ? `\n🏷️ كود خصم: -${discountAmount} ${CURRENCY}` : "";
    const locationText = locationUrl ? `\n📍 الموقع: ${locationUrl}` : "";
    const waMsg = `🛍️ طلب جديد من منتجات لمحة تك!\n\n👤 ${form.name}\n📱 ${form.phone}\n🏙️ ${form.city || "—"}\n\n📦 المنتجات:\n${itemsText}\n\n💰 المجموع: ${cartSubtotal} ${CURRENCY}${discountText}\n✅ الإجمالي: ${cartTotal} ${CURRENCY}\n${payText}${locationText}\n📝 ${form.notes || "—"}`;

    // فتح واتساب برقم العميل مباشرةً (بادئة 90)
    let phone = form.phone.trim().replace(/\D/g, "");
    if (phone.startsWith("00")) phone = phone.slice(2);
    if (!phone.startsWith("90")) phone = "90" + phone;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`, "_blank");

    setStep(STEP_SUCCESS);
    setSubmitting(false);
  };

  // ── SUCCESS ──────────────────────────────────────────────────────────────────
  if (step === STEP_SUCCESS) return (
    <div className="min-h-screen flex items-center justify-center p-6" dir="rtl"
      style={{ background: "linear-gradient(160deg,#0b1120 0%,#1a2744 60%,#0b1120 100%)" }}>
      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", bounce: 0.45, duration: 0.7 }} className="text-center max-w-xs w-full">
        <div className="relative w-36 h-36 mx-auto mb-8">
          <div className="absolute inset-0 rounded-full bg-emerald-400/10 animate-ping" style={{ animationDuration: "2.5s" }} />
          <div className="absolute inset-4 rounded-full bg-emerald-400/10 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.4s" }} />
          <div className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/30"
            style={{ background: "linear-gradient(135deg,#10b981,#059669)" }}>
            <CheckCircle2 style={{ width: 72, height: 72 }} className="text-white" strokeWidth={1.5} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-white mb-2">تم إرسال طلبك! 🎉</h2>
        <p className="text-slate-400 text-sm mb-6">سيتواصل معك فريقنا قريباً</p>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-8 flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <p className="text-emerald-400 text-sm font-bold">تم فتح واتساب للتأكيد</p>
        </div>
        <button onClick={() => { setStep(STEP_MENU); setCart([]); setForm({ name:"",phone:"",city:"",notes:"" }); setPaymentMethod("cod"); setReceiptUrl(""); setLocationUrl(""); setDiscountCode(""); setAppliedDiscount(null); }}
          className="w-full py-4 rounded-2xl font-black text-slate-900 text-base active:scale-95 transition-all shadow-xl"
          style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
          تصفح المزيد
        </button>
      </motion.div>
    </div>
  );

  // ── INFO STEP ────────────────────────────────────────────────────────────────
  if (step === STEP_INFO) return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="sticky top-0 z-20 border-b border-slate-100 px-4 py-3.5 flex items-center gap-3 bg-white shadow-sm">
        <button onClick={() => setStep(STEP_CART)} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-black text-slate-900 text-base">إتمام الطلب</h1>
          <p className="text-xs text-slate-400">أدخل بياناتك لإرسال طلبك</p>
        </div>
        <span className="bg-amber-100 text-amber-700 text-xs font-black px-3 py-1.5 rounded-xl">{cartCount} منتج</span>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4 pb-36">
        {/* Summary */}
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100">
          <div className="px-5 py-3.5 border-b border-slate-50 flex justify-between items-center">
            <span className="font-black text-slate-800 text-sm">ملخص الطلب</span>
            <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-lg">{cartCount} منتج</span>
          </div>
          <div className="p-4 space-y-3">
            {cart.map(item => (
              <div key={item.product_id} className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                  {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">📦</div>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{item.product_name}</p>
                  <p className="text-xs text-slate-400">{item.unit_price} {CURRENCY} × {item.quantity}</p>
                </div>
                <p className="font-black text-amber-600 text-sm shrink-0">{item.total} {CURRENCY}</p>
              </div>
            ))}
            <div className="pt-3 border-t border-slate-50 space-y-1">
              <div className="flex justify-between text-sm text-slate-500">
                <span>المجموع</span><span>{cartSubtotal} {CURRENCY}</span>
              </div>
              {appliedDiscount && (
                <div className="flex justify-between text-sm text-emerald-600 font-bold">
                  <span>خصم ({appliedDiscount.code})</span><span>- {discountAmount} {CURRENCY}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-slate-900 text-lg pt-1 border-t border-slate-50">
                <span>الإجمالي</span>
                <span>{cartTotal} <span className="text-sm text-slate-400">{CURRENCY}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 space-y-3">
          <h3 className="font-black text-slate-800 text-sm">بياناتك الشخصية</h3>
          {[{ icon: User, ph: "الاسم الكامل *", key: "name", type: "text", dir: "rtl" },
            { icon: Phone, ph: "رقم الجوال *", key: "phone", type: "tel", dir: "ltr" },
            { icon: MapPin, ph: "المدينة", key: "city", type: "text", dir: "rtl" }].map(({ icon: Icon, ph, key, type, dir }) => (
            <div key={key} className="relative">
              <Icon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input type={type} dir={dir} placeholder={ph} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                className="w-full pr-10 pl-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white transition-all placeholder:text-slate-300 text-slate-800" />
            </div>
          ))}
          <div className="relative">
            <FileText className="absolute right-3.5 top-3.5 w-4 h-4 text-slate-300" />
            <textarea placeholder="ملاحظات (اختياري)..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              rows={2} className="w-full pr-10 pl-4 py-3.5 rounded-2xl border border-slate-200 bg-slate-50 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white transition-all placeholder:text-slate-300 text-slate-800" />
          </div>

          {/* Location */}
          {locationUrl ? (
            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-2xl">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              <p className="text-blue-700 font-bold text-sm flex-1">تم تحديد موقعك ✓</p>
              <button onClick={() => setLocationUrl("")} className="text-xs text-slate-400 underline">إزالة</button>
            </div>
          ) : (
            <button onClick={handleGetLocation} disabled={gettingLocation}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all text-right">
              <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                {gettingLocation ? <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> : <Navigation className="w-5 h-5 text-slate-400" />}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-700">{gettingLocation ? "جاري تحديد الموقع..." : "تحديد موقعي على الخريطة"}</p>
                <p className="text-xs text-slate-400">اختياري · لتسهيل التوصيل</p>
              </div>
            </button>
          )}
        </div>

        {/* Discount Code */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 text-sm mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-amber-500" />كود الخصم</h3>
          {appliedDiscount ? (
            <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="flex-1">
                <p className="text-emerald-700 font-black text-sm">{appliedDiscount.code}</p>
                <p className="text-emerald-600 text-xs">وفّرت {discountAmount} {CURRENCY}</p>
              </div>
              <button onClick={() => { setAppliedDiscount(null); setDiscountCode(""); }} className="text-xs text-slate-400 underline">إزالة</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input value={discountCode} onChange={e => setDiscountCode(e.target.value.toUpperCase())}
                placeholder="أدخل كود الخصم..."
                className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 focus:bg-white transition-all placeholder:text-slate-300 text-slate-800 font-mono" />
              <button onClick={handleApplyDiscount} disabled={checkingCode || !discountCode.trim()}
                className="px-4 py-3 rounded-2xl font-black text-sm text-white disabled:opacity-50 transition-all active:scale-95"
                style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
                {checkingCode ? "..." : "تطبيق"}
              </button>
            </div>
          )}
        </div>

        {/* Payment */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
          <h3 className="font-black text-slate-800 text-sm mb-3">طريقة الدفع</h3>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => {
              const sel = paymentMethod === id;
              return (
                <button key={id} onClick={() => setPaymentMethod(id)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${sel ? "border-amber-400 bg-amber-50" : "border-slate-200 bg-slate-50 hover:border-slate-300"}`}>
                  {sel && <div className="absolute top-2 left-2 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-white rounded-full" /></div>}
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${sel ? "text-white shadow-lg shadow-amber-200" : "bg-slate-200 text-slate-500"}`}
                    style={sel ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)" } : {}}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`font-black text-xs text-center leading-tight ${sel ? "text-amber-800" : "text-slate-700"}`}>{label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {paymentMethod === "transfer" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-3">
                <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
                  <p className="text-amber-400 text-xs font-black mb-3 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5" />بيانات الحساب</p>
                  {[["الاسم", BANK_INFO.name, "rtl"], ["IBAN", BANK_INFO.iban, "ltr"], ["العملة", BANK_INFO.currency, "rtl"]].map(([label, val, d]) => (
                    <div key={label} className="flex justify-between items-center py-1.5 border-b border-white/5 last:border-0">
                      <span className="text-slate-500 text-xs">{label}</span>
                      <span className={`font-bold text-xs ${label === "IBAN" ? "text-amber-400 font-mono text-white" : "text-white"}`} dir={d}>{val}</span>
                    </div>
                  ))}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleReceiptUpload(e.target.files[0])} />
                {receiptUrl ? (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0"><img src={receiptUrl} className="w-full h-full object-cover" /></div>
                    <div>
                      <p className="text-emerald-700 font-black text-sm">✓ تم رفع الإيصال</p>
                      <button onClick={() => { setReceiptUrl(""); if (fileInputRef.current) fileInputRef.current.value = ""; }} className="text-xs text-slate-400 underline">إزالة</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => fileInputRef.current.click()} disabled={uploadingReceipt}
                    className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-dashed border-slate-200 hover:border-amber-300 hover:bg-amber-50/30 transition-all text-right">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                      {uploadingReceipt ? <div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> : <Camera className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-700">{uploadingReceipt ? "جاري الرفع..." : "إرفاق إيصال التحويل"}</p>
                      <p className="text-xs text-slate-400">اختياري · اضغط لرفع صورة</p>
                    </div>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100">
        <button onClick={handleSubmit} disabled={submitting}
          className="w-full max-w-lg mx-auto py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 disabled:opacity-60 active:scale-[0.98] transition-all shadow-xl block text-white"
          style={{ background: "linear-gradient(135deg,#25D366,#128C7E)" }}>
          {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <MessageCircle className="w-5 h-5" />}
          {submitting ? "جاري الإرسال..." : "تأكيد الطلب عبر واتساب"}
        </button>
      </div>
    </div>
  );

  // ── CART STEP ────────────────────────────────────────────────────────────────
  if (step === STEP_CART) return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-100 px-4 py-3.5 flex items-center gap-3 shadow-sm">
        <button onClick={() => setStep(STEP_MENU)} className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-600" />
        </button>
        <div className="flex-1">
          <h1 className="font-black text-slate-900 text-base">سلة الطلب</h1>
          <p className="text-xs text-slate-400">{cartCount} منتج · {cartTotal} {CURRENCY}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-40">
        <AnimatePresence>
          {cart.map(item => (
            <motion.div key={item.product_id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -60, height: 0, margin: 0, padding: 0 }}
              className="bg-white rounded-3xl p-4 flex items-center gap-4 shadow-sm border border-slate-100">
              <div className="w-20 h-20 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                {item.image_url ? <img src={item.image_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-sm mb-1">{item.product_name}</p>
                <p className="text-xs text-slate-400 mb-3">{item.unit_price} {CURRENCY} / قطعة</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateQty(item.product_id, -1)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                    <Minus className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                  <span className="font-black text-slate-900 text-sm w-7 text-center">{item.quantity}</span>
                  <button onClick={() => updateQty(item.product_id, 1)} className="w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                    style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
                    <Plus className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <div className="text-right">
                  <p className="font-black text-slate-900 text-lg leading-none">{item.total}</p>
                  <p className="text-xs text-amber-500 font-bold">{CURRENCY}</p>
                </div>
                <button onClick={() => removeFromCart(item.product_id)} className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors mt-1">
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {cart.length === 0 && (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-slate-100">
              <ShoppingCart className="w-12 h-12 text-slate-200" />
            </div>
            <p className="font-black text-slate-700 text-lg mb-1">سلتك فارغة</p>
            <p className="text-slate-400 text-sm mb-5">ابدأ بإضافة منتجات</p>
            <button onClick={() => setStep(STEP_MENU)} className="font-black text-amber-600 text-sm underline underline-offset-4">تصفح المنتجات</button>
          </div>
        )}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-xl border-t border-slate-100 shadow-2xl">
          <div className="max-w-lg mx-auto space-y-3">
            <div className="flex justify-between items-center px-1">
              <span className="text-slate-500 text-sm font-semibold">الإجمالي</span>
              <span className="font-black text-slate-900 text-2xl">{cartTotal} <span className="text-sm text-slate-400">{CURRENCY}</span></span>
            </div>
            <button onClick={() => setStep(STEP_INFO)}
              className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-xl text-white"
              style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
              متابعة لإتمام الطلب <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── MAIN MENU ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" dir="rtl" style={{ background: "#f1f5f9" }}>

      <div className="relative overflow-hidden" style={{ background: "linear-gradient(160deg,#0b1120 0%,#1a2744 100%)" }}>
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-[0.08]"
          style={{ background: "radial-gradient(circle,#f59e0b,transparent)" }} />
        <div className="absolute -bottom-16 -left-16 w-60 h-60 rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle,#818cf8,transparent)" }} />

        <div className="relative px-5 pt-12 pb-4">
          <div className="flex items-center justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20"
                style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
                <Sparkles style={{ width: 22, height: 22 }} className="text-white" />
              </div>
              <div>
                <p className="text-white font-black text-lg leading-tight tracking-tight">منتجات لمحة تك</p>
                <p className="text-amber-400/60 text-[11px] font-semibold">{BRANCH_FLAG} {BRANCH_LABEL}</p>
              </div>
            </div>

            <AnimatePresence>
              {cart.length > 0 && (
                <motion.button initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                  onClick={() => setStep(STEP_CART)}
                  className="relative flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black text-slate-900 text-sm active:scale-95 transition-all shadow-xl shadow-amber-500/30"
                  style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
                  <ShoppingCart className="w-4 h-4" />
                  <span>{cartTotal} {CURRENCY}</span>
                  <motion.span key={cartCount} initial={{ scale: 1.5 }} animate={{ scale: 1 }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-white text-amber-600 text-[10px] font-black rounded-full flex items-center justify-center shadow border-2 border-amber-300">
                    {cartCount}
                  </motion.span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          <div className="mb-5">
            <h2 className="text-white/90 text-2xl font-black mb-1">تسوّق الآن 🛍️</h2>
            <div className="flex items-center gap-3 text-white/30 text-xs">
              <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />{products.length} منتج</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-amber-400" fill="#fbbf24" />جودة مضمونة</span>
              <span>·</span>
              <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" />توصيل سريع</span>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث عن منتج..."
              className="w-full pr-11 pl-10 py-3.5 rounded-2xl text-sm focus:outline-none text-white placeholder:text-white/25 transition-all"
              style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.08)" }} />
            {search && (
              <button onClick={() => setSearch("")} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex gap-2 px-5 pb-5 pt-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
            {["all", ...categories].map(cat => {
              const active = activeCategory === cat;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)}
                  className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${active ? "text-slate-900 shadow-lg shadow-amber-500/20" : "text-white/50 hover:text-white/80"}`}
                  style={active ? { background: "linear-gradient(135deg,#fbbf24,#f59e0b)" } : { background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.07)" }}>
                  {cat === "all" ? "✦ الكل" : cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-4 pt-5 pb-36">
        {loadingProducts ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden animate-pulse border border-slate-100">
                <div className="aspect-square bg-slate-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-slate-100 rounded-xl w-3/4" />
                  <div className="h-3 bg-slate-50 rounded-xl w-1/2" />
                  <div className="h-9 bg-slate-100 rounded-xl mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-slate-100">
              <Package className="w-10 h-10 text-slate-200" />
            </div>
            <p className="font-black text-slate-700 text-lg mb-1">لا توجد نتائج</p>
            <p className="text-slate-400 text-sm">جرّب تغيير الفئة أو كلمة البحث</p>
            {search && <button onClick={() => setSearch("")} className="mt-4 text-amber-600 font-bold text-sm underline underline-offset-4">مسح البحث</button>}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((product, idx) => {
              const cartItem = cart.find(i => i.product_id === product.id);
              const price = product[PRICE_KEY] || 0;
              const stock = product[STOCK_KEY] || 0;
              const outOfStock = stock === 0;
              const lowStock = stock > 0 && stock <= 3;

              return (
                <motion.div key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.4), duration: 0.35 }}
                  className={`bg-white rounded-3xl overflow-hidden border border-slate-100 transition-all duration-300 group flex flex-col ${!outOfStock ? "hover:shadow-2xl hover:-translate-y-1.5 hover:border-slate-200" : "opacity-60"}`}
                >
                  <div className="aspect-square bg-slate-50 relative overflow-hidden">
                    {product.image_url ? (
                      <img src={product.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={product.name} loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <Package className="w-10 h-10 text-slate-200" />
                      </div>
                    )}
                    {product.image_url && <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />}
                    {outOfStock && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                        <span className="bg-black/60 text-white text-xs font-black px-3 py-1.5 rounded-xl">نفد المخزون</span>
                      </div>
                    )}
                    {lowStock && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-xl shadow-lg shadow-red-500/40">آخر {stock}</span>
                      </div>
                    )}
                    {cartItem && !outOfStock && (
                      <motion.div key={cartItem.quantity} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
                        className="absolute top-2.5 left-2.5 w-6 h-6 rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-lg"
                        style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
                        {cartItem.quantity}
                      </motion.div>
                    )}
                  </div>

                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2 mb-1">{product.name}</h3>
                    {product.description && <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">{product.description}</p>}
                    {product.category && (
                      <span className="self-start text-[9px] font-black text-amber-700 bg-amber-50 border border-amber-100/80 px-2 py-0.5 rounded-lg mb-3">
                        {product.category}
                      </span>
                    )}
                    <div className="flex items-center justify-between mt-auto gap-2">
                      <div>
                        <span className="font-black text-slate-900 text-base leading-none">{price}</span>
                        <span className="text-xs text-slate-400 font-bold mr-0.5">{CURRENCY}</span>
                      </div>
                      {outOfStock ? (
                        <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2.5 py-1.5 rounded-xl">نفد</span>
                      ) : cartItem ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(product.id, -1)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                            <Minus className="w-3 h-3 text-slate-600" />
                          </button>
                          <span className="font-black text-slate-900 text-sm w-6 text-center">{cartItem.quantity}</span>
                          <button onClick={() => updateQty(product.id, 1)} className="w-8 h-8 rounded-xl flex items-center justify-center shadow-md shadow-amber-200"
                            style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)" }}>
                            <Plus className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)}
                          className="w-9 h-9 rounded-2xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-slate-900/20"
                          style={{ background: "linear-gradient(135deg,#1e293b,#0f172a)" }}>
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 22 }}
            className="fixed bottom-0 left-0 right-0 px-4 pb-6 pt-2"
            style={{ background: "linear-gradient(to top,rgba(241,245,249,1) 65%,transparent)" }}>
            <button onClick={() => setStep(STEP_CART)}
              className="w-full max-w-lg mx-auto py-4 rounded-3xl font-black text-base flex items-center justify-between px-5 active:scale-[0.97] transition-all shadow-2xl shadow-slate-900/25 block"
              style={{ background: "linear-gradient(135deg,#0f172a,#1e293b)" }}>
              <span className="bg-white/10 text-white/70 text-sm font-bold px-2.5 py-1 rounded-xl">{cartCount}</span>
              <span className="flex items-center gap-2 text-white">
                <ShoppingBag className="w-5 h-5" />
                عرض السلة
              </span>
              <span className="font-black text-amber-400 text-base">{cartTotal} {CURRENCY}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}