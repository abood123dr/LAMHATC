import React, { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase-client";
import { Sale, Product, Customer } from "@/api/base44Client";

import { DollarSign, TrendingUp, ShoppingBag, Users } from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";
import DashStatCard from "@/components/dashboard/DashStatCard";
import DashBranchCard from "@/components/dashboard/DashBranchCard";
import DashTopProducts from "@/components/dashboard/DashTopProducts";
import DashRecentSales from "@/components/dashboard/DashRecentSales";
import DashBanner from "@/components/dashboard/DashBanner";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay, ease: "easeOut" },
});

export default function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();

  // Real-time order notifications عبر Supabase
  useEffect(() => {
    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new;
          const branchLabel = order?.branch === "saudi" ? "🇸🇦 السعودية" : "🇹🇷 تركيا";
          const currency = order?.branch === "saudi" ? "ر.س" : "₺";
          qc.invalidateQueries({ queryKey: ["orders"] });
          toast(`🛍️ طلب جديد!`, {
            description: `${order?.customer_name} — ${branchLabel} — ${order?.total_amount?.toLocaleString("ar-SA")} ${currency}`,
            duration: 8000,
            action: {
              label: "عرض الطلبات ←",
              onClick: () => navigate("/orders"),
            },
          });
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [qc, navigate]);

  const { data: sales = [], isLoading: loadingSales } = useQuery({
    queryKey: ["sales"],
    queryFn: () => Sale.list('-created_at', 500),
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: () => Product.list('-created_at', 500),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => Customer.list('-created_at', 500),
  });

  const branchStats = (branch) => {
    const bSales = sales.filter((s) => s.branch === branch);
    const stockKey = branch === "saudi" ? "saudi_stock" : "turkey_stock";
    return {
      totalSales: bSales.reduce((sum, s) => sum + (s.total_amount || 0), 0),
      totalProfit: bSales.reduce((sum, s) => sum + (s.profit || 0), 0),
      salesCount: bSales.length,
      stockCount: products.reduce((sum, p) => sum + (p[stockKey] || 0), 0),
    };
  };

  const saudiStats = branchStats("saudi");
  const turkeyStats = branchStats("turkey");

  const avgPriceSaudi = saudiStats.salesCount
    ? saudiStats.totalSales / sales.filter((s) => s.branch === "saudi").reduce((n, s) => n + (s.quantity || 1), 0)
    : 0;

  return (
    <div className="space-y-5 pb-6">
      <motion.div {...fadeUp(0)}>
        <DashBanner />
      </motion.div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4" dir="rtl">
        <motion.div {...fadeUp(0.05)}>
          <DashStatCard icon={ShoppingBag} label="إجمالي المبيعات" value={formatNumber(sales.length)} sub="عبر جميع الفروع" color="gold" loading={loadingSales} />
        </motion.div>
        <motion.div {...fadeUp(0.1)}>
          <DashStatCard icon={Users} label="العملاء" value={formatNumber(customers.length)} sub="عميل مسجل" color="purple" loading={loadingSales} />
        </motion.div>
        <motion.div {...fadeUp(0.15)}>
          <DashStatCard icon={DollarSign} label="مبيعات السعودية" value={formatCurrency(saudiStats.totalSales, "saudi")} sub={`متوسط ${formatCurrency(avgPriceSaudi, "saudi")}`} color="emerald" loading={loadingSales} />
        </motion.div>
        <motion.div {...fadeUp(0.2)}>
          <DashStatCard icon={TrendingUp} label="مبيعات تركيا" value={formatCurrency(turkeyStats.totalSales, "turkey")} sub={`${turkeyStats.salesCount} عملية`} color="rose" loading={loadingSales} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <motion.div {...fadeUp(0.25)}>
          <DashBranchCard branch="saudi" stats={saudiStats} loading={loadingSales} />
        </motion.div>
        <motion.div {...fadeUp(0.3)}>
          <DashBranchCard branch="turkey" stats={turkeyStats} loading={loadingSales} />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <motion.div {...fadeUp(0.35)}>
          <DashTopProducts sales={sales} loading={loadingSales} />
        </motion.div>
        <motion.div {...fadeUp(0.4)}>
          <DashRecentSales sales={sales} loading={loadingSales} />
        </motion.div>
      </div>
    </div>
  );
}