const db = globalThis.__B44_DB__ || { auth:{ isAuthenticated: async()=>false, me: async()=>null }, entities:new Proxy({}, { get:()=>({ filter:async()=>[], get:async()=>null, create:async()=>({}), update:async()=>({}), delete:async()=>({}) }) }), integrations:{ Core:{ UploadFile:async()=>({ file_url:'' }) } } };

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Images, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import BranchBadge from "@/components/shared/BranchBadge";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Gallery() {
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [lightbox, setLightbox] = useState(null);

  const { data: sales = [] } = useQuery({
    queryKey: ["sales"],
    queryFn: () => db.entities.Sale.list("-sale_date", 1000),
  });

  // Flatten all images
  const allImages = sales
    .filter((s) => s.installation_images?.length > 0)
    .filter((s) => branch === "all" || s.branch === branch)
    .filter((s) =>
      !search ||
      s.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      s.product_name?.toLowerCase().includes(search.toLowerCase())
    )
    .flatMap((s) =>
      s.installation_images.map((url, idx) => ({
        url,
        key: `${s.id}-${idx}`,
        customer: s.customer_name || "بدون اسم",
        product: s.product_name,
        date: s.sale_date,
        branch: s.branch,
      }))
    );

  return (
    <div>
      <PageHeader
        title="معرض صور العملاء"
        subtitle="صور التركيب والطلبات المنفذة"
      />

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم العميل أو المنتج..."
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

      {allImages.length === 0 ? (
        <EmptyState
          icon={Images}
          title="لا توجد صور بعد"
          description="أضف صور التركيب عند تسجيل عمليات البيع لتظهر هنا"
        />
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {allImages.length} صورة
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {allImages.map((img) => (
              <div
                key={img.key}
                onClick={() => setLightbox(img)}
                className="group relative aspect-square rounded-xl overflow-hidden border border-border shadow-sm cursor-pointer hover:shadow-luxe-lg transition-all"
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                  <p className="text-xs font-bold text-white truncate">{img.customer}</p>
                  <p className="text-[10px] text-white/80 truncate">{img.product}</p>
                </div>
                <div className="absolute top-2 right-2">
                  <BranchBadge branch={img.branch} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 animate-fade-up"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="max-w-5xl max-h-[90vh] flex flex-col items-center gap-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.url}
              alt=""
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
            />
            <div className="bg-black/60 backdrop-blur-xl text-white px-6 py-3 rounded-xl text-center">
              <p className="font-bold">{lightbox.customer}</p>
              <p className="text-sm text-white/70">
                {lightbox.product}
                {lightbox.date && ` · ${format(new Date(lightbox.date), "d MMM yyyy", { locale: ar })}`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}