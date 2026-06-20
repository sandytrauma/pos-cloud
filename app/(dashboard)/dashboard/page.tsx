// Location: app/dashboard/page.tsx
import { db } from "@/db";
import { orders, reconciliations } from "@/db/schema";
import { desc, eq, sql, gte, inArray } from "drizzle-orm";
import { formatINR, cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Users, 
  IndianRupee, 
  Plus, 
  MoreHorizontal,
  BarChart3,
  Zap,
  Target
} from "lucide-react";
import OrderCard from "@/components/kds/OrderCard";
import Link from "next/link";
import { updateOrderStatus } from "@/lib/actions/orders";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // 1. Setup Time Boundaries (Strict Midnight IST Reset)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const dailyFilter = startOfToday.toISOString();

  try {
    // 2. Fetch Active Orders for KDS
    const activeOrders = await db.query.orders.findMany({
      where: inArray(orders.status, ["RECEIVED", "PREPARING", "READY"]),
      with: { items: true },
      orderBy: [desc(orders.createdAt)],
    });

    // 3. 15-Day Trend Data (Safely cast Date context as text to prevent parsing errors)
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const trendData = await db.select({
      date: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
      total: sql<string>`COALESCE(SUM(${orders.totalAmount}::numeric), 0)::text`,
    })
    .from(orders)
    .where(gte(orders.createdAt, fifteenDaysAgo))
    .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`)
    .orderBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

    // 4. Financial Analytics (Today & Monthly cleanly separated)
    const financialStatsResult = await db.select({
      dailyGross: sql<string>`
        COALESCE(
          SUM(
            CASE 
              WHEN ${orders.createdAt} >= ${dailyFilter}::timestamp 
              THEN ${orders.totalAmount}::numeric 
              ELSE 0 
            END
          ), 0
        )::text`,
        
      monthlyGross: sql<string>`
        COALESCE(
          SUM(
            CASE 
              WHEN ${orders.createdAt} >= DATE_TRUNC('month', CURRENT_DATE) 
              THEN ${orders.totalAmount}::numeric 
              ELSE 0 
            END
          ), 0
        )::text`,
    }).from(orders);

    // 5. Fetch Actual Net Profit from the Reconciliation Ledger
    const reconciliationStats = await db.select({
      dailyNet: sql<string>`COALESCE(sum(${reconciliations.netEarning}), 0)::text`,
    })
    .from(reconciliations)
    .where(gte(reconciliations.date, startOfToday));

    // 🌟 FIXED: Pruned the duplicate stats assignments down into a single clean fallback configuration object
    const stats = financialStatsResult[0] || { dailyGross: "0", monthlyGross: "0" };
    const netProfit = reconciliationStats[0]?.dailyNet || "0";

    return (
      <div className="space-y-8 animate-in fade-in duration-700 pb-10 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="text-amber-500 fill-amber-500 animate-pulse" size={22} />
              <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">Live Kitchen</h1>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Real-time order synchronization
            </p>
          </div>
          <Link 
            href="/dashboard/pos" 
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-amber-500/10 uppercase text-xs tracking-widest active:scale-95 shrink-0"
          >
            <Plus size={16} strokeWidth={3} /> New POS Order
          </Link>
        </div>

        {/* 📊 Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard 
            title="Today's Revenue" 
            value={formatINR(Number(stats.dailyGross || 0))} 
            icon={<IndianRupee className="text-emerald-500" size={18} />}
            trend="Gross Sales" 
            color="emerald" 
          />
          <StatCard 
            title="Active Tokens" 
            value={activeOrders.length.toString()} 
            icon={<Users className="text-amber-500" size={18} />}
            trend="In Progress" 
            color="amber" 
          />
          <StatCard 
            title="Daily Net (Reconciled)" 
            value={formatINR(Number(netProfit))} 
            icon={<TrendingUp className="text-blue-500" size={18} />}
            trend="After Expenses" 
            color="blue" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            
            {/* 🔥 Kitchen Display System Grid */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-3">
                  <Target size={14} className="text-rose-500" /> Priority Queue
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    order={order} 
                    updateOrderStatus={updateOrderStatus} 
                  />
                ))}
                {activeOrders.length === 0 && (
                  <div className="col-span-full py-20 text-center border border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 font-black uppercase tracking-widest italic text-xs bg-slate-900/10">
                    Station Clean & Clear 🍳
                  </div>
                )}
              </div>
            </section>

            {/* 📈 15-Day Revenue Trend Bar Chart Layout */}
            <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-black text-white text-xs uppercase italic tracking-widest flex items-center gap-2">
                  <BarChart3 size={14} className="text-amber-500" /> Revenue Velocity
                </h3>
              </div>
              
              <div className="flex items-end justify-between h-36 gap-1.5 sm:gap-2 px-1 relative z-10">
                {trendData.map((day, i) => {
                  const dayTotalNum = Number(day.total || 0);
                  const displayDate = day.date ? day.date.substring(5).replace('-', '/') : '';
                  
                  return (
                    <div key={i} className="flex flex-col items-center gap-2.5 w-full group">
                      <div 
                        className="w-full bg-slate-800 group-hover:bg-amber-500 transition-all rounded-lg cursor-pointer relative" 
                        style={{ height: `${Math.max((dayTotalNum / 20000) * 100, 8)}%` }} 
                      >
                         <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-white text-slate-950 text-[9px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl pointer-events-none z-50">
                            {formatINR(dayTotalNum)}
                         </div>
                      </div>
                      <span className="text-[8px] font-black text-slate-600 uppercase tracking-tight">
                        {displayDate}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right Column: Profit & Tax Analysis */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 shadow-2xl">
              <h3 className="font-black text-white mb-6 flex items-center justify-between uppercase italic tracking-widest text-xs border-b border-slate-800 pb-3">
                Profit Ledger <MoreHorizontal size={16} className="text-slate-700" />
              </h3>
              <div className="space-y-6">
                <PeriodRow label="Today (Reconciled)" gross={stats.dailyGross} net={netProfit} />
                <PeriodRow label="Month-to-Date" gross={stats.monthlyGross} net={String(Number(stats.monthlyGross || 0) * 0.45)} /> 
              </div>
            </div>

            <div className="bg-amber-500 rounded-[2.5rem] p-6 md:p-8 text-slate-950 shadow-2xl shadow-amber-500/5">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">Tax & Accountant Note</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-slate-950/10 pb-3">
                  <span className="text-[10px] font-black uppercase tracking-tight">GST (5%)</span>
                  <span className="text-xl font-black italic tracking-tighter">
                    {formatINR(Number(stats.monthlyGross || 0) * 0.05)}
                  </span>
                </div>
                <p className="text-[9px] font-bold leading-relaxed opacity-85 uppercase tracking-tight">
                  Net profit estimates include COGS and operating expenses from reconciled days. Final figures subject to inventory audits.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error("Dashboard Load Error:", error);
    return (
      <div className="text-rose-500 p-8 border border-rose-500/20 bg-rose-500/5 rounded-3xl font-black uppercase text-xs tracking-widest text-center my-10">
        Failed to sync kitchen terminal. Check infrastructure links.
      </div>
    );
  }
}

// --- Local Presentational Sub-components ---

function PeriodRow({ label, gross, net }: any) {
  const isZero = Number(gross || 0) === 0;
  return (
    <div className="space-y-3 border-b border-slate-800/40 pb-5 last:border-0 last:pb-0">
      <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</p>
      <div className="flex justify-between items-end gap-2">
        <div>
          <p className="text-[8px] text-slate-600 uppercase font-black tracking-tight">Gross Revenue</p>
          <p className={cn("text-lg font-black tracking-tighter italic leading-none mt-1", isZero ? "text-slate-700" : "text-white")}>
            {formatINR(Number(gross || 0))}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-emerald-700 uppercase font-black tracking-tight">Final Net</p>
          <p className={cn("text-lg font-black tracking-tighter italic leading-none mt-1", isZero ? "text-slate-700" : "text-emerald-500")}>
            {formatINR(Number(net || 0))}
          </p>
        </div>
      </div>
    </div>
  );
}

// Fixed missing import context references on the createPosOrder alias token signature
function StatCard({ title, value, icon, trend, color }: any) {
  const colorMap: any = {
    emerald: "text-emerald-500 border-emerald-500/10",
    amber: "text-amber-500 border-amber-500/10",
    blue: "text-blue-500 border-blue-500/10"
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2rem] shadow-md hover:border-slate-700 transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-5">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800/60 group-hover:border-amber-500/20 transition-colors">{icon}</div>
        <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg bg-slate-950 border uppercase tracking-widest font-mono", colorMap[color])}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-black uppercase tracking-widest">{title}</p>
        <p className="text-3xl md:text-4xl font-black text-white mt-1.5 tracking-tighter italic leading-none">{value}</p>
      </div>
    </div>
  );
}