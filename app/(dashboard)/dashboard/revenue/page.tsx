import { db } from "@/db";
import { orders } from "@/db/schema";
import { formatINR } from "@/lib/utils";
import { desc, sql } from "drizzle-orm";
import { CalendarDays, TrendingUp, Landmark, PieChart, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default async function RevenueInsightsPage() {
  // 1. Daily Aggregates (Amber Themed)
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

  const totalStats = dailyRevenue.reduce((acc, curr) => ({
    sales: acc.sales + Number(curr.total),
    gst: acc.gst + Number(curr.gst),
    orders: acc.orders + Number(curr.count)
  }), { sales: 0, gst: 0, orders: 0 });

  return (
    <div className="space-y-10 pb-10">
      <header className="border-l-4 border-amber-500 pl-6">
        <h1 className="text-4xl font-black text-white tracking-tighter">
          FINANCIAL <span className="text-amber-500">INSIGHTS</span>
        </h1>
        <p className="text-slate-400 font-medium">Monitoring kitchen profitability and GST health.</p>
      </header>

      {/* Amber Highlight Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Gross Sales" value={formatINR(totalStats.sales)} icon={<TrendingUp size={20}/>} />
        <MetricCard title="GST Payable" value={formatINR(totalStats.gst)} icon={<Landmark size={20}/>} />
        <MetricCard title="Total Orders" value={totalStats.orders} icon={<PieChart size={20}/>} />
        <MetricCard title="Avg. Order" value={formatINR(totalStats.sales / (totalStats.orders || 1))} icon={<ArrowUpRight size={20}/>} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Detailed Table */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CalendarDays className="text-amber-500" size={24} /> 
              Daily Performance
            </h2>
            <span className="text-[10px] text-amber-500/50 uppercase tracking-[0.2em] font-bold">Last 30 Days</span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-amber-500/60 border-b border-slate-800 uppercase text-[10px] tracking-widest">
                  <th className="pb-4 text-left font-black">Date</th>
                  <th className="pb-4 text-center font-black">Orders</th>
                  <th className="pb-4 text-right font-black">GST (5%)</th>
                  <th className="pb-4 text-right font-black">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {dailyRevenue.map((day) => (
                  <tr key={day.date} className="group hover:bg-amber-500/[0.02] transition-colors">
                    <td className="py-5 text-slate-300 font-mono text-xs">{day.date}</td>
                    <td className="py-5 text-center text-white font-bold">{day.count}</td>
                    <td className="py-5 text-right text-slate-500">{formatINR(Number(day.gst))}</td>
                    <td className="py-5 text-right font-black text-amber-500">{formatINR(Number(day.total))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Insights Sidebar */}
        <div className="space-y-6">
          <div className="bg-amber-500 rounded-3xl p-8 shadow-lg shadow-amber-500/10">
            <h3 className="font-black text-slate-950 text-2xl leading-none">Efficiency Target</h3>
            <div className="mt-6 flex items-end justify-between">
              <span className="text-4xl font-black text-slate-950">92%</span>
              <span className="text-xs font-bold text-slate-900 uppercase">Live Metrics</span>
            </div>
            <div className="mt-4 w-full bg-slate-950/20 h-2 rounded-full overflow-hidden">
              <div className="bg-slate-950 h-full w-[92%] transition-all"></div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-lg font-bold text-white mb-6 border-b border-slate-800 pb-4">Top Channels</h2>
            <div className="space-y-6">
              <ChannelItem label="POS In-Store" percentage={65} color="bg-amber-500" />
              <ChannelItem label="Zomato" percentage={25} color="bg-amber-400" />
              <ChannelItem label="Swiggy" percentage={10} color="bg-amber-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon }: any) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl group hover:border-amber-500/50 transition-all cursor-default">
      <div className="mb-4 p-3 rounded-2xl bg-amber-500/10 w-fit text-amber-500 group-hover:bg-amber-500 group-hover:text-slate-950 transition-all">
        {icon}
      </div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-white mt-1 group-hover:text-amber-500 transition-colors">{value}</h3>
    </div>
  );
}

function ChannelItem({ label, percentage, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
        <span className="text-slate-400">{label}</span>
        <span className="text-amber-500">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}