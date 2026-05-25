import React from "react";
import { Package, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

export default function ProductCard({ product, onEdit, onDelete, salesByProduct = {} }) {
  const saudiSold = salesByProduct[product.id]?.saudi || 0;
  const turkeySold = salesByProduct[product.id]?.turkey || 0;

  const lowSaudi = product.saudi_stock > 0 && product.saudi_stock <= 3;
  const lowTurkey = product.turkey_stock > 0 && product.turkey_stock <= 3;
  const outSaudi = product.saudi_stock === 0;
  const outTurkey = product.turkey_stock === 0;

  return (
    <div className="group bg-card border border-border rounded-2xl overflow-hidden shadow-luxe hover:shadow-luxe-lg transition-all duration-300">
      {/* Image */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/40" strokeWidth={1} />
          </div>
        )}
        {product.category && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-xs font-medium text-foreground">
            {product.category}
          </span>
        )}

        {/* Hover actions */}
        <div className="absolute top-3 left-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(product)}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center hover:bg-white text-foreground shadow-sm"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(product)}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center hover:bg-destructive hover:text-white text-foreground shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="font-bold text-foreground truncate">{product.name}</h3>
        {product.code && (
          <p className="text-xs text-muted-foreground mt-0.5">{product.code}</p>
        )}

        {/* Branches stocks */}
        <div className="mt-4 space-y-2">
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
    </div>
  );
}

function BranchRow({ flag, label, stock, price, sold, accent, low, out }) {
  const accents = {
    emerald: "bg-emerald-50 border-emerald-100",
    rose: "bg-rose-50 border-rose-100",
  };

  return (
    <div className={cn("rounded-lg border p-2.5", accents[accent])}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold flex items-center gap-1">
          {flag} {label}
        </span>
        <span className="text-sm font-black text-gold">{price}</span>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground">المتبقي:</span>
          <span className={cn(
            "font-bold",
            out && "text-destructive",
            low && "text-amber-600",
            !out && !low && "text-foreground"
          )}>
            {formatNumber(stock)}
          </span>
          {(low || out) && <AlertTriangle className={cn("w-3 h-3", out ? "text-destructive" : "text-amber-600")} />}
        </div>
        <span className="text-muted-foreground">
          بيع: <span className="font-bold text-foreground">{formatNumber(sold)}</span>
        </span>
      </div>
    </div>
  );
}