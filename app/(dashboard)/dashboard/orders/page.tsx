import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc, ilike, or } from "drizzle-orm";
import ReprintButton from "@/components/orders/ReprintButton";
import { cn, formatINR } from "@/lib/utils";
import { Search } from "lucide-react";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { query?: string };
}) {
  const query = searchParams?.query || "";

  const data = await db
    .select()
    .from(orders)
    .where(
      or(
        ilike(orders.customerPhone, `%${query}%`),
        ilike(orders.tokenNumber, `%${query}%`)
      )
    )
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">ORDER HISTORY</h1>
          <p className="text-slate-500 text-sm">Manage and reprint your kitchen tokens.</p>
        </div>
        
        {/* Search Bar */}
        <form className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-amber-500 transition-colors" size={18} />
          <input
            name="query"
            placeholder="Search phone or token..."
            defaultValue={query}
            className="w-full md:w-80 bg-slate-900 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm focus:border-amber-500 outline-none transition-all"
          />
        </form>
      </header>

      <div className="grid gap-3">
        {data.map((order) => (
          <div 
            key={order.id} 
            className="group bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between hover:bg-slate-800/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center font-black text-amber-500 border border-slate-700">
                {(order?.source ?? "?")[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-lg">{order.tokenNumber}</span>
                  <span className={cn(
                    "text-[10px] px-2 py-0.5 rounded font-bold uppercase",
                    order.source === 'ZOMATO' ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    {order.source}
                  </span>
                </div>
                <p className="text-slate-500 text-xs">{order.customerPhone || "Walk-in Customer"}</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right hidden sm:block">
                <p className="text-white font-bold">{formatINR(Number(order.totalAmount))}</p>
                <p className="text-slate-600 text-[10px]">{new Date(order.createdAt!).toLocaleTimeString()}</p>
              </div>
              <ReprintButton order={order} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}