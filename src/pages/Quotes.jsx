import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Quote, Customer, Product } from "@/api/base44Client";
import { Plus, FileText, Receipt, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import QuoteForm from "@/components/quotes/QuoteForm";
import QuotePreview from "@/components/quotes/QuotePreview";
import QuoteListItem from "@/components/quotes/QuoteListItem";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Quotes() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState("quote");
  const [previewing, setPreviewing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("all");

  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes"],
    queryFn: () => Quote.list('-created_at', 500),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => Customer.list('-created_at', 200),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => Product.list(),
  });

  const createMut = useMutation({
    mutationFn: (data) => Quote.create(data),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      setFormOpen(false);
      toast.success(formType === "quote" ? "تم إنشاء عرض السعر" : "تم إنشاء الفاتورة");
      setPreviewing(created);
    },
    onError: (e) => toast.error("خطأ: " + e.message),
  });

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }) => Quote.update(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["quotes"] }),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => Quote.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["quotes"] }); setDeleting(null); toast.success("تم الحذف"); },
  });

  const filtered = quotes.filter((q) => {
    if (tab !== "all" && q.type !== tab) return false;
    if (search && !(q.customer_name?.toLowerCase().includes(search.toLowerCase()) || q.number?.includes(search))) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="العروض والفواتير"
        subtitle="إنشاء وإدارة عروض الأسعار والفواتير"
        action={<div className="flex gap-2"><Button onClick={() => { setFormType("quote"); setFormOpen(true); }} variant="outline" className="gap-2 border-gold/40 text-gold hover:bg-gold/10"><FileText className="w-4 h-4" /> عرض سعر</Button><Button onClick={() => { setFormType("invoice"); setFormOpen(true); }} className="bg-gold hover:bg-gold-dark text-white gap-2"><Receipt className="w-4 h-4" /> فاتورة</Button></div>}
      />
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="ابحث بالاسم أو الرقم..." className="pr-10" />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="quote">عروض الأسعار</TabsTrigger>
            <TabsTrigger value="invoice">الفواتير</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {filtered.length === 0 ? (
        <EmptyState icon={FileText} title="لا توجد مستندات بعد" description="أنشئ أول عرض سعر أو فاتورة" />
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => <QuoteListItem key={q.id} quote={q} onPreview={() => setPreviewing(q)} onDelete={() => setDeleting(q)} onStatusChange={(status) => updateStatusMut.mutate({ id: q.id, status })} />)}
        </div>
      )}
      <QuoteForm open={formOpen} onOpenChange={setFormOpen} type={formType} customers={customers} products={products} onSubmit={(data) => createMut.mutate(data)} />
      {previewing && <QuotePreview quote={previewing} open={!!previewing} onOpenChange={(v) => !v && setPreviewing(null)} />}
      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>حذف المستند؟</AlertDialogTitle><AlertDialogDescription>سيتم حذف "{deleting?.number}" نهائيًا.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction onClick={() => deleting && deleteMut.mutate(deleting.id)} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}