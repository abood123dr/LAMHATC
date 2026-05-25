import React, { useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const BRANCH_INFO = {
  saudi: {
    label: "المملكة العربية السعودية",
    currency: "ريال سعودي",
    currencySymbol: "ر.س",
    flag: "🇸🇦",
    vatLabel: "ضريبة القيمة المضافة",
    accentColor: "#10b981",
    bgLight: "#f0fdf4",
  },
  turkey: {
    label: "تركيا",
    currency: "ليرة تركية",
    currencySymbol: "₺",
    flag: "🇹🇷",
    vatLabel: "KDV",
    accentColor: "#f43f5e",
    bgLight: "#fff1f2",
  },
};

const STATUS_STYLES = {
  draft:    { label: "مسودة",  bg: "#f3f4f6", color: "#6b7280" },
  sent:     { label: "مُرسل",  bg: "#eff6ff", color: "#3b82f6" },
  approved: { label: "مقبول",  bg: "#f0fdf4", color: "#16a34a" },
  rejected: { label: "مرفوض", bg: "#fef2f2", color: "#dc2626" },
  paid:     { label: "مدفوع",  bg: "#faf6ee", color: "#b8952f" },
};

function fmt(amount, branch) {
  const info = BRANCH_INFO[branch] || BRANCH_INFO.saudi;
  return `${Number(amount || 0).toLocaleString("ar-SA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${info.currencySymbol}`;
}

function formatDateAr(dateStr) {
  if (!dateStr) return "";
  try { return format(new Date(dateStr), "d MMMM yyyy", { locale: ar }); }
  catch { return dateStr; }
}

export default function QuotePreview({ quote, open, onOpenChange }) {
  const printRef = useRef();
  const branch = BRANCH_INFO[quote?.branch] || BRANCH_INFO.saudi;
  const isInvoice = quote?.type === "invoice";
  const statusStyle = STATUS_STYLES[quote?.status] || STATUS_STYLES.draft;

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open("", "_blank");
    win.document.write(`
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8"/>
        <title>${isInvoice ? "فاتورة" : "عرض سعر"} ${quote.number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@300;400;500;700;800&display=swap');
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:'Tajawal',sans-serif; color:#111; background:#fff; direction:rtl; }
          .page { max-width:820px; margin:0 auto; padding:50px 44px; }
          img { display:inline-block; }
          @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
        </style>
      </head>
      <body><div class="page">${content}</div></body>
      </html>
    `);
    win.document.close();
    setTimeout(() => { win.print(); win.close(); }, 500);
  };

  if (!quote) return null;

  const gold = "#b8952f";
  const goldLight = "#faf6ee";
  const goldBorder = "#e8d9b0";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold`}
              style={{ background: statusStyle.bg, color: statusStyle.color }}>
              {statusStyle.label}
            </div>
            <span className="text-sm font-bold text-foreground">{isInvoice ? "فاتورة ضريبية" : "عرض سعر"}</span>
            <span className="text-xs text-muted-foreground font-mono" dir="ltr">{quote.number}</span>
          </div>
          <Button size="sm" onClick={handlePrint} className="bg-gold hover:bg-gold-dark text-white gap-2">
            <Printer className="w-3.5 h-3.5" /> طباعة / PDF
          </Button>
        </div>

        {/* Document */}
        <div className="overflow-y-auto flex-1 bg-gray-50">
          <div className="py-6 px-4">
            <div
              ref={printRef}
              dir="rtl"
              style={{
                fontFamily: "'Tajawal', sans-serif",
                maxWidth: 780,
                margin: "0 auto",
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 2px 24px rgba(0,0,0,0.07)",
                overflow: "hidden",
              }}
            >
              {/* Top color bar */}
              <div style={{ height: 6, background: `linear-gradient(90deg, ${gold}, ${branch.accentColor})` }} />

              <div style={{ padding: "36px 40px" }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
                  {/* Brand */}
                  <div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: gold, letterSpacing: "-0.5px", lineHeight: 1 }}>لمحاتك</div>
                    <div style={{ fontSize: 10, color: "#aaa", marginTop: 3, letterSpacing: "3px", textTransform: "uppercase" }}>LAMAHATK SYSTEM</div>
                    <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 6, background: branch.bgLight, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: branch.accentColor, fontWeight: 600 }}>
                      <span>{branch.flag}</span> <span>{branch.label}</span>
                    </div>
                  </div>
                  {/* Doc meta */}
                  <div style={{ textAlign: "start" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>{isInvoice ? "فاتورة ضريبية" : "عرض سعر"}</div>
                    <div style={{ fontSize: 13, color: "#999", marginTop: 4, direction: "ltr", fontFamily: "monospace" }}>{quote.number}</div>
                    <div style={{ marginTop: 8, display: "inline-block", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700, background: statusStyle.bg, color: statusStyle.color }}>
                      {statusStyle.label}
                    </div>
                  </div>
                </div>

                {/* Info cards */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
                  {/* Customer */}
                  <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 18px", borderRight: `3px solid ${gold}` }}>
                    <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>العميل</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#111", marginBottom: 6 }}>{quote.customer_name}</div>
                    {quote.customer_phone && (
                      <div style={{ fontSize: 13, color: "#555", marginBottom: 2, direction: "ltr" }}>📱 {quote.customer_phone}</div>
                    )}
                    {quote.customer_city && (
                      <div style={{ fontSize: 13, color: "#555" }}>📍 {quote.customer_city}</div>
                    )}
                  </div>
                  {/* Doc details */}
                  <div style={{ background: "#f9fafb", borderRadius: 12, padding: "16px 18px", borderRight: `3px solid ${branch.accentColor}` }}>
                    <div style={{ fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 10 }}>تفاصيل المستند</div>
                    <div style={{ fontSize: 13, color: "#444", lineHeight: 2 }}>
                      <div>📅 تاريخ الإصدار: <strong style={{ color: "#111" }}>{formatDateAr(quote.issue_date)}</strong></div>
                      {quote.valid_until && !isInvoice && (
                        <div>⏳ صالح حتى: <strong style={{ color: "#111" }}>{formatDateAr(quote.valid_until)}</strong></div>
                      )}
                      <div>💰 العملة: <strong style={{ color: "#111" }}>{branch.currency} ({branch.currencySymbol})</strong></div>
                    </div>
                  </div>
                </div>

                {/* Items table */}
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24, borderRadius: 10, overflow: "hidden" }}>
                  <thead>
                    <tr style={{ background: gold }}>
                      {["", "المنتج / الخدمة", "الكمية", "سعر الوحدة", "الإجمالي"].map((h, i) => (
                        <th key={i} style={{
                          padding: "12px 14px",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#fff",
                          textAlign: i === 0 ? "center" : i > 1 ? "center" : "right",
                          letterSpacing: "0.5px",
                        }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(quote.items || []).map((item, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom: "1px solid #f0f0f0",
                          background: idx % 2 === 0 ? "#fff" : "#fafafa",
                        }}
                      >
                        {/* Product image */}
                        <td style={{ padding: "10px 12px", width: 48, textAlign: "center" }}>
                          {item.image_url ? (
                            <img
                              src={item.image_url}
                              alt=""
                              style={{ width: 40, height: 40, borderRadius: 8, objectFit: "cover", border: "1px solid #eee" }}
                            />
                          ) : (
                            <div style={{ width: 40, height: 40, borderRadius: 8, background: goldLight, border: `1px solid ${goldBorder}`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                              📦
                            </div>
                          )}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: 14, fontWeight: 700, color: "#111" }}>
                          {item.name}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center", fontSize: 14, fontWeight: 600, color: "#333" }}>
                          {item.quantity}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center", fontSize: 13, color: "#555", direction: "ltr" }}>
                          {fmt(item.unit_price, quote.branch)}
                        </td>
                        <td style={{ padding: "10px", textAlign: "center", fontSize: 15, fontWeight: 800, color: gold, direction: "ltr" }}>
                          {fmt(item.total, quote.branch)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
                  <div style={{ width: 280, borderRadius: 12, overflow: "hidden", border: `1px solid ${goldBorder}` }}>
                    <div style={{ background: goldLight, padding: "14px 18px" }}>
                      {[
                        { label: "المجموع الفرعي", val: fmt(quote.subtotal, quote.branch), bold: false },
                        ...(quote.discount_amount > 0 ? [{ label: "خصم", val: `− ${fmt(quote.discount_amount, quote.branch)}`, red: true }] : []),
                        ...(quote.tax_percent > 0 ? [{ label: `${branch.vatLabel} (${quote.tax_percent}%)`, val: fmt(quote.tax_amount, quote.branch) }] : []),
                      ].map((r, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 13, color: r.red ? "#dc2626" : "#666" }}>
                          <span>{r.label}</span><span>{r.val}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ background: gold, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>الإجمالي النهائي</span>
                      <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", direction: "ltr" }}>{fmt(quote.total, quote.branch)}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {quote.notes && (
                  <div style={{ marginBottom: 24, padding: "14px 18px", background: "#fffbf0", borderRadius: 10, borderRight: `3px solid ${gold}` }}>
                    <div style={{ fontSize: 11, color: "#aaa", marginBottom: 6, letterSpacing: "1px", textTransform: "uppercase" }}>ملاحظات</div>
                    <div style={{ fontSize: 13, color: "#555", lineHeight: 1.8 }}>{quote.notes}</div>
                  </div>
                )}

                {/* Footer */}
                <div style={{ textAlign: "center", paddingTop: 20, borderTop: "1px solid #f0ece4" }}>
                  <div style={{ fontSize: 13, color: gold, fontWeight: 700, marginBottom: 4 }}>شكراً لتعاملكم مع لمحاتك</div>
                  <div style={{ fontSize: 11, color: "#bbb" }}>{branch.flag} {branch.label} · {formatDateAr(quote.issue_date)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}