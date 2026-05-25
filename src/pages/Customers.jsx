const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import CustomerForm from "@/components/customers/CustomerForm";
import CustomerCard from "@/components/customers/CustomerCard";
import CustomerDetail from "@/components/customers/CustomerDetail";
import ReminderDialog from "@/components/customers/ReminderDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Customers() {
  const qc = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [reminding, setReminding] = useState(null);
  const [search, setSearch] = useState("");
  const [branch, setBranch] = useState("all");

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => db.entities.Customer.list("-created_date", 500),
  });

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: () => db.entities.Sale.list("-sale_date", 1000),
  });

  const createMut = useMutation({
    mutationFn: (data) => db.entities.Customer.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setFormOpen(false);
      toast.success("تمت إضافة العميل");
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }) => db.entities.Customer.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setFormOpen(false);
      setEditing(null);
      toast.success("تم حفظ التعديلات");
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id) => db.entities.Customer.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      setDeleting(null);
      toast.success("تم حذف العميل");
    },
  });

  const handleSubmit = (data) => {
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const filtered = customers.filter((c) => {
    if (branch !== "all" && c.branch !== branch) return false;
    if (search && !(c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.phone?.includes(search) || c.city?.toLowerCase().includes(search.toLowerCase())))
      return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="العملاء"
        subtitle="قاعدة بيانات كاملة للعملاء مع صور التركيب"
        action={
          <Button
            onClick={() => { setEditing(null); setFormOpen(true); }}
            className="bg-gold hover:bg-gold-dark text-white gap-2"
          >
            <Plus className="w-4 h-4" /> عميل جديد
          </Button>
        }
      />

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، الجوال، أو المدينة..."
            className="pr-10"
          />
        </div>
        <Tabs value={branch} onValueChange={setBranch}>
          <TabsList>
            <TabsTrigger value="all">الكل</TabsTrigger>
            <TabsTrigger value="saudi">🇸🇦 السعودية</TabsTrigger>
            <TabsTrigger value="turkey">🇹🇷 تركيا</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search || branch !== "all" ? "لا توجد نتائج" : "لا يوجد عملاء بعد"}
          description="ابدأ بإضافة أول عميل"
          action={
            !search && branch === "all" && (
              <Button
                onClick={() => { setEditing(null); setFormOpen(true); }}
                className="bg-gold hover:bg-gold-dark text-white gap-2"
              >
                <Plus className="w-4 h-4" /> إضافة عميل
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              sales={sales}
              onEdit={(cust) => { setEditing(cust); setFormOpen(true); }}
              onDelete={setDeleting}
              onView={setViewing}
              onReminder={setReminding}
            />
          ))}
        </div>
      )}

      <CustomerForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) setEditing(null); }}
        customer={editing}
        onSubmit={handleSubmit}
      />

      <CustomerDetail
        customer={viewing}
        sales={sales}
        open={!!viewing}
        onOpenChange={(v) => !v && setViewing(null)}
      />

      <ReminderDialog
        open={!!reminding}
        onOpenChange={(v) => !v && setReminding(null)}
        customer={reminding}
      />

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف العميل؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف "{deleting?.name}" نهائيًا.
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