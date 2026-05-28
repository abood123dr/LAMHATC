import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import base44, { Product, Sale, Category } from "@/api/base44Client";
import { Plus, Search, Package, FolderPlus, ImagePlus, Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ProductForm from "@/components/products/ProductForm";
import ProductCard from "@/components/products/ProductCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const emptyCategoryDraft = { name: "", description: "", image_url: "", sort_order: 0 };

const isMissingCategoryTableError = (error) => {
  const message = error?.message || "";
  return message.includes("schema cache") || message.includes("Could not find the table") || (message.includes("relation") && message.includes("categories"));
};

export default function Products() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState(emptyCategoryDraft);
  const [editingCategory, setEditingCategory] = useState(null);
  const [uploadingCategoryImage, setUploadingCategoryImage] = useState(false);
  const [sessionCategories, setSessionCategories] = useState([]);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => Product.list('-created_at', 500),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: () => Sale.list('-created_at', 1000),
  });

  const { data: categoryRecords = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: () => Category.list('sort_order', 500),
  });

  const salesByProduct = useMemo(() => {
    const map = {};
    sales.forEach((s) => {
      if (!s.product_id) return;
      if (!map[s.product_id]) map[s.product_id] = { saudi: 0, turkey: 0 };
      map[s.product_id][s.branch] = (map[s.product_id][s.branch] || 0) + (s.quantity || 1);
    });
    return map;
  }, [sales]);

  const createMut = useMutation({
    mutationFn: (data) => Product.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setFormOpen(false); toast.success("تمت إضافة المنتج"); },
    onError: (e) => toast.error("خطأ: " + e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => Product.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setFormOpen(false); setEditing(null); toast.success("تم حفظ التعديلات"); },
    onError: (e) => toast.error("خطأ: " + e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => Product.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["products"] }); setDeleting(null); toast.success("تم حذف المنتج"); },
    onError: (e) => toast.error("خطأ: " + e.message),
  });

  const categoryMut = useMutation({
    mutationFn: async (data) => {
      if (editingCategory?.id) {
        return { ...(await Category.update(editingCategory.id, data)), persisted: true };
      }

      try {
        return { ...(await Category.create(data)), persisted: true };
      } catch (error) {
        if (!isMissingCategoryTableError(error)) throw error;
        return { ...data, id: editingCategory?.id || null, sessionOnly: true };
      }
    },
    onSuccess: (savedCategory) => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      setSessionCategories((items) => {
        const next = items.filter((item) => item.name !== savedCategory.name && item.name !== editingCategory?.name);
        return [...next, savedCategory];
      });
      setActiveCategory(savedCategory.name);
      setShowAddCategory(false);
      setEditingCategory(null);
      setNewCategoryInput("");
      setCategoryDraft(emptyCategoryDraft);

      if (savedCategory.sessionOnly) {
        setEditing({ category: savedCategory.name });
        setFormOpen(true);
        toast.success("تم تجهيز القسم. أضف منتجًا له ليظهر مباشرة في الكتالوج.");
      } else {
        toast.success("تم حفظ القسم");
      }
    },
    onError: (e) => toast.error("خطأ في حفظ القسم: " + e.message),
  });

  const handleSubmit = (data) => {
    if (editing?.id) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const productCategoryNames = useMemo(() => [...new Set(products.map((p) => p.category?.trim()).filter(Boolean))].sort(), [products]);
  const allCategoryNames = useMemo(
    () => [...new Set([
      ...productCategoryNames,
      ...categoryRecords.map((category) => category.name?.trim()).filter(Boolean),
      ...sessionCategories.map((category) => category.name?.trim()).filter(Boolean),
    ])].sort((a, b) => a.localeCompare(b)),
    [categoryRecords, productCategoryNames, sessionCategories]
  );

  const categoryCards = useMemo(() => {
    const map = new Map();
    productCategoryNames.forEach((name) => {
      const firstProduct = products.find((p) => p.category === name && p.image_url);
      map.set(name, {
        name,
        description: "",
        image_url: firstProduct?.image_url || "",
        count: products.filter((p) => p.category === name).length,
        source: "products",
      });
    });
    categoryRecords.forEach((cat) => {
      if (cat.is_active === false) return;
      map.set(cat.name, {
        ...map.get(cat.name),
        ...cat,
        count: products.filter((p) => p.category === cat.name).length,
        source: "categories",
      });
    });
    sessionCategories.forEach((cat) => {
      map.set(cat.name, {
        ...map.get(cat.name),
        ...cat,
        count: products.filter((p) => p.category === cat.name).length,
        source: cat.sessionOnly ? "session" : cat.source || "categories",
      });
    });
    return Array.from(map.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0) || a.name.localeCompare(b.name));
  }, [categoryRecords, productCategoryNames, products, sessionCategories]);

  const handleAddCategory = () => {
    const name = (categoryDraft.name || newCategoryInput).trim();
    if (!name) return;
    categoryMut.mutate({
      ...categoryDraft,
      name,
      sort_order: Number(categoryDraft.sort_order) || categoryCards.length + 1,
      is_active: true,
    });
  };

  const resetCategoryEditor = () => {
    setShowAddCategory(false);
    setEditingCategory(null);
    setNewCategoryInput("");
    setCategoryDraft(emptyCategoryDraft);
  };

  const openProductForm = (category = "") => {
    setEditing(category ? { category } : null);
    setFormOpen(true);
  };

  const editCategory = (cat) => {
    setEditingCategory(cat);
    setCategoryDraft({
      name: cat.name || "",
      description: cat.description || "",
      image_url: cat.image_url || "",
      sort_order: cat.sort_order || 0,
    });
    setNewCategoryInput(cat.name || "");
    setShowAddCategory(true);
  };

  const handleCategoryImage = async (file) => {
    if (!file) return;
    setUploadingCategoryImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCategoryDraft((draft) => ({ ...draft, image_url: file_url }));
    } catch (e) {
      toast.error("تعذر رفع صورة القسم");
    } finally {
      setUploadingCategoryImage(false);
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.code?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === "all" || p.category === activeCategory;
    return matchSearch && matchCategory;
  });
  const selectedCategory = activeCategory === "all" ? null : categoryCards.find((cat) => cat.name === activeCategory);

  return (
    <div>
      <PageHeader
        title="المنتجات والمخزون"
        subtitle="إدارة مستقلة لمخزون وأسعار كل فرع"
        action={<Button onClick={() => openProductForm()} className="bg-gold hover:bg-gold-dark text-white gap-2"><Plus className="w-4 h-4" /> منتج جديد</Button>}
      />
      <div className="mb-4 relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث باسم المنتج، الكود، أو الفئة..." className="pr-10" />
      </div>
      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-luxe">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h2 className="font-black text-foreground">إدارة أقسام المنيو</h2>
            <p className="text-sm text-muted-foreground">أنشئ أقسام مصورة تظهر للعميل في صفحة الطلب.</p>
          </div>
          <Button onClick={() => { setShowAddCategory(true); setEditingCategory(null); setCategoryDraft({ ...emptyCategoryDraft, sort_order: categoryCards.length + 1 }); }} className="bg-gold hover:bg-gold-dark text-white gap-2">
            <FolderPlus className="w-4 h-4" /> قسم جديد
          </Button>
        </div>

        {showAddCategory && (
          <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-border bg-background p-3 md:grid-cols-[120px_1fr_auto]">
            <label className="h-28 rounded-xl border-2 border-dashed border-border bg-muted/50 flex items-center justify-center overflow-hidden cursor-pointer">
              {categoryDraft.image_url ? (
                <img src={categoryDraft.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImagePlus className="w-6 h-6 mx-auto mb-1" />
                  <span className="text-xs">{uploadingCategoryImage ? "جاري الرفع..." : "صورة القسم"}</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleCategoryImage(e.target.files?.[0])} />
            </label>
            <div className="space-y-2">
              <Input value={categoryDraft.name || newCategoryInput} onChange={(e) => { setCategoryDraft({ ...categoryDraft, name: e.target.value }); setNewCategoryInput(e.target.value); }} placeholder="اسم القسم" />
              <Input value={categoryDraft.description || ""} onChange={(e) => setCategoryDraft({ ...categoryDraft, description: e.target.value })} placeholder="وصف مختصر يظهر في المنيو" />
            </div>
            <div className="flex gap-2 md:flex-col">
              <Button onClick={handleAddCategory} disabled={categoryMut.isPending} className="bg-gold hover:bg-gold-dark text-white">
                {editingCategory ? "حفظ" : "إضافة"}
              </Button>
              <Button type="button" variant="outline" onClick={resetCategoryEditor}>
                إلغاء
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {categoryCards.map((cat) => (
            <button key={cat.name} onClick={() => setActiveCategory(cat.name)} className={`group overflow-hidden rounded-xl border text-right transition-all ${activeCategory === cat.name ? "border-gold ring-2 ring-gold/20" : "border-border hover:border-gold/60"}`}>
              <div className="aspect-[5/2] bg-muted overflow-hidden">
                {cat.image_url ? <img src={cat.image_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-muted-foreground/40" /></div>}
              </div>
              <div className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-sm text-foreground">{cat.name}</p>
                  <span onClick={(e) => { e.stopPropagation(); editCategory(cat); }} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{cat.description || `${cat.count} منتج`}</p>
                {cat.count === 0 && (
                  <span className="mt-2 inline-flex text-xs font-bold text-gold">أضف منتجًا لهذا القسم</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button onClick={() => setActiveCategory("all")} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activeCategory === "all" ? "bg-foreground text-background border-foreground shadow-sm" : "bg-card text-muted-foreground border-border hover:border-foreground/30"}`}>
          ✦ الكل <span className="mr-1 text-xs opacity-70">({products.length})</span>
        </button>
        {allCategoryNames.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${activeCategory === cat ? "bg-foreground text-background border-foreground shadow-sm" : "bg-card text-muted-foreground border-border hover:border-foreground/30"}`}>
            {cat} <span className="mr-1 text-xs opacity-70">({products.filter((p) => p.category === cat).length})</span>
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "لا توجد نتائج" : selectedCategory ? `لا توجد منتجات في ${selectedCategory.name}` : "لا توجد منتجات بعد"}
          description={selectedCategory ? "أضف أول منتج لهذا القسم وسيظهر مباشرة في الكتالوج العام." : "ابدأ بإضافة أول منتج لإدارة المخزون في كلا الفرعين"}
          action={<Button onClick={() => openProductForm(selectedCategory?.name || "")} className="bg-gold hover:bg-gold-dark text-white gap-2"><Plus className="w-4 h-4" /> إضافة منتج</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p) => <ProductCard key={p.id} product={p} onEdit={(x) => { setEditing(x); setFormOpen(true); }} onDelete={setDeleting} salesByProduct={salesByProduct} />)}
        </div>
      )}
      <ProductForm open={formOpen} onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }} product={editing} onSubmit={handleSubmit} categoryOptions={allCategoryNames} />
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>حذف المنتج؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف "{deleting?.name}" نهائيًا.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => deleting && deleteMut.mutate(deleting.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
