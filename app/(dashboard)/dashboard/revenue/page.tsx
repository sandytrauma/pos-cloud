import { db } from "@/db";
import { orders, orderItems, menuItems } from "@/db/schema";
import { formatINR, cn } from "@/lib/utils";
import { desc, sql, gte, eq } from "drizzle-orm";
import { 
  CalendarDays, 
  TrendingUp, 
  Landmark, 
  PieChart, 
  ArrowUpRight, 
  ChevronRight,
  Trophy
} from "lucide-react";

export default async function RevenueInsightsPage() {
  // 1. Multi-Period Financial Analysis (The Dashboard Logic)
  const financialStats = await db.select({
    dailyGross: sql<string>`sum(CASE WHEN ${orders.createdAt} >= CURRENT_DATE THEN ${orders.totalAmount} ELSE 0 END)`,
    dailyGst: sql<string>`sum(CASE WHEN ${orders.createdAt} >= CURRENT_DATE THEN ${orders.gstAmount} ELSE 0 END)`,
    dailyCount: sql<number>`count(CASE WHEN ${orders.createdAt} >= CURRENT_DATE THEN 1 END)`,
    
    monthlyGross: sql<string>`sum(CASE WHEN ${orders.createdAt} >= DATE_TRUNC('month', CURRENT_DATE) THEN ${orders.totalAmount} ELSE 0 END)`,
    monthlyGst: sql<string>`sum(CASE WHEN ${orders.createdAt} >= DATE_TRUNC('month', CURRENT_DATE) THEN ${orders.gstAmount} ELSE 0 END)`,
    
    quarterlyGross: sql<string>`sum(CASE WHEN ${orders.createdAt} >= DATE_TRUNC('quarter', CURRENT_DATE) THEN ${orders.totalAmount} ELSE 0 END)`,
    
    yearlyGross: sql<string>`sum(CASE WHEN ${orders.createdAt} >= DATE_TRUNC('year', CURRENT_DATE) THEN ${orders.totalAmount} ELSE 0 END)`,
  }).from(orders);

  const stats = financialStats[0];

  // 2. Daily Trend (Table Data - Last 30 Days)
  const dailyRevenue = await db.select({
    date: sql<string>`DATE(${orders.createdAt})`,
    total: sql<number>`SUM(${orders.totalAmount})`,
    count: sql<number>`COUNT(${orders.id})`,
    gst: sql<number>`SUM(${orders.gstAmount})`
  })
  .from(orders)
  .groupBy(sql`DATE(${orders.createdAt})`)
  .orderBy(desc(sql`DATE(${orders.createdAt})`))
  .limit(30);

 // 3. Top Selling Products (Calculated with 40% COGS / 60% Margin)
const topProducts = await db.select({
  name: orderItems.itemName,
  quantity: sql<number>`sum(${orderItems.quantity})`,
  revenue: sql<number>`sum(${orderItems.quantity} * CAST(${orderItems.price} AS NUMERIC))`,
  // Real Profit = (Selling Price - Cost Price) * Quantity
  profit: sql<number>`sum(${orderItems.quantity} * (CAST(${orderItems.price} AS NUMERIC) - COALESCE(CAST(${menuItems.costPrice} AS NUMERIC), 0)))`
})
.from(orderItems)
// Joining with menuItems to get the costPrice for each item
.leftJoin(menuItems, eq(orderItems.itemName, menuItems.name)) 
.groupBy(orderItems.itemName)
.orderBy(desc(sql`sum(${orderItems.quantity})`))
.limit(5);

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700">
      <header className="border-l-4 border-amber-500 pl-6">
        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">
          FINANCIAL <span className="text-amber-500">INSIGHTS</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">
          Fiscal Monitoring & Performance Audit
        </p>
      </header>

      {/* 📊 Main Metrics: Integrated Multi-Period */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Daily Gross" value={formatINR(stats.dailyGross || "0")} icon={<TrendingUp size={20}/>} subText="Today" />
        <MetricCard title="Monthly Gross" value={formatINR(stats.monthlyGross || "0")} icon={<Landmark size={20}/>} subText="MTD" />
        <MetricCard title="Quarterly Gross" value={formatINR(stats.quarterlyGross || "0")} icon={<PieChart size={20}/>} subText="QTD" />
        <MetricCard title="Yearly Gross" value={formatINR(stats.yearlyGross || "0")} icon={<ArrowUpRight size={20}/>} subText="YTD" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 📋 Detailed Performance Table */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-white uppercase italic flex items-center gap-2">
                <CalendarDays className="text-amber-500" size={24} /> 
                Daily Revenue Log
              </h2>
              <span className="text-[10px] text-amber-500/50 uppercase tracking-[0.2em] font-black">Audit Trail</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800/50 uppercase text-[9px] tracking-widest font-black">
                    <th className="pb-4 text-left">Date</th>
                    <th className="pb-4 text-center">Qty</th>
                    <th className="pb-4 text-right">Tax (5%)</th>
                    <th className="pb-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {dailyRevenue.map((day) => (
                    <tr key={day.date} className="group hover:bg-amber-500/[0.03] transition-colors">
                      <td className="py-5 text-slate-400 font-mono text-[11px]">{day.date}</td>
                      <td className="py-5 text-center text-white font-bold">{day.count}</td>
                      <td className="py-5 text-right text-slate-600 font-medium">{formatINR(Number(day.gst))}</td>
                      <td className="py-5 text-right font-black text-amber-500">{formatINR(Number(day.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 🏆 Quick Insights Sidebar */}
        <div className="space-y-6">
         {/* Top Selling Products Card */}
<div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
  <h2 className="text-lg font-black text-white uppercase italic mb-6 border-b border-slate-800 pb-4 flex items-center gap-3">
    <Trophy size={18} className="text-amber-500" /> Menu Profitability
  </h2>
  <div className="space-y-6">
    {topProducts.map((item, i) => {
      const marginPercent = item.revenue > 0 
        ? Math.round((item.profit / item.revenue) * 100) 
        : 0;

      return (
        <div key={i} className="flex justify-between items-start group">
           <div className="space-y-0.5">
              <p className="text-xs font-black text-white uppercase tracking-tighter group-hover:text-amber-500 transition-colors">
                {item.name}
              </p>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                {item.quantity} Sold • {marginPercent}% True Margin
              </p>
           </div>
           <div className="text-right">
              <p className="text-sm font-black text-amber-500 leading-none">
                {formatINR(Number(item.revenue))}
              </p>
              <p className={cn(
                "text-[9px] font-bold uppercase mt-1",
                marginPercent > 50 ? "text-emerald-500" : "text-amber-600"
              )}>
                +{formatINR(Number(item.profit))} Net
              </p>
           </div>
        </div>
      );
    })}
  </div>
</div>

          {/* Revenue Breakdown Sidebar (Same as Dashboard style) */}
          <div className="bg-slate-950 border border-amber-500/20 rounded-[2.5rem] p-8">
            <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-6">Net Profit Audit</h3>
            <div className="space-y-4">
              <PeriodProfit label="Today" gross={stats.dailyGross} gst={stats.dailyGst} />
              <PeriodProfit label="Month" gross={stats.monthlyGross} gst={stats.monthlyGst} />
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800">
               <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Efficiency</span>
                  <span className="text-2xl font-black text-white italic leading-none">92%</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Local Helpers ---

function MetricCard({ title, value, icon, subText }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] group hover:border-amber-500/50 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
          {icon}
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 bg-slate-950 px-2 py-1 rounded-lg">
          {subText}
        </span>
      </div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-white mt-1 italic tracking-tighter group-hover:text-amber-500 transition-colors">
        {value}
      </h3>
    </div>
  );
}

function PeriodProfit({ label, gross, gst }: any) {
  const net = Number(gross || 0) - Number(gst || 0);
  return (
    <div className="flex justify-between items-center group">
       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
       <div className="text-right">
          <p className="text-sm font-black text-white italic">{formatINR(net)}</p>
          <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter">After Tax</p>
       </div>
    </div>
  )
}