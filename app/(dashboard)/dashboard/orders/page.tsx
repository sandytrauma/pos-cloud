import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc, ilike, or, and, gte, lte } from "drizzle-orm";
import ReprintButton from "@/components/orders/ReprintButton";
import { cn, formatINR } from "@/lib/utils";
import OrderSearch from "@/components/orders/OrderSearch";
import { Clock, Calendar as CalendarIcon, History } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrdersPage(props: {
  searchParams: Promise<{ query?: string; from?: string; to?: string }>;
}) {
  const searchParams = await props.searchParams;
  const query = searchParams.query || "";
  
  // Parse Dates from SearchParams
  const fromDate = searchParams.from ? new Date(searchParams.from) : undefined;
  const toDate = searchParams.to ? new Date(searchParams.to) : undefined;

  // If a 'to' date exists, set it to the very end of that day (23:59:59)
  if (toDate) {
    toDate.setHours(23, 59, 59, 999);
  }

  const data = await db
    .select()
    .from(orders)
    .where(
      and(
        // Filter by Phone or Token
        query 
          ? or(
              ilike(orders.customerPhone, `%${query}%`),
              ilike(orders.tokenNumber, `%${query}%`)
            )
          : undefined,
        // Filter by Date Range
        fromDate ? gte(orders.createdAt, fromDate) : undefined,
        toDate ? lte(orders.createdAt, toDate) : undefined
      )
    )
    .orderBy(desc(orders.createdAt));

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
            <History size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
              Order <span className="text-amber-500">History</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Audit & Token Management</p>
          </div>
        </div>
        
        {/* Pass params to the Client Search Component */}
        <OrderSearch 
          defaultValue={query} 
          from={searchParams.from} 
          to={searchParams.to} 
        />
      </header>

      <div className="grid gap-3" key={`${query}-${searchParams.from}-${searchParams.to}`}>
        {data.length === 0 ? (
          <div className="py-24 text-center bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-800 flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-4">
              <History size={32} />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">No records found</p>
            <p className="text-slate-700 text-[10px] font-bold mt-1 uppercase">Try adjusting your date filters or search term</p>
          </div>
        ) : (
          data.map((order) => {
            const orderDate = new Date(order.createdAt!);
            
            const timeStr = orderDate.toLocaleTimeString('en-IN', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: true 
            });
            const dateStr = orderDate.toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });

            return (
              <div 
                key={order.id} 
                className="group bg-slate-900 border border-slate-800/60 p-5 rounded-[2.5rem] flex items-center justify-between hover:bg-slate-800/30 hover:border-amber-500/40 transition-all shadow-xl active:scale-[0.98]"
              >
                {/* Left: Identity & Source */}
                <div className="flex items-center gap-6">
                  <div className="h-16 w-16 rounded-[1.5rem] bg-slate-950 flex flex-col items-center justify-center border border-slate-800 group-hover:border-amber-500/20 transition-colors shrink-0">
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter mb-0.5">Source</span>
                    <span className="text-amber-500 font-black text-lg italic leading-none">
                      {(order?.source ?? "P")[0]}
                    </span>
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-black text-white text-2xl tracking-tighter italic leading-none">
                        {order.tokenNumber}
                      </span>
                      <span className={cn(
                        "text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border",
                        order.source === 'ZOMATO' 
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                          : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                      )}>
                        {order.source}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-[0.15em]">
                      <span className="flex items-center gap-1.5"><CalendarIcon size={12} className="text-slate-700" /> {dateStr}</span>
                      <span className="flex items-center gap-1.5"><Clock size={12} className="text-slate-700" /> {timeStr}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Price, Status & Reprint */}
                <div className="flex items-center gap-10">
                  <div className="text-right hidden sm:block shrink-0">
                    <p className="text-white font-black text-xl tracking-tighter mb-0.5">{formatINR(Number(order.totalAmount))}</p>
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-widest",
                      order.status === 'COMPLETED' ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {order.status}
                    </p>
                  </div>
                  
                  <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 group-hover:border-amber-500/40 transition-all">
                    <ReprintButton order={order} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}