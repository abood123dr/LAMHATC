import React from "react";
import { Package, Pencil, Trash2, AlertTriangle, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ProductCard({ product, onEdit, onDelete, salesByProduct = {} }) {
  const saudiSold = salesByProduct[product.id]?.saudi || 0;
  const turkeySold = salesByProduct[product.id]?.turkey || 0;

  const lowSaudi = product.saudi_stock > 0 && product.saudi_stock <= 3;
  const lowTurkey = product.turkey_stock > 0 && product.turkey_stock <= 3;
  const outSaudi = product.saudi_stock === 0;
  const outTurkey = product.turkey_stock === 0;

  const totalSold = saudiSold + turkeySold;
  const hasAlert = outSaudi || outTurkey || lowSaudi || lowTurkey;

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="group bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-black/10 transition-shadow duration-300"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <Package className="w-14 h-14 text-muted-foreground/30" strokeWidth={1} />
          </div>
        )}

        {/* Gradient overlay */}
        {product.image_url && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        )}

        {/* Category badge */}
        {product.category && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 dark:bg-black/70 backdrop-blur-sm text-xs font-semibold text-foreground shadow-sm">
            {product.category}
          </span>
        )}

        {/* Alert badge */}
        {hasAlert && (
          <span className="absolute top-3 left-3 w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
            <AlertTriangle className="w-3.5 h-3.5 text-white" />
          </span>
        )}

        {/* Hover actions */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={() => onEdit(product)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur text-xs font-semibold text-foreground shadow-md hover:bg-white transition-colors"
          >
            <Pencil className="w-3 h-3" /> تعديل
          </button>
          <button
            onClick={() => onDelete(product)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/90 backdrop-blur text-xs font-semibold text-white shadow-md hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-3 h-3" /> حذف
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="min-w-0">
            <h3 className="font-bold text-base text-foreground leading-tight truncate">{product.name}</h3>
            {product.code && (
              <p className="text-xs text-muted-foreground mt-0.5">#{product.code}</p>
            )}
          </div>
          {totalSold > 0 && (
            <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/50 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <TrendingUp className="w-3 h-3" /> {formatNumber(totalSold)}
            </span>
          )}
        </div>

        {/* Branch rows */}
        <div className="space-y-2">
          <BranchRow
            flag="🇸🇦"
            label="السعودية"
            stock={product.saudi_stock}
            price={formatCurrency(product.saudi_price, "saudi")}
            sold={saudiSold}
            accent="emerald"
            low={lowSaudi}
            out={outSaudi}
          />
          <BranchRow
            flag="🇹🇷"
            label="تركيا"
            stock={product.turkey_stock}
            price={formatCurrency(product.turkey_price, "turkey")}
            sold={turkeySold}
            accent="rose"
            low={lowTurkey}
            out={outTurkey}
          />
        </div>
      </div>
    </motion.div>
  );
}

function BranchRow({ flag, label, stock, price, sold, accent, low, out }) {
  const styles = {
    emerald: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40",
    rose: "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40",
  };

  return (
    <div className={cn("rounded-xl border p-2.5 transition-colors", styles[accent])}>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold flex items-center gap-1 text-foreground/80">
          {flag} {label}
        </span>
        <span className="text-sm font-black text-gold">{price}</span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1">
          {out ? (
            <span className="flex items-center gap-1 text-destructive font-bold">
              <AlertTriangle className="w-3 h-3" /> نفد
            </span>
          ) : low ? (
            <span className="text-amber-600 font-bold">آخر {formatNumber(stock)} قطعة</span>
          ) : (
            <span className="text-muted-foreground">
              متبقي: <span className="font-bold text-foreground">{formatNumber(stock)}</span>
            </span>
          )}
        </div>
        <span className="text-muted-foreground">
          بيع: <span className="font-bold text-foreground">{formatNumber(sold)}</span>
        </span>
      </div>
    </div>
  );
}
