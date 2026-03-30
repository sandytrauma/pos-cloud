import { db } from "@/db";
import { inventory } from "@/db/schema";
import UpdateStockButton from "@/components/inventory/UpdateStockButton";
import { cn, formatINR } from "@/lib/utils";
import AddInventoryModal from "@/components/inventory/AddInventoryModal";
import { Package, AlertTriangle, CheckCircle2, CalendarClock, Zap } from "lucide-react";
import { format, isBefore, addDays, startOfDay } from "date-fns";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const stock = await db.query.inventory.findMany({
    orderBy: (items, { asc }) => [asc(items.name)],
  });

  // Calculate total financial value of all stock items
  const totalLedgerValue = stock.reduce((acc, item) => {
    const qty = Number(item.currentStock) || 0;
    // @ts-ignore - unitPrice might be missing from base type but present in DB
    const price = Number(item.unitPrice) || 0;
    return acc + (qty * price);
  }, 0);

  const today = startOfDay(new Date());

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
            Stock <span className="text-amber-500">Ledger</span>
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">
              Inventory Assets:
            </p>
            <span className="text-emerald-500 text-[10px] font-black tracking-widest uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              {formatINR(totalLedgerValue)}
            </span>
          </div>
        </div>
        
        <div className="shrink-0">
          <AddInventoryModal />
        </div>
      </header>

      <div className="grid gap-3 md:gap-4">
        {stock.map((item) => {
          const currentStock = Number(item.currentStock) || 0;
          const minStock = Number(item.minStockLevel) || 0;
          // @ts-ignore
          const unitPrice = Number(item.unitPrice) || 0;
          const stockValue = currentStock * unitPrice;
          
          // Logic for Expiry Status
          const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
          const isExpired = expiryDate && isBefore(expiryDate, today);
          const isExpiringSoon = expiryDate && !isExpired && isBefore(expiryDate, addDays(today, 3));
          const isLow = currentStock <= minStock;
          
          return (
            <div 
              key={item.id} 
              className={cn(
                "bg-slate-900 border p-4 md:p-6 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row items-start md:items-center justify-between transition-all group relative overflow-hidden active:scale-[0.98] md:active:scale-100",
                isExpired ? "border-rose-500/40 bg-rose-500/[0.02]" : "border-slate-800 hover:border-slate-700"
              )}
            >
              {/* Status Indicator Bar (Left) */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-2 transition-colors",
                isExpired ? "bg-rose-600 shadow-[4px_0_15px_rgba(225,29,72,0.4)]" : 
                isExpiringSoon ? "bg-amber-500 animate-pulse" : 
                isLow ? "bg-rose-500" : "bg-slate-800"
              )} />

              <div className="flex flex-col gap-1 w-full md:w-auto mb-4 md:mb-0 pl-4">
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-lg md:text-xl tracking-tight group-hover:text-amber-500 transition-colors uppercase italic truncate max-w-[200px] md:max-w-none">
                    {item.name}
                  </span>
                  {isExpiringSoon && <Zap size={14} className="text-amber-500 fill-amber-500 animate-bounce" />}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  {/* Stock Status Badge */}
                  <span className={cn(
                    "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    isLow || isExpired 
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  )}>
                    {isExpired ? <AlertTriangle size={10} /> : isLow ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                    {isExpired ? "Expired" : isLow ? "Low Stock" : "In Stock"}
                  </span>

                  {/* Expiry Badge */}
                  {expiryDate && (
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border flex items-center gap-1",
                      isExpired 
                        ? "bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-900/20" 
                        : isExpiringSoon 
                          ? "bg-amber-500/20 text-amber-500 border-amber-500/30"
                          : "bg-slate-950 text-slate-400 border-slate-800"
                    )}>
                      <CalendarClock size={10} />
                      {format(expiryDate, "dd MMM yy")}
                    </span>
                  )}

                  {/* Financial Label */}
                  <span className="text-slate-500 text-[9px] uppercase font-black tracking-widest bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800/50">
                    {item.unit} • Value: {formatINR(stockValue)}
                  </span>
                </div>
              </div>
              
              {/* Quantitative Section */}
              <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-10 bg-slate-950/50 md:bg-transparent p-3 md:p-0 rounded-2xl border border-slate-800/50 md:border-none">
                <div className="text-left md:text-right pl-2 md:pl-0">
                  <p className={cn(
                    "text-3xl md:text-5xl font-black tracking-tighter leading-none italic",
                    isLow || isExpired ? "text-rose-500" : "text-white group-hover:text-amber-500 transition-colors"
                  )}>
                    {item.currentStock}
                  </p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">
                    Qty Remaining
                  </p>
                </div>
                
                <div className="scale-110 md:scale-100 pr-2 md:pr-0">
                  <UpdateStockButton item={item} />
                </div>
              </div>
            </div>
          );
        })}

        {stock.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-950/50 flex flex-col items-center justify-center">
            <Package size={40} className="text-slate-800 mb-4" />
            <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-xs">
              Ledger Empty
            </p>
          </div>
        )}
      </div>
    </div>
  );
}