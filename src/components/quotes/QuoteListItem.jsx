import React from "react";
import { FileText, Receipt, Eye, Trash2, ChevronLeft } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import BranchBadge from "@/components/shared/BranchBadge";
import { formatCurrency } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_CONFIG = {
  draft:    { label: "مسودة",   color: "bg-gray-100 text-gray-600" },
  sent:     { label: "مُرسل",   color: "bg-blue-100 text-blue-700" },
  approved: { label: "مقبول",   color: "bg-emerald-100 text-emerald-700" },
  rejected: { label: "مرفوض",  color: "bg-red-100 text-red-700" },
  paid:     { label: "مدفوع",   color: "bg-gold/15 text-gold-dark" },
};

const QUOTE_STATUSES = ["draft", "sent", "approved", "rejected"];
const INVOICE_STATUSES = ["draft", "sent", "paid"];

export default function QuoteListItem({ quote, onPreview, onDelete, onStatusChange }) {
  const isInvoice = quote.type === "invoice";
  const status = STATUS_CONFIG[quote.status] || STATUS_CONFIG.draft;
  const statuses = isInvoice ? INVOICE_STATUSES : QUOTE_STATUSES;

  return (
    <div className="bg-card border border-border rounded-2xl shadow-luxe hover:shadow-luxe-lg transition-all">
      <div className="flex items-center gap-4 p-4">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isInvoice ? "bg-gold/10" : "bg-blue-50"}`}>
          {isInvoice
            ? <Receipt className="w-6 h-6 text-gold" />
            : <FileText className="w-6 h-6 text-blue-500" />}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-sm text-foreground" dir="ltr">{quote.number}</span>
            <BranchBadge branch={quote.branch} size="sm" />
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${status.color}`}>
              {status.label}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5 truncate">{quote.customer_name}</p>
          {quote.issue_date && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {format(new Date(quote.issue_date), "d MMMM yyyy", { locale: ar })}
              {quote.valid_until && ` · صالح حتى ${format(new Date(quote.valid_until), "d MMMM", { locale: ar })}`}
            </p>
          )}
        </div>

        {/* Amount */}
        <div className="text-left shrink-0 hidden sm:block">
          <p className="font-bold text-gold text-lg">
            {formatCurrency(quote.total, quote.branch)}
          </p>
          <p className="text-xs text-muted-foreground">{quote.items?.length || 0} بند</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Select value={quote.status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-8 text-xs w-28 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{STATUS_CONFIG[s]?.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={onPreview}
            className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive flex items-center justify-center text-muted-foreground"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}