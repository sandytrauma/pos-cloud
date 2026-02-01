import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { formatINR, cn } from "@/lib/utils";
import { 
  TrendingUp, 
  Users, 
  IndianRupee, 
  Plus, 
  Clock, 
  MoreHorizontal 
} from "lucide-react";
import OrderCard from "@/components/kds/OrderCard"; // Client Component for interaction
import Link from "next/link";

export default async function Dashboard() {
  // Fetch real-time data from PostgreSQL
  const activeOrders = await db.query.orders.findMany({
    where: eq(orders.status, "RECEIVED"),
    with: { items: true },
    orderBy: [desc(orders.createdAt)],
  });

  // Aggregate stats for the top cards
  const todayStats = await db.select({
    revenue: sql<string>`sum(${orders.totalAmount})`,
    gst: sql<string>`sum(${orders.gstAmount})`,
    count: sql<number>`count(*)`,
  }).from(orders);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Live Kitchen</h1>
          <p className="text-slate-400">Real-time order synchronization for 2026 Operations.</p>
        </div>
        <Link 
          href="/dashboard/pos" 
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus size={20} /> NEW POS ORDER
        </Link>
      </div>

      {/* 📊 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Today's Revenue" 
          value={formatINR(todayStats[0]?.revenue || "0")} 
          icon={<IndianRupee className="text-emerald-500" />}
          trend="+12.5%" 
          color="emerald" 
        />
        <StatCard 
          title="Active Tokens" 
          value={activeOrders.length.toString()} 
          icon={<Users className="text-amber-500" />}
          trend="Live" 
          color="amber" 
        />
        <StatCard 
          title="GST Collected" 
          value={formatINR(todayStats[0]?.gst || "0")} 
          icon={<TrendingUp className="text-blue-500" />}
          trend="5% Rate" 
          color="blue" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 🔥 Live KDS Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-xl font-semibold flex items-center gap-3 text-white">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              Kitchen Display System
            </h2>
            <span className="text-xs text-slate-500 font-mono">RELOADS AUTOMATICALLY</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
            {activeOrders.length === 0 && (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500">
                All orders are prepared! 🍳
              </div>
            )}
          </div>
        </div>

        {/* 📈 Sidebar Analytics */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="font-bold text-white mb-6 flex items-center justify-between">
              Order Sources <MoreHorizontal size={18} className="text-slate-500" />
            </h3>
            <div className="space-y-6">
              <SourceBreakdown name="Zomato" value={65} color="bg-rose-500" />
              <SourceBreakdown name="Swiggy" value={25} color="bg-orange-500" />
              <SourceBreakdown name="Direct POS" value={10} color="bg-emerald-500" />
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Accountant's View</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Gross Sales</span>
                <span className="text-slate-300">{formatINR(todayStats[0]?.revenue || "0")}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">GST Deduction</span>
                <span className="text-rose-400">-{formatINR(todayStats[0]?.gst || "0")}</span>
              </div>
              <hr className="border-slate-800" />
              <div className="flex justify-between font-bold text-emerald-500">
                <span>Net Profit</span>
                <span>{formatINR(Number(todayStats[0]?.revenue || 0) - Number(todayStats[0]?.gst || 0))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-components ---

function StatCard({ title, value, icon, trend, color }: any) {
  const colorMap: any = {
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    blue: "text-blue-500"
  };

  return (
    <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm hover:border-slate-700 transition-colors">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">{icon}</div>
        <span className={cn("text-xs font-bold px-2 py-1 rounded bg-slate-950 border border-slate-800", colorMap[color])}>
          {trend}
        </span>
      </div>
      <div>
        <p className="text-sm text-slate-400 font-medium">{title}</p>
        <p className="text-3xl font-bold text-white mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function SourceBreakdown({ name, value, color }: { name: string, value: number, color: string }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm font-medium text-slate-300">
        <span>{name}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}