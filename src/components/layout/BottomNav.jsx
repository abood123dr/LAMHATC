import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, Package, Users, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/orders",   icon: ClipboardList, label: "الطلبات" },
  { to: "/sales",    icon: ShoppingBag,   label: "المبيعات" },
  { to: "/dashboard", icon: LayoutDashboard, label: "الرئيسية", end: true },
  { to: "/products", icon: Package,       label: "المنتجات" },
  { to: "/customers",icon: Users,         label: "العملاء" },
];

export default function BottomNav() {
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-background border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around px-1 py-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 min-w-[52px]",
                isActive
                  ? "text-gold"
                  : "text-muted-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200",
                  isActive ? "bg-accent" : ""
                )}>
                  <item.icon className={cn("w-5 h-5", isActive && "text-gold")} strokeWidth={isActive ? 2.2 : 1.8} />
                </div>
                <span className={cn("text-[10px] font-medium", isActive ? "text-gold" : "text-muted-foreground")}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
