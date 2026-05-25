const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Plus, Search, Package, FolderPlus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import ProductForm from "@/components/products/ProductForm";
import ProductCard from "@/components/products/ProductCard";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Products() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [showAddCategory, setShowAddCategory] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => db.entities.Product.list("-created_date", 500),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: () => db.entities.Sale.list("-created_date", 1000),
  });

  const salesByProduct = React.useMemo(() => {
    const map = {};
    sales.forEach((s) => {
      if (!s.product_id) return;
      if (!map[s.product_id]) map[s.product_id] = { saudi: 0, turkey: 0 };
      map[s.product_id][s.branch] = (map[s.product_id][s.branch] || 0) + (s.quantity || 1);
    });
    return map;
  }, [sales]);

  const createMut = useMutation({
    mutationFn: (data) => db.entities.Product.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setFormOpen(false);
      toast.success("تمت إضافة المنتج");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.Product.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setFormOpen(false);
      setEditing(null);
      toast.success("تم حفظ التعديلات");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => db.entities.Product.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      setDeleting(null);
      toast.success("تم حذف المنتج");
    },
  });

  const handleSubmit = (data) => {
    if (editing) {
      updateMut.mutate({ id: editing.id, data });
    } else {
      createMut.mutate(data);
    }
  };

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setFormOpen(true);
  };

  const categories = useMemo(() => {
    const cats = [...new Set(products.map((p) => p.category).filter(Boolean))];
    return cats.sort();
  }, [products]);

  const handleAddCategory = () => {
    const cat = newCategoryInput.trim();
    if (!cat) return;
    // Just set active to the new category — it will appear once a product uses it
    setActiveCategory(cat);
    setNewCategoryInput("");
    setShowAddCategory(false);
    // Open form with this category pre-filled
    setEditing({ category: cat });
    setFormOpen(true);
    toast.success(`تم إنشاء مجموعة "${cat}" — أضف منتجاً لها`);
  };

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.code?.toLowerCase().includes(search.toLowerCase()) ||
      p.category?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      activeCategory === "all" || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div>
      <PageHeader
        title="المنتجات والمخزون"
        subtitle="إدارة مستقلة لمخزون وأسعار كل فرع"
        action={
          <Button onClick={openNew} className="bg-gold hover:bg-gold-dark text-white gap-2">
            <Plus className="w-4 h-4" /> منتج جديد
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-4 relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث باسم المنتج، الكود، أو الفئة..."
          className="pr-10"
        />
      </div>

      {/* Category Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveCategory("all")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
              activeCategory === "all"
                ? "bg-foreground text-background border-foreground shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-foreground/30"
            }`}
          >
            ✦ الكل <span className="mr-1 text-xs opacity-70">({products.length})</span>
          </button>

          {categories.map((cat) => {
            const count = products.filter((p) => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${
                  activeCategory === cat
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:border-foreground/30"
                }`}
              >
                {cat} <span className="mr-1 text-xs opacity-70">({count})</span>
              </button>
            );
          })}

          {/* Add Category */}
          {showAddCategory ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") setShowAddCategory(false); }}
                placeholder="اسم المجموعة..."
                className="px-3 py-2 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring w-40"
              />
              <Button size="sm" onClick={handleAddCategory} className="bg-gold hover:bg-gold-dark text-white">إضافة</Button>
              <button onClick={() => { setShowAddCategory(false); setNewCategoryInput(""); }} className="p-1.5 rounded-lg hover:bg-accent">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddCategory(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold border border-dashed border-border text-muted-foreground hover:border-gold hover:text-gold transition-all"
            >
              <FolderPlus className="w-4 h-4" />
              مجموعة جديدة
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={search ? "لا توجد نتائج" : "لا توجد منتجات بعد"}
          description="ابدأ بإضافة أول منتج لإدارة المخزون في كلا الفرعين"
          action={
            !search && (
              <Button onClick={openNew} className="bg-gold hover:bg-gold-dark text-white gap-2">
                <Plus className="w-4 h-4" /> إضافة منتج
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onEdit={openEdit}
              onDelete={setDeleting}
              salesByProduct={salesByProduct}
            />
          ))}
        </div>
      )}

      <ProductForm
        open={formOpen}
        onOpenChange={(v) => {
          setFormOpen(v);
          if (!v) setEditing(null);
        }}
        product={editing}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المنتج؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف "{deleting?.name}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && deleteMut.mutate(deleting.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}