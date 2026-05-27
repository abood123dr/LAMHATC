import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Images,
  History,
  Sparkles,
  FileText,
  ClipboardList,
  Tag,
  Link2,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/dashboard", icon: LayoutDashboard, label: "لوحة التحكم" },
  { to: "/products", icon: Package, label: "المنتجات والمخزون" },
  { to: "/sales", icon: ShoppingBag, label: "المبيعات" },
  { to: "/customers", icon: Users, label: "العملاء" },
  { to: "/gallery", icon: Images, label: "معرض الصور" },
  { to: "/movements", icon: History, label: "حركة المخزون" },
  { to: "/quotes", icon: FileText, label: "العروض والفواتير" },
  { to: "/orders", icon: ClipboardList, label: "الطلبات" },

  { to: "/discount-codes", icon: Tag, label: "أكواد الخصم" },
  { to: "/linktree", icon: Link2, label: "صفحة الروابط" },
  { to: "/review-link", icon: Star, label: "رابط التقييم" },
];

export default function Sidebar({ onNavigate }) {
  return (
    <aside className="h-full w-full bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Brand */}
      <div className="px-6 py-8 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl gradient-gold flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-sidebar" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display tracking-wide text-gold">
              لمحاتك
            </h1>
            <p className="text-[11px] text-sidebar-foreground/60 tracking-widest uppercase">
              Lamahatk System
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-transform group-hover:scale-110",
                    isActive && "text-gold"
                  )}
                  strokeWidth={isActive ? 2.2 : 1.8}
                />
                <span>{item.label}</span>
                {isActive && (
                  <span className="mr-auto w-1.5 h-1.5 rounded-full bg-gold" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <div className="px-3 py-3 rounded-lg bg-sidebar-accent/50">
          <p className="text-xs text-sidebar-foreground/60 mb-1">نظام إدارة</p>
          <p className="text-sm font-semibold text-sidebar-foreground">
            مخزون ومبيعات
          </p>
          <p className="text-[11px] text-gold mt-1">السعودية · تركيا</p>
        </div>
      </div>
    </aside>
  );
}
