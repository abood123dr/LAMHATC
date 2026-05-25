import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import { cn } from "@/lib/utils";

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <div className="hidden lg:block w-72 shrink-0 fixed inset-y-0 right-0 z-30">
        <Sidebar />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={cn(
          "lg:hidden fixed inset-y-0 right-0 w-72 z-50 transition-transform duration-300",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      {/* Main */}
      <div className="flex-1 lg:mr-72 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-20 bg-background/80 backdrop-blur-xl border-b border-border px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center">
              <span className="text-xs font-bold text-white">ل</span>
            </div>
            <span className="font-bold text-gold font-display text-lg">لمحاتك</span>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        <main className="px-4 md:px-8 lg:px-12 py-6 md:py-10 pb-24 lg:pb-10">
          <Outlet />
        </main>
      </div>

      <BottomNav />
    </div>
  );
}