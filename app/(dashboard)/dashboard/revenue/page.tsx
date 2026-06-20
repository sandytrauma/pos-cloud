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
  Trophy
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function RevenueInsightsPage() {
  // 1. Multi-Period Financial Analysis (Strict defensive numeric fallback layers)
  const financialStats = await db.select({
    dailyGross: sql<string>`COALESCE(sum(CASE WHEN ${orders.createdAt} >= CURRENT_DATE THEN ${orders.totalAmount} ELSE 0 END), 0)`,
    dailyGst: sql<string>`COALESCE(sum(CASE WHEN ${orders.createdAt} >= CURRENT_DATE THEN ${orders.gstAmount} ELSE 0 END), 0)`,
    dailyCount: sql<number>`COALESCE(count(CASE WHEN ${orders.createdAt} >= CURRENT_DATE THEN 1 END), 0)`,
    
    monthlyGross: sql<string>`COALESCE(sum(CASE WHEN ${orders.createdAt} >= DATE_TRUNC('month', CURRENT_DATE) THEN ${orders.totalAmount} ELSE 0 END), 0)`,
    monthlyGst: sql<string>`COALESCE(sum(CASE WHEN ${orders.createdAt} >= DATE_TRUNC('month', CURRENT_DATE) THEN ${orders.gstAmount} ELSE 0 END), 0)`,
    
    quarterlyGross: sql<string>`COALESCE(sum(CASE WHEN ${orders.createdAt} >= DATE_TRUNC('quarter', CURRENT_DATE) THEN ${orders.totalAmount} ELSE 0 END), 0)`,
    
    yearlyGross: sql<string>`COALESCE(sum(CASE WHEN ${orders.createdAt} >= DATE_TRUNC('year', CURRENT_DATE) THEN ${orders.totalAmount} ELSE 0 END), 0)`,
  }).from(orders);

  // Fallback map definition to handle dead/empty database query arrays securely
  const stats = financialStats[0] || {
    dailyGross: "0", dailyGst: "0", dailyCount: 0,
    monthlyGross: "0", monthlyGst: "0", quarterlyGross: "0", yearlyGross: "0"
  };

  // 2. Daily Trend (Table Data - Last 30 Days)
  const dailyRevenue = await db.select({
    date: sql<string>`DATE(${orders.createdAt})`,
    total: sql<string>`COALESCE(SUM(${orders.totalAmount}), 0)`,
    count: sql<number>`COALESCE(COUNT(${orders.id}), 0)`,
    gst: sql<string>`COALESCE(SUM(${orders.gstAmount}), 0)`
  })
  .from(orders)
  .groupBy(sql`DATE(${orders.createdAt})`)
  .orderBy(desc(sql`DATE(${orders.createdAt})`))
  .limit(30);

  // 3. Top Selling Products (Calculated with dynamic Left Join relational schemas)
  const topProducts = await db.select({
    name: orderItems.itemName,
    quantity: sql<number>`COALESCE(sum(${orderItems.quantity}), 0)`,
    revenue: sql<string>`COALESCE(sum(${orderItems.quantity} * CAST(${orderItems.price} AS NUMERIC)), 0)`,
    profit: sql<string>`COALESCE(sum(${orderItems.quantity} * (CAST(${orderItems.price} AS NUMERIC) - COALESCE(CAST(${menuItems.costPrice} AS NUMERIC), 0))), 0)`
  })
  .from(orderItems)
  .leftJoin(menuItems, eq(orderItems.itemName, menuItems.name)) 
  .groupBy(orderItems.itemName)
  .orderBy(desc(sql`sum(${orderItems.quantity})`))
  .limit(5);

  return (
    <div className="space-y-10 pb-10 animate-in fade-in duration-700 relative z-10">
      <header className="border-l-4 border-amber-500 pl-6">
        <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase leading-none">
          FINANCIAL <span className="text-amber-500">INSIGHTS</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-3">
          Fiscal Monitoring & Performance Audit
        </p>
      </header>

      {/* Metrics Section Grid Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Daily Gross" value={formatINR(Number(stats.dailyGross))} icon={<TrendingUp size={18}/>} subText="Today" />
        <MetricCard title="Monthly Gross" value={formatINR(Number(stats.monthlyGross))} icon={<Landmark size={18}/>} subText="MTD" />
        <MetricCard title="Quarterly Gross" value={formatINR(Number(stats.quarterlyGross))} icon={<PieChart size={18}/>} subText="QTD" />
        <MetricCard title="Yearly Gross" value={formatINR(Number(stats.yearlyGross))} icon={<ArrowUpRight size={18}/>} subText="YTD" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Table Records Log Panel */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-white uppercase italic flex items-center gap-2">
                <CalendarDays className="text-amber-500" size={22} /> 
                Daily Revenue Log
              </h2>
              <span className="text-[10px] text-amber-500/50 uppercase tracking-[0.2em] font-black hidden sm:inline">Audit Trail</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800/60 uppercase text-[9px] tracking-widest font-black text-left">
                    <th className="pb-4">Date</th>
                    <th className="pb-4 text-center">Qty</th>
                    <th className="pb-4 text-right">Tax (5%)</th>
                    <th className="pb-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {dailyRevenue.map((day) => (
                    <tr key={day.date} className="group hover:bg-amber-500/[0.02] transition-colors">
                      <td className="py-4.5 text-slate-400 font-mono text-[11px]">{day.date}</td>
                      <td className="py-4.5 text-center text-white font-bold">{day.count}</td>
                      <td className="py-4.5 text-right text-slate-600 font-medium">{formatINR(Number(day.gst))}</td>
                      <td className="py-4.5 text-right font-black text-amber-500">{formatINR(Number(day.total))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar Breakdown Controls Panel */}
        <div className="space-y-6">
          {/* Top Selling Products Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-xl">
            <h2 className="text-lg font-black text-white uppercase italic mb-6 border-b border-slate-800 pb-4 flex items-center gap-3">
              <Trophy size={16} className="text-amber-500" /> Menu Profitability
            </h2>
            <div className="space-y-6">
              {topProducts.map((item, i) => {
                const revenueNum = Number(item.revenue || 0);
                const profitNum = Number(item.profit || 0);
                const marginPercent = revenueNum > 0 ? Math.round((profitNum / revenueNum) * 100) : 0;

                return (
                  <div key={i} className="flex justify-between items-start group gap-2">
                    <div className="space-y-0.5 truncate">
                      <p className="text-xs font-black text-white uppercase tracking-tighter group-hover:text-amber-500 transition-colors truncate">
                        {item.name}
                      </p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                        {item.quantity} Sold • {marginPercent}% True Margin
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black text-amber-500 leading-none">
                        {formatINR(revenueNum)}
                      </p>
                      <p className={cn(
                        "text-[9px] font-bold uppercase mt-1.5",
                        marginPercent > 50 ? "text-emerald-500" : "text-amber-600"
                      )}>
                        +{formatINR(profitNum)} Net
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Breakdown Sidebar */}
          <div className="bg-slate-950 border border-slate-800 rounded-[2.5rem] p-6 md:p-8">
            <h3 className="text-xs font-black text-amber-500 uppercase tracking-widest mb-6">Net Profit Audit</h3>
            <div className="space-y-4">
              <PeriodProfit label="Today" gross={stats.dailyGross} gst={stats.dailyGst} />
              <PeriodProfit label="Month" gross={stats.monthlyGross} gst={stats.monthlyGst} />
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800/80">
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

// --- Local Presentational UI Block Components ---

function MetricCard({ title, value, icon, subText }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] group hover:border-amber-500/40 transition-all shadow-md relative overflow-hidden">
      <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-amber-500/[0.02] rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/[0.05] transition-all" />
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all shadow-inner">
          {icon}
        </div>
        <span className="text-[8px] font-black uppercase tracking-widest text-slate-600 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800/40">
          {subText}
        </span>
      </div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-white mt-1.5 italic tracking-tighter group-hover:text-amber-500 transition-colors truncate">
        {value}
      </h3>
    </div>
  );
}

function PeriodProfit({ label, gross, gst }: any) {
  const net = Number(gross || 0) - Number(gst || 0);
  return (
    <div className="flex justify-between items-center group py-1">
       <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
       <div className="text-right">
          <p className="text-sm font-black text-white italic tracking-tight">{formatINR(net)}</p>
          <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter mt-0.5">After Tax</p>
       </div>
    </div>
  );
}