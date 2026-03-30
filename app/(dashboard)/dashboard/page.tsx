import { db } from "@/db";
import { orders, reconciliations } from "@/db/schema";
import { desc, eq, sql, gte, and, inArray } from "drizzle-orm";
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



export default async function Dashboard() {
  // Current Date Boundaries for IST/UTC safety
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Fetch Active Orders (KDS: Show everything not yet COMPLETED or CANCELLED)
  const activeOrders = await db.query.orders.findMany({
    where: inArray(orders.status, ["RECEIVED", "PREPARING", "READY"]),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
  });

  // 2. 15-Day Trend Data (Gross Revenue)
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const trendData = await db.select({
    date: sql<string>`DATE_TRUNC('day', ${orders.createdAt})`,
    total: sql<number>`sum(${orders.totalAmount})`,
  })
  .from(orders)
  .where(gte(orders.createdAt, fifteenDaysAgo))
  .groupBy(sql`DATE_TRUNC('day', ${orders.createdAt})`)
  .orderBy(sql`DATE_TRUNC('day', ${orders.createdAt})`);

  // 3. Financial Stats (Gross from Orders, Actual Net from Reconciliations)
 const dailyFilter = startOfToday.toISOString();

const financialStats = await db.select({
  dailyGross: sql<string>`
    COALESCE(
      SUM(
        CASE 
          WHEN ${orders.createdAt} >= ${dailyFilter}::timestamp 
          THEN ${orders.totalAmount}::numeric 
          ELSE 0::numeric 
        END
      ), 
      0
    )::text`.as('dailyGross'), // Explicit Alias
  monthlyGross: sql<string>`
    COALESCE(
      SUM(
        CASE 
          WHEN ${orders.createdAt} >= DATE_TRUNC('month', CURRENT_DATE) 
          THEN ${orders.totalAmount}::numeric 
          ELSE 0::numeric 
        END
      ), 
      0
    )::text`.as('monthlyGross'), // Explicit Alias
}).from(orders);

  // Fetch Actual Net Profit from the Reconciliation Ledger
  const reconciliationStats = await db.select({
    dailyNet: sql<string>`sum(${reconciliations.netEarning})`,
  })
  .from(reconciliations)
  .where(gte(reconciliations.date, startOfToday));

  const stats = financialStats[0];
  const netProfit = reconciliationStats[0]?.dailyNet || "0";

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="text-amber-500 fill-amber-500 animate-pulse" size={24} />
            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">Live Kitchen</h1>
          </div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Real-time order synchronization
          </p>
        </div>
        <Link 
          href="/dashboard/pos" 
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-8 py-4 rounded-2xl font-black transition-all shadow-xl shadow-amber-500/20 uppercase text-xs tracking-widest active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> New POS Order
        </Link>
      </div>

      {/* 📊 Top Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Today's Revenue" 
          value={formatINR(stats.dailyGross || "0")} 
          icon={<IndianRupee className="text-emerald-500" size={20} />}
          trend="Gross Sales" 
          color="emerald" 
        />
        <StatCard 
          title="Active Tokens" 
          value={activeOrders.length.toString()} 
          icon={<Users className="text-amber-500" size={20} />}
          trend="In Progress" 
          color="amber" 
        />
        <StatCard 
          title="Daily Net (Reconciled)" 
          value={formatINR(netProfit)} 
          icon={<TrendingUp className="text-blue-500" size={20} />}
          trend="After Expenses" 
          color="blue" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* 🔥 Kitchen Display System Grid */}
          <section className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-500 flex items-center gap-3">
                <Target size={14} className="text-rose-500" /> Priority Queue
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
              {activeOrders.length === 0 && (
                <div className="col-span-full py-24 text-center border-2 border-dashed border-slate-800 rounded-[3rem] text-slate-600 font-black uppercase tracking-widest italic text-sm">
                  Station Clean & Clear 🍳
                </div>
              )}
            </div>
          </section>

          {/* 📈 15-Day Revenue Trend */}
          <section className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <h3 className="font-black text-white text-xs uppercase italic tracking-tighter flex items-center gap-2">
                <BarChart3 size={16} className="text-amber-500" /> Revenue Velocity
              </h3>
            </div>
            
            <div className="flex items-end justify-between h-32 gap-2 px-2 relative z-10">
              {trendData.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-3 w-full group">
                  <div 
                    className="w-full bg-slate-800 group-hover:bg-amber-500 transition-all rounded-xl cursor-pointer relative" 
                    style={{ height: `${Math.max((Number(day.total) / 20000) * 100, 10)}%` }} 
                  >
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-950 text-[9px] font-black px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                        {formatINR(day.total)}
                     </div>
                  </div>
                  <span className="text-[8px] font-black text-slate-700 uppercase">
                    {new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Profit & Tax Analysis */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-8 shadow-2xl">
            <h3 className="font-black text-white mb-8 flex items-center justify-between uppercase italic tracking-tighter">
              Profit Ledger <MoreHorizontal size={18} className="text-slate-700" />
            </h3>
            <div className="space-y-8">
              <PeriodRow label="Today (Reconciled)" gross={stats.dailyGross} net={netProfit} />
              <PeriodRow label="Month-to-Date" gross={stats.monthlyGross} net={Number(stats.monthlyGross) * 0.45} /> 
            </div>
          </div>

          <div className="bg-amber-500 rounded-[3rem] p-8 text-slate-950 shadow-2xl shadow-amber-500/10">
            <h3 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-60">Tax & Accountant Note</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-slate-950/10 pb-4">
                <span className="text-[10px] font-black uppercase">GST (5%)</span>
                <span className="text-xl font-black italic tracking-tighter">
                  {formatINR(Number(stats.monthlyGross || 0) * 0.05)}
                </span>
              </div>
              <p className="text-[9px] font-bold leading-relaxed opacity-80 uppercase tracking-tight">
                Net profit estimates include COGS and operating expenses from reconciled days. Final figures subject to inventory audits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Helper Components ---

function PeriodRow({ label, gross, net }: any) {
  const isZero = Number(gross || 0) === 0;
  return (
    <div className="space-y-2.5 border-b border-slate-800/50 pb-6 last:border-0 last:pb-0">
      <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">{label}</p>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[8px] text-slate-700 uppercase font-black">Gross Revenue</p>
          <p className={cn("text-lg font-black tracking-tighter italic", isZero ? "text-slate-700" : "text-white")}>
            {formatINR(gross || 0)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[8px] text-emerald-900 uppercase font-black">Final Net</p>
          <p className={cn("text-lg font-black tracking-tighter italic", isZero ? "text-slate-700" : "text-emerald-500")}>
            {formatINR(net || 0)}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, color }: any) {
  const colorMap: any = {
    emerald: "text-emerald-500 border-emerald-500/20",
    amber: "text-amber-500 border-amber-500/20",
    blue: "text-blue-500 border-blue-500/20"
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-sm hover:border-slate-700 transition-all group relative overflow-hidden">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 group-hover:border-amber-500/30 transition-colors">{icon}</div>
        <span className={cn("text-[9px] font-black px-2.5 py-1 rounded-lg bg-slate-950 border uppercase tracking-widest", colorMap[color])}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-black uppercase tracking-widest">{title}</p>
        <p className="text-4xl font-black text-white mt-2 tracking-tighter italic leading-none">{value}</p>
      </div>
    </div>
  );
}