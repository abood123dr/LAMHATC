import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Minus,
  Navigation,
  Package,
  Phone,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import base44 from "@/api/base44Client";

const db = globalThis.__B44_DB__ || base44;

const STORE_WHATSAPP = {
  saudi: "905010099997",
  turkey: "905010099997",
};

const BRANCH_META = {
  saudi: {
    label: "السعودية",
    flag: "🇸🇦",
    currency: "ر.س",
    priceKey: "saudi_price",
    stockKey: "saudi_stock",
    accent: "emerald",
  },
  turkey: {
    label: "تركيا",
    flag: "🇹🇷",
    currency: "₺",
    priceKey: "turkey_price",
    stockKey: "turkey_stock",
    accent: "rose",
  },
};

const PAYMENT_METHODS = [
  { id: "cod", label: "الدفع عند الاستلام", icon: Banknote, caption: "تدفع عند وصول الطلب" },
  { id: "transfer", label: "تحويل بنكي", icon: CreditCard, caption: "ارفع إيصال التحويل اختياريًا" },
];

const BANK_INFO = {
  name: "VAFAA ALAGHBAR",
  iban: "TR980020500009881402200003",
  currency: "TL",
};

const getInitialBranch = () => {
  const branch = new URLSearchParams(window.location.search).get("branch");
  return branch === "turkey" ? "turkey" : "saudi";
};

const formatMoney = (value, currency) => `${Number(value || 0).toLocaleString("ar-SA")} ${currency}`;

function playTapSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = 520;
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.11);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (error) {
    // Interaction sounds are optional and can be blocked by the browser.
  }
}

export default function Menu() {
  const [branch, setBranch] = useState(getInitialBranch);
  const meta = BRANCH_META[branch];
  const [products, setProducts] = useState([]);
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState("menu");
  const [form, setForm] = useState({ name: "", phone: "", city: "", notes: "" });
  const [locationUrl, setLocationUrl] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploadingReceipt, setUploadingReceipt] = useState(false);
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("branch", branch);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [branch]);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      db.entities.Product.list("-created_at", 500),
      db.entities.Category?.list ? db.entities.Category.list("sort_order", 500) : Promise.resolve([]),
    ])
      .then(([productData, categoryData]) => {
        if (!mounted) return;
        setProducts(productData || []);
        setCategoryRecords(categoryData || []);
      })
      .finally(() => mounted && setLoading(false));

    const unsubscribe = db.entities.Product.subscribe?.((event) => {
      if (event.type === "create") setProducts((items) => [event.data, ...items]);
      if (event.type === "update") setProducts((items) => items.map((item) => item.id === event.id ? event.data : item));
      if (event.type === "delete") setProducts((items) => items.filter((item) => item.id !== event.id));
    }) || (() => {});

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const categories = useMemo(() => {
    const names = [...new Set(products.map((product) => product.category).filter(Boolean))];
    const map = new Map();

    names.forEach((name) => {
      const firstProductImage = products.find((product) => product.category === name && product.image_url)?.image_url;
      map.set(name, {
        name,
        image_url: firstProductImage || "",
        description: "",
        sort_order: 999,
        count: products.filter((product) => product.category === name).length,
      });
    });

    categoryRecords.forEach((category) => {
      if (category.is_active === false) return;
      map.set(category.name, {
        ...map.get(category.name),
        ...category,
        count: products.filter((product) => product.category === category.name).length,
      });
    });

    return [...map.values()].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
  }, [categoryRecords, products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      if (activeCategory !== "all" && product.category !== activeCategory) return false;
      if (!normalizedSearch) return true;
      return [product.name, product.description, product.code, product.category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [activeCategory, products, search]);

  const cartSubtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = appliedDiscount
    ? appliedDiscount.discount_type === "percentage"
      ? Math.round(cartSubtotal * Number(appliedDiscount.discount_value || 0) / 100)
      : Number(appliedDiscount.discount_value || 0)
    : 0;
  const cartTotal = Math.max(0, cartSubtotal - discountAmount);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const addToCart = (product) => {
    const price = Number(product[meta.priceKey] || 0);
    const stock = Number(product[meta.stockKey] || 0);
    if (stock <= 0) {
      toast.error("المنتج غير متوفر حاليًا");
      return;
    }

    playTapSound();
    setCart((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= stock) {
          toast.error("لا يوجد مخزون إضافي لهذا المنتج");
          return current;
        }
        return current.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.unit_price }
            : item
        );
      }
      return [
        ...current,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: price,
          total: price,
          image_url: product.image_url,
          max_stock: stock,
        },
      ];
    });
  };

  const updateQty = (productId, delta) => {
    playTapSound();
    setCart((current) =>
      current
        .map((item) => {
          if (item.product_id !== productId) return item;
          const nextQuantity = item.quantity + delta;
          if (nextQuantity <= 0) return null;
          if (nextQuantity > item.max_stock) {
            toast.error("الكمية المطلوبة أكبر من المخزون");
            return item;
          }
          return { ...item, quantity: nextQuantity, total: nextQuantity * item.unit_price };
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    playTapSound();
    setCart((current) => current.filter((item) => item.product_id !== productId));
  };

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;
    setCheckingCode(true);
    try {
      const codes = await db.entities.DiscountCode.filter({ code: discountCode.trim().toUpperCase() });
      const code = codes?.[0];
      if (!code) {
        toast.error("كود الخصم غير صحيح");
        return;
      }
      if (!code.is_active) {
        toast.error("كود الخصم غير مفعل");
        return;
      }
      if (code.expiry_date && new Date(code.expiry_date) < new Date()) {
        toast.error("انتهت صلاحية كود الخصم");
        return;
      }
      if (code.max_uses && code.used_count >= code.max_uses) {
        toast.error("تم استهلاك كود الخصم");
        return;
      }
      if (code.branch !== "both" && code.branch !== branch) {
        toast.error("هذا الكود غير متاح لهذا الفرع");
        return;
      }
      setAppliedDiscount(code);
      toast.success("تم تطبيق الخصم");
    } catch (error) {
      toast.error("تعذر التحقق من كود الخصم");
    } finally {
      setCheckingCode(false);
    }
  };

  const handleReceiptUpload = async (file) => {
    if (!file) return;
    setUploadingReceipt(true);
    try {
      const { file_url } = await db.integrations.Core.UploadFile({ file });
      setReceiptUrl(file_url);
      toast.success("تم رفع الإيصال");
    } catch (error) {
      toast.error("تعذر رفع الإيصال");
    } finally {
      setUploadingReceipt(false);
    }
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationUrl(`https://maps.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`);
        setGettingLocation(false);
        toast.success("تم تحديد الموقع");
      },
      () => {
        setGettingLocation(false);
        toast.error("تعذر تحديد الموقع");
      }
    );
  };

  const submitOrder = async () => {
    if (!cart.length) {
      toast.error("السلة فارغة");
      return;
    }
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error("أدخل الاسم ورقم الجوال لإتمام الطلب");
      return;
    }

    setSubmitting(true);
    try {
      let customerId = null;
      const phone = form.phone.trim();
      const existingCustomers = await db.entities.Customer.filter({ phone, branch });
      if (existingCustomers?.length) {
        customerId = existingCustomers[0].id;
      } else {
        const createdCustomer = await db.entities.Customer.create({
          name: form.name.trim(),
          phone,
          city: form.city.trim(),
          branch,
          notes: "تم إنشاؤه تلقائيًا من الكتالوج العام",
        });
        customerId = createdCustomer.id;
      }

      if (appliedDiscount) {
        await db.entities.DiscountCode.update(appliedDiscount.id, {
          used_count: Number(appliedDiscount.used_count || 0) + 1,
        });
      }

      await db.entities.Order.create({
        customer_name: form.name.trim(),
        customer_phone: phone,
        customer_city: form.city.trim(),
        branch,
        items: cart.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
        total_amount: cartTotal,
        status: "new",
        notes: [
          `طريقة الدفع: ${paymentMethod === "cod" ? "الدفع عند الاستلام" : "تحويل بنكي"}`,
          receiptUrl ? `إيصال التحويل: ${receiptUrl}` : "",
          appliedDiscount ? `كود الخصم: ${appliedDiscount.code} - خصم ${formatMoney(discountAmount, meta.currency)}` : "",
          locationUrl ? `موقع العميل: ${locationUrl}` : "",
          form.notes.trim(),
        ].filter(Boolean).join("\n"),
        customer_id: customerId,
        customer_location_url: locationUrl || null,
      });

      const itemsText = cart.map((item) => `• ${item.product_name} × ${item.quantity} = ${formatMoney(item.total, meta.currency)}`).join("\n");
      const whatsappText = [
        "طلب جديد من كتالوج لمحاتك",
        "",
        `الفرع: ${meta.flag} ${meta.label}`,
        `العميل: ${form.name.trim()}`,
        `الجوال: ${phone}`,
        `المدينة: ${form.city.trim() || "-"}`,
        "",
        "المنتجات:",
        itemsText,
        "",
        `المجموع: ${formatMoney(cartSubtotal, meta.currency)}`,
        appliedDiscount ? `الخصم: -${formatMoney(discountAmount, meta.currency)} (${appliedDiscount.code})` : "",
        `الإجمالي: ${formatMoney(cartTotal, meta.currency)}`,
        `الدفع: ${paymentMethod === "cod" ? "الدفع عند الاستلام" : "تحويل بنكي"}`,
        receiptUrl ? `الإيصال: ${receiptUrl}` : "",
        locationUrl ? `الموقع: ${locationUrl}` : "",
        form.notes.trim() ? `ملاحظات: ${form.notes.trim()}` : "",
      ].filter(Boolean).join("\n");

      window.open(`https://wa.me/${STORE_WHATSAPP[branch]}?text=${encodeURIComponent(whatsappText)}`, "_blank");
      setStep("success");
    } catch (error) {
      toast.error("تعذر إرسال الطلب، حاول مرة أخرى");
    } finally {
      setSubmitting(false);
    }
  };

  const resetOrder = () => {
    setCart([]);
    setStep("menu");
    setForm({ name: "", phone: "", city: "", notes: "" });
    setLocationUrl("");
    setPaymentMethod("cod");
    setReceiptUrl("");
    setDiscountCode("");
    setAppliedDiscount(null);
  };

  if (step === "success") {
    return (
      <main className="min-h-screen bg-[#f6f7f2] px-4 py-8 text-slate-950" dir="rtl">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black">تم إرسال طلبك</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            وصل الطلب للنظام، وفتحنا رسالة واتساب جاهزة للمتجر لمتابعة الطلب بسرعة.
          </p>
          <button onClick={resetOrder} className="mt-8 h-12 w-full rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800">
            الرجوع للكتالوج
          </button>
        </div>
      </main>
    );
  }

  if (step === "cart" || step === "checkout") {
    return (
      <main className="min-h-screen bg-[#f6f7f2] text-slate-950" dir="rtl">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/92 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-5xl items-center gap-3">
            <button onClick={() => setStep("menu")} className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-500">{meta.flag} {meta.label}</p>
              <h1 className="text-lg font-black">{step === "cart" ? "مراجعة الطلب" : "إتمام الطلب"}</h1>
            </div>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">{cartCount} منتج</span>
          </div>
        </header>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[1fr_380px]">
          <section className="space-y-3">
            {cart.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
                <ShoppingCart className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-black">السلة فارغة</p>
              </div>
            ) : (
              cart.map((item) => (
                <article key={item.product_id} className="grid grid-cols-[76px_1fr] gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-[92px_1fr_auto]">
                  <div className="h-20 overflow-hidden rounded-lg bg-slate-100 sm:h-24">
                    {item.image_url ? <img src={item.image_url} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="mx-auto mt-7 h-7 w-7 text-slate-300" />}
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-sm font-black sm:text-base">{item.product_name}</h2>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{formatMoney(item.unit_price, meta.currency)} للقطعة</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button onClick={() => updateQty(item.product_id, -1)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                      <button onClick={() => updateQty(item.product_id, 1)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                        <Plus className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeFromCart(item.product_id)} className="mr-auto flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between border-t border-slate-100 pt-3 sm:col-span-1 sm:block sm:border-t-0 sm:pt-0 sm:text-left">
                    <span className="text-xs font-bold text-slate-400 sm:hidden">الإجمالي</span>
                    <p className="font-black text-slate-950">{formatMoney(item.total, meta.currency)}</p>
                  </div>
                </article>
              ))
            )}
          </section>

          <aside className="space-y-4">
            {step === "checkout" && (
              <>
                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="mb-3 text-base font-black">بيانات العميل</h2>
                  <div className="space-y-3">
                    <Field icon={User} placeholder="الاسم الكامل" value={form.name} onChange={(value) => setForm({ ...form, name: value })} />
                    <Field icon={Phone} placeholder="رقم الجوال" value={form.phone} onChange={(value) => setForm({ ...form, phone: value })} dir="ltr" />
                    <Field icon={MapPin} placeholder="المدينة" value={form.city} onChange={(value) => setForm({ ...form, city: value })} />
                    <label className="relative block">
                      <FileText className="absolute right-3 top-3.5 h-4 w-4 text-slate-400" />
                      <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} rows={3} placeholder="ملاحظات إضافية" className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 py-3 pl-3 pr-10 text-sm outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100" />
                    </label>
                    <button onClick={getLocation} disabled={gettingLocation} className="flex w-full items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-right text-sm font-bold text-slate-700">
                      {gettingLocation ? <Loader2 className="h-5 w-5 animate-spin text-amber-600" /> : locationUrl ? <Check className="h-5 w-5 text-emerald-600" /> : <Navigation className="h-5 w-5 text-slate-500" />}
                      {locationUrl ? "تم تحديد الموقع" : "إضافة الموقع للتوصيل"}
                    </button>
                  </div>
                </section>

                <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                  <h2 className="mb-3 text-base font-black">الدفع والخصم</h2>
                  <div className="grid grid-cols-2 gap-2">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const active = paymentMethod === method.id;
                      return (
                        <button key={method.id} onClick={() => setPaymentMethod(method.id)} className={`rounded-lg border p-3 text-right transition ${active ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-slate-50 text-slate-700"}`}>
                          <Icon className="mb-2 h-5 w-5" />
                          <p className="text-xs font-black">{method.label}</p>
                          <p className={`mt-1 text-[11px] ${active ? "text-white/60" : "text-slate-400"}`}>{method.caption}</p>
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === "transfer" && (
                    <div className="mt-3 rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-black text-slate-600">بيانات التحويل</p>
                      <p className="mt-2 text-xs text-slate-500">الاسم: <span className="font-bold text-slate-900">{BANK_INFO.name}</span></p>
                      <p className="mt-1 text-xs text-slate-500">IBAN: <span className="font-mono font-bold text-slate-900" dir="ltr">{BANK_INFO.iban}</span></p>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(event) => handleReceiptUpload(event.target.files?.[0])} />
                      <button onClick={() => fileInputRef.current?.click()} className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white text-xs font-black">
                        {uploadingReceipt ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                        {receiptUrl ? "تم رفع الإيصال" : "رفع إيصال التحويل"}
                      </button>
                    </div>
                  )}

                  <div className="mt-3 flex gap-2">
                    <input value={discountCode} onChange={(event) => setDiscountCode(event.target.value.toUpperCase())} placeholder="كود الخصم" className="h-11 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-amber-500" />
                    <button onClick={applyDiscount} disabled={checkingCode} className="h-11 rounded-lg bg-amber-500 px-4 text-xs font-black text-white">
                      {checkingCode ? "..." : "تطبيق"}
                    </button>
                  </div>
                </section>
              </>
            )}

            <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-base font-black">ملخص الطلب</h2>
              <SummaryRow label="المجموع" value={formatMoney(cartSubtotal, meta.currency)} />
              {appliedDiscount && <SummaryRow label={`خصم ${appliedDiscount.code}`} value={`- ${formatMoney(discountAmount, meta.currency)}`} tone="success" />}
              <div className="my-3 border-t border-slate-100" />
              <SummaryRow label="الإجمالي" value={formatMoney(cartTotal, meta.currency)} strong />
              {step === "cart" ? (
                <button onClick={() => setStep("checkout")} disabled={!cart.length} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 text-sm font-black text-white disabled:bg-slate-300">
                  متابعة الطلب <ArrowLeft className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={submitOrder} disabled={submitting || !cart.length} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-black text-white disabled:bg-slate-300">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShoppingBag className="h-4 w-4" />}
                  تأكيد الطلب
                </button>
              )}
            </section>
          </aside>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2] text-slate-950" dir="rtl">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[1fr_360px] lg:px-6">
          <div className="flex flex-col justify-center">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800">
                <Sparkles className="h-4 w-4" /> كتالوج عام للطلب المباشر
              </span>
              <span className="inline-flex rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                {meta.flag} فرع {meta.label}
              </span>
            </div>
            <h1 className="max-w-3xl text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
              كتالوج لمحاتك
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              اختر المنتجات المناسبة، أضف بياناتك، وسيصل الطلب مباشرة للنظام مع إشعار للإدارة.
            </p>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="mb-3 text-sm font-black">اختر الفرع</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BRANCH_META).map(([key, item]) => (
                <button key={key} onClick={() => { setBranch(key); setCart([]); setActiveCategory("all"); }} className={`rounded-lg border p-3 text-right transition ${branch === key ? "border-slate-950 bg-slate-950 text-white" : "border-slate-200 bg-white text-slate-700"}`}>
                  <span className="text-xl">{item.flag}</span>
                  <p className="mt-1 text-sm font-black">{item.label}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-slate-200 bg-[#f6f7f2]/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 lg:px-6">
          <label className="relative block">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن منتج أو قسم..." className="h-12 w-full rounded-lg border border-slate-200 bg-white px-10 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100" />
            {search && (
              <button onClick={() => setSearch("")} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>

          {categories.length > 0 && (
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
              {[{ name: "all", image_url: "", count: products.length }, ...categories].map((category) => {
                const active = activeCategory === category.name;
                return (
                  <button key={category.name} onClick={() => setActiveCategory(category.name)} className={`grid min-w-[120px] grid-cols-[42px_1fr] items-center gap-2 rounded-lg border p-2 text-right transition ${active ? "border-slate-950 bg-white shadow-sm" : "border-slate-200 bg-white/70"}`}>
                    <span className="h-10 w-10 overflow-hidden rounded-md bg-slate-100">
                      {category.image_url ? <img src={category.image_url} alt="" className="h-full w-full object-cover" /> : <Package className="mx-auto mt-2.5 h-5 w-5 text-slate-400" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-black">{category.name === "all" ? "الكل" : category.name}</span>
                      <span className="text-[11px] font-semibold text-slate-400">{category.count || 0} منتج</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-5 pb-28 lg:px-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="h-72 animate-pulse rounded-lg bg-white" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-10 text-center">
            <Package className="mx-auto h-10 w-10 text-slate-300" />
            <h2 className="mt-4 text-lg font-black">لا توجد منتجات متاحة</h2>
            <p className="mt-2 text-sm text-slate-500">جرّب فرعًا آخر أو غيّر كلمة البحث.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product, index) => {
              const price = Number(product[meta.priceKey] || 0);
              const stock = Number(product[meta.stockKey] || 0);
              const item = cart.find((cartItem) => cartItem.product_id === product.id);
              return (
                <motion.article key={product.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.25) }} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="relative aspect-[4/3] bg-slate-100">
                    {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" loading="lazy" /> : <div className="flex h-full items-center justify-center"><ImageIcon className="h-10 w-10 text-slate-300" /></div>}
                    {stock <= 0 && <div className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-black text-white">غير متوفر</div>}
                    {product.category && <span className="absolute right-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-slate-700">{product.category}</span>}
                  </div>
                  <div className="p-4">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="line-clamp-2 text-base font-black">{product.name}</h2>
                        {product.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{product.description}</p>}
                      </div>
                      <p className="shrink-0 text-left text-base font-black text-slate-950">{formatMoney(price, meta.currency)}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stock <= 0 ? "bg-red-50 text-red-600" : stock <= 3 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
                        {stock <= 0 ? "نفد المخزون" : stock <= 3 ? `آخر ${stock}` : "متوفر"}
                      </span>
                      {item ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(product.id, -1)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center text-sm font-black">{item.quantity}</span>
                          <button onClick={() => updateQty(product.id, 1)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => addToCart(product)} disabled={stock <= 0} className="flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-black text-white disabled:bg-slate-300">
                          <Plus className="h-4 w-4" /> إضافة
                        </button>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </section>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }} className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
            <button onClick={() => setStep("cart")} className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between rounded-lg bg-slate-950 px-4 text-white shadow-xl">
              <span className="rounded-full bg-white/12 px-3 py-1 text-xs font-black">{cartCount}</span>
              <span className="flex items-center gap-2 text-sm font-black"><ShoppingCart className="h-5 w-5" /> عرض الطلب</span>
              <span className="text-sm font-black text-amber-300">{formatMoney(cartTotal, meta.currency)}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

function Field({ icon: Icon, placeholder, value, onChange, dir = "rtl" }) {
  return (
    <label className="relative block">
      <Icon className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input dir={dir} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pl-3 pr-10 text-sm outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-100" />
    </label>
  );
}

function SummaryRow({ label, value, strong = false, tone }) {
  return (
    <div className={`flex items-center justify-between py-1 ${strong ? "text-lg font-black" : "text-sm font-bold"} ${tone === "success" ? "text-emerald-600" : "text-slate-700"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
