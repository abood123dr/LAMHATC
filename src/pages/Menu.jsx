import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Banknote,
  BellRing,
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
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2,
  User,
  X,
  Zap,
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

const PRODUCT_TIMEOUT_MS = 4500;
const CATEGORY_TIMEOUT_MS = 2200;

const getInitialBranch = () => {
  const branch = new URLSearchParams(window.location.search).get("branch");
  return branch === "turkey" ? "turkey" : "saudi";
};

const formatMoney = (value, currency) => `${Number(value || 0).toLocaleString("ar-SA")} ${currency}`;

const getProductCategory = (product) => product.category?.trim() || "";

const withTimeout = (promise, timeoutMs = PRODUCT_TIMEOUT_MS) =>
  Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => reject(new Error("timeout")), timeoutMs);
    }),
  ]);

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
  const [loadError, setLoadError] = useState("");
  const [slowLoading, setSlowLoading] = useState(false);
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
  const [orderSaveStatus, setOrderSaveStatus] = useState("saved");
  const [whatsappLink, setWhatsappLink] = useState("");
  const fileInputRef = useRef(null);
  const loadRequestRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("branch", branch);
    window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
  }, [branch]);

  const loadCatalog = useCallback(async ({ silent = false } = {}) => {
    const requestId = loadRequestRef.current + 1;
    loadRequestRef.current = requestId;
    if (!silent) setLoading(true);
    setSlowLoading(false);
    setLoadError("");

    const slowTimer = window.setTimeout(() => {
      if (!silent && loadRequestRef.current === requestId) setSlowLoading(true);
    }, 900);

    try {
      const productData = await withTimeout(db.entities.Product.list("-created_at", 500), PRODUCT_TIMEOUT_MS);
      if (loadRequestRef.current !== requestId) return;
      window.clearTimeout(slowTimer);
      setSlowLoading(false);
      setProducts(productData || []);
      if (!silent) setLoading(false);

      try {
        const categoryData = db.entities.Category?.list
          ? await withTimeout(db.entities.Category.list("sort_order", 500), CATEGORY_TIMEOUT_MS)
          : [];
        if (loadRequestRef.current !== requestId) return;
        setCategoryRecords(categoryData || []);
      } catch {
        // Keep products visible even if category metadata is unavailable.
      }
    } catch (error) {
      if (loadRequestRef.current !== requestId) return;
      if (!silent) {
        setProducts([]);
        setCategoryRecords([]);
        setLoadError(error.message === "timeout" ? "استغرق تحميل الكتالوج وقتًا أطول من المتوقع." : "تعذر تحميل الكتالوج الآن.");
      }
    } finally {
      window.clearTimeout(slowTimer);
      if (loadRequestRef.current === requestId) {
        setSlowLoading(false);
        if (!silent) setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadCatalog();

    let unsubscribe = () => {};
    try {
      unsubscribe = db.entities.Product.subscribe?.((event) => {
        if (event.type === "create") setProducts((items) => [event.data, ...items]);
        if (event.type === "update") setProducts((items) => items.map((item) => item.id === event.id ? event.data : item));
        if (event.type === "delete") setProducts((items) => items.filter((item) => item.id !== event.id));
      }) || (() => {});
    } catch (error) {
      unsubscribe = () => {};
    }

    return () => {
      loadRequestRef.current += 1;
      unsubscribe();
    };
  }, [loadCatalog]);

  useEffect(() => {
    const refresh = () => loadCatalog({ silent: true });
    const refreshOnFocus = () => {
      if (!document.hidden) loadCatalog({ silent: true });
    };
    const refreshOnStorage = (event) => {
      if (event.key === "lamhatc_catalog_refresh") loadCatalog({ silent: true });
    };
    const refreshTimer = window.setInterval(refresh, 30000);

    window.addEventListener("focus", refreshOnFocus);
    window.addEventListener("storage", refreshOnStorage);
    window.addEventListener("lamhatc:catalog-refresh", refresh);
    document.addEventListener("visibilitychange", refreshOnFocus);

    return () => {
      window.clearInterval(refreshTimer);
      window.removeEventListener("focus", refreshOnFocus);
      window.removeEventListener("storage", refreshOnStorage);
      window.removeEventListener("lamhatc:catalog-refresh", refresh);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, [loadCatalog]);

  const categories = useMemo(() => {
    const names = [...new Set(products.map(getProductCategory).filter(Boolean))];
    const map = new Map();

    names.forEach((name) => {
      const categoryProducts = products.filter((product) => getProductCategory(product) === name);
      const firstProductImage = categoryProducts.find((product) => product.image_url)?.image_url;
      map.set(name, {
        name,
        image_url: firstProductImage || "",
        description: "",
        sort_order: 999,
        count: categoryProducts.length,
      });
    });

    categoryRecords.forEach((category) => {
      if (category.is_active === false) return;
      map.set(category.name, {
        ...map.get(category.name),
        ...category,
        count: products.filter((product) => getProductCategory(product) === category.name).length,
      });
    });

    return [...map.values()].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
  }, [categoryRecords, products]);

  const categoryImageByName = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      map.set(category.name, category.image_url || "");
    });
    return map;
  }, [categories]);

  const getProductDisplayImage = useCallback(
    (product) => product.image_url || categoryImageByName.get(getProductCategory(product)) || "",
    [categoryImageByName]
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return products.filter((product) => {
      const category = getProductCategory(product);
      if (activeCategory !== "all" && category !== activeCategory) return false;
      if (!normalizedSearch) return true;
      return [product.name, product.description, product.code, category]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  }, [activeCategory, products, search]);

  const availableCount = useMemo(
    () => products.filter((product) => Number(product[meta.stockKey] || 0) > 0).length,
    [meta.stockKey, products]
  );

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
      try {
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
      } catch (error) {
        console.warn("Customer auto-save failed; continuing with order details.", error);
      }

      const orderPayload = {
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
      };

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

      let orderSaved = false;
      try {
        await db.entities.Order.create(orderPayload);
        orderSaved = true;
      } catch (error) {
        console.warn("Order database save failed; continuing with WhatsApp handoff.", error);
        try {
          window.localStorage.setItem("lamhatc_pending_order", JSON.stringify({
            ...orderPayload,
            saved_at: new Date().toISOString(),
            save_error: error?.message || "Unknown order save error",
          }));
        } catch (storageError) {
          console.warn("Pending order local backup failed.", storageError);
        }
      }

      if (appliedDiscount && orderSaved) {
        try {
          await db.entities.DiscountCode.update(appliedDiscount.id, {
            used_count: Number(appliedDiscount.used_count || 0) + 1,
          });
        } catch (error) {
          console.warn("Discount usage update failed; continuing with order.", error);
        }
      }

      setOrderSaveStatus(orderSaved ? "saved" : "whatsapp");
      const whatsappUrl = `https://wa.me/${STORE_WHATSAPP[branch]}?text=${encodeURIComponent(whatsappText)}`;
      setWhatsappLink(whatsappUrl);
      const openedWindow = window.open(whatsappUrl, "_blank");
      if (!openedWindow) {
        toast.info("إذا لم تفتح واتساب تلقائيًا، استخدم زر واتساب بعد تأكيد الطلب.");
      }
      toast.success(orderSaved ? "تم إرسال الطلب" : "تم تجهيز الطلب على واتساب");
      setStep("success");
    } catch (error) {
      console.error("Order submit failed.", error);
      toast.error("تعذر تجهيز الطلب، تأكد من البيانات وحاول مرة أخرى");
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
    setOrderSaveStatus("saved");
    setWhatsappLink("");
  };

  if (step === "success") {
    return (
      <main className="min-h-screen bg-[#f6f7f2] px-4 py-8 text-slate-950" dir="rtl">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-md flex-col items-center justify-center text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <h1 className="text-3xl font-black">{orderSaveStatus === "saved" ? "تم إرسال طلبك" : "تم تجهيز طلبك"}</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            {orderSaveStatus === "saved"
              ? "وصل الطلب للنظام، وفتحنا رسالة واتساب جاهزة للمتجر لمتابعة الطلب بسرعة."
              : "فتحنا رسالة واتساب جاهزة للمتجر. أرسل الرسالة ليصل الطلب فورًا، ثم راجع إعدادات Supabase لحفظه داخل لوحة الطلبات."}
          </p>
          {whatsappLink && (
            <a href={whatsappLink} target="_blank" rel="noreferrer" className="mt-6 flex h-12 w-full items-center justify-center rounded-lg bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700">
              فتح واتساب
            </a>
          )}
          <button onClick={resetOrder} className="mt-3 h-12 w-full rounded-lg bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800">
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
    <main className="min-h-screen overflow-x-hidden bg-[#f7f9fb] text-slate-950" dir="rtl">
      <section className="relative border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 py-5 lg:grid-cols-[1fr_300px] lg:items-center lg:px-6">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="order-1 min-w-0 overflow-hidden text-right">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-black text-amber-800">
                <ShoppingBag className="h-4 w-4" /> كتالوج الطلب
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
                <BellRing className="h-4 w-4" /> يصل للمتجر مباشرة
              </span>
            </div>
            <h1 className="max-w-full break-words text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
              منتجات لمحاتك
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              اختر المنتجات المتاحة من نفس مخزون لوحة التحكم، ثم أرسل الطلب ببيانات واضحة للمتجر.
            </p>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:max-w-lg">
              <StatPill icon={Package} label="منتجات" value={products.length} />
              <StatPill icon={ShieldCheck} label="متاح" value={availableCount} tone="emerald" />
              <StatPill icon={Zap} label="أقسام" value={categories.length} tone="amber" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.45, delay: 0.12 }} className="order-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="mb-2 text-sm font-black">اختر الفرع</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(BRANCH_META).map(([key, item]) => (
                <button
                  key={key}
                  onClick={() => {
                    playTapSound();
                    setBranch(key);
                    setCart([]);
                    setActiveCategory("all");
                  }}
                  className={`min-h-16 rounded-lg border p-3 text-right transition duration-200 hover:-translate-y-0.5 ${
                    branch === key
                      ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/15"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  <span className="text-xl">{item.flag}</span>
                  <p className="mt-1 text-sm font-black">{item.label}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="sticky top-0 z-20 border-b border-slate-200 bg-[#f7f9fb]/92 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 lg:px-6">
          <label className="relative block">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث عن منتج أو قسم..."
              className="h-12 w-full rounded-lg border border-slate-200 bg-white px-10 text-sm outline-none transition focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
            />
            {search && (
              <button onClick={() => { playTapSound(); setSearch(""); }} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <X className="h-4 w-4" />
              </button>
            )}
          </label>

          <div className="hide-scrollbar flex gap-3 overflow-x-auto pb-1">
            {[{ name: "all", image_url: "", count: products.length }, ...categories].map((category) => (
              <CategoryButton
                key={category.name}
                category={category}
                active={activeCategory === category.name}
                onClick={() => {
                  playTapSound();
                  setActiveCategory(category.name);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-5 pb-28 lg:px-6">
        {loading ? (
          <CatalogLoadingGrid slowLoading={slowLoading} />
        ) : filteredProducts.length === 0 ? (
          <CatalogEmpty
            hasError={!!loadError}
            message={loadError}
            isSearching={!!search || activeCategory !== "all"}
            onRetry={loadCatalog}
          />
        ) : (
          <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((product, index) => {
              const item = cart.find((cartItem) => cartItem.product_id === product.id);
              return (
                <ProductTile
                  key={product.id}
                  product={product}
                  index={index}
                  meta={meta}
                  item={item}
                  image={getProductDisplayImage(product)}
                  onAdd={addToCart}
                  onQty={updateQty}
                />
              );
            })}
          </motion.div>
        )}
      </section>

      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div initial={{ y: 88, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 88, opacity: 0 }} className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur">
            <button onClick={() => { playTapSound(); setStep("cart"); }} className="mx-auto flex h-14 w-full max-w-2xl items-center justify-between rounded-lg bg-slate-950 px-4 text-white shadow-xl shadow-slate-950/20 transition hover:-translate-y-0.5">
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

function StatPill({ icon: Icon, label, value, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-700",
    emerald: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-800",
  };

  return (
    <div className={`rounded-lg px-3 py-2 ${tones[tone]}`}>
      <div className="flex items-center gap-1.5 text-[11px] font-bold">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <p className="mt-1 text-lg font-black leading-none">{Number(value || 0).toLocaleString("ar-SA")}</p>
    </div>
  );
}

function CategoryButton({ category, active, onClick }) {
  const image = category.image_url || "";

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.97 }}
      className={`relative grid min-w-[168px] grid-cols-[54px_1fr] items-center gap-2 rounded-lg border p-2 text-right transition ${
        active ? "border-slate-950 bg-white shadow-sm" : "border-slate-200 bg-white/80 hover:border-slate-400"
      }`}
    >
      <span className="h-12 w-12 overflow-hidden rounded-lg bg-slate-100">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-slate-400">
            <Package className="h-5 w-5" />
          </span>
        )}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-xs font-black">{category.name === "all" ? "الكل" : category.name}</span>
        <span className="text-[11px] font-semibold text-slate-400">{category.count || 0} منتج</span>
      </span>
      {active && <span className="absolute inset-x-4 -bottom-px h-0.5 rounded-full bg-amber-500" />}
    </motion.button>
  );
}

function CatalogLoadingGrid({ slowLoading }) {
  return (
    <div>
      {slowLoading && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
          جاري تحميل الكتالوج، إذا استمر الانتظار اضغط إعادة المحاولة.
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="catalog-skeleton h-48" />
            <div className="space-y-3 p-4">
              <div className="catalog-skeleton h-4 w-3/4 rounded" />
              <div className="catalog-skeleton h-3 w-11/12 rounded" />
              <div className="flex items-center justify-between pt-2">
                <div className="catalog-skeleton h-7 w-20 rounded" />
                <div className="catalog-skeleton h-9 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CatalogEmpty({ hasError, message, isSearching, onRetry }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
        {hasError ? <RefreshIcon /> : <Package className="h-7 w-7" />}
      </div>
      <h2 className="mt-4 text-xl font-black text-slate-950">
        {hasError ? "تعذر تحميل الكتالوج" : isSearching ? "لا توجد نتائج مطابقة" : "الكتالوج قيد التحديث"}
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-500">
        {hasError ? message : isSearching ? "جرّب تغيير كلمة البحث أو اختر قسمًا آخر." : "أضف منتجات وصور من لوحة التحكم وستظهر هنا مباشرة للعملاء."}
      </p>
      <button onClick={onRetry} className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-black text-white transition hover:-translate-y-0.5">
        <RefreshIcon className="h-4 w-4" />
        إعادة المحاولة
      </button>
    </motion.div>
  );
}

function RefreshIcon(props) {
  return <Sparkles {...props} />;
}

function ProductTile({ product, index, meta, item, image, onAdd, onQty }) {
  const price = Number(product[meta.priceKey] || 0);
  const stock = Number(product[meta.stockKey] || 0);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.035, 0.28), duration: 0.35 }}
      whileHover={{ y: -5 }}
      className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl hover:shadow-slate-950/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {image ? (
          <img src={image} alt={product.name || ""} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50 text-slate-300">
            <Package className="h-12 w-12" strokeWidth={1.5} />
          </div>
        )}
        {image && <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/65 to-transparent" />}
        {stock <= 0 && <div className="absolute inset-0 flex items-center justify-center bg-slate-950/55 text-sm font-black text-white">غير متوفر</div>}
        {getProductCategory(product) && <span className="absolute right-3 top-3 max-w-[80%] truncate rounded-full bg-white/92 px-3 py-1 text-xs font-black text-slate-700 shadow-sm">{getProductCategory(product)}</span>}
        <span className={`absolute bottom-3 right-3 rounded-lg bg-white px-3 py-1.5 text-sm font-black text-slate-950 shadow-sm ${!image ? "border border-slate-200" : ""}`}>
          {formatMoney(price, meta.currency)}
        </span>
      </div>
      <div className="p-4">
        <div className="min-h-[74px]">
          <h2 className="line-clamp-2 text-base font-black leading-6 text-slate-950">{product.name}</h2>
          {product.description ? (
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{product.description}</p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-slate-400">جاهز للطلب من الكتالوج.</p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${stock <= 0 ? "bg-red-50 text-red-600" : stock <= 3 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
            {stock <= 0 ? "نفد المخزون" : stock <= 3 ? `آخر ${stock}` : "متوفر الآن"}
          </span>
          {item ? (
            <div className="flex items-center gap-2">
              <button onClick={() => onQty(product.id, -1)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 transition hover:bg-slate-200">
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-7 text-center text-sm font-black">{item.quantity}</span>
              <button onClick={() => onQty(product.id, 1)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white transition hover:bg-slate-800">
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button onClick={() => onAdd(product)} disabled={stock <= 0} className="flex h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-xs font-black text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:bg-slate-300">
              <Plus className="h-4 w-4" /> إضافة
            </button>
          )}
        </div>
      </div>
    </motion.article>
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
