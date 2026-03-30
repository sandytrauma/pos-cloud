import { db } from "@/db";
import { inventory } from "@/db/schema";
import UpdateStockButton from "@/components/inventory/UpdateStockButton";
import { cn } from "@/lib/utils";
import AddInventoryModal from "@/components/inventory/AddInventoryModal";
import { Package, AlertTriangle, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const stock = await db.query.inventory.findMany({
    orderBy: (items, { asc }) => [asc(items.name)],
  });

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-10">
      <header className="flex flex-row items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
            Stock <span className="text-amber-500">Ledger</span>
          </h1>
          <p className="text-slate-500 text-[10px] md:text-sm font-medium tracking-tight mt-1 uppercase">
            Raw Material Tracking
          </p>
        </div>
        
        {/* Registration Button - Now visible on mobile but styled for touch */}
        <div className="shrink-0">
           <div className="bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed hover:border-amber-500/50 transition-colors">
             <AddInventoryModal />
           </div>
        </div>
      </header>

      <div className="grid gap-3 md:gap-4">
        {stock.map((item) => {
          const currentStock = Number(item.currentStock) || 0;
          const minStock = Number(item.minStockLevel) || 0;
          const isLow = currentStock <= minStock;
          
          return (
            <div 
              key={item.id} 
              className="bg-slate-900 border border-slate-800 p-4 md:p-6 rounded-[2rem] md:rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between hover:border-slate-600 transition-all group relative overflow-hidden active:scale-[0.98] md:active:scale-100"
            >
              {/* Left Accent Bar */}
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-1.5",
                isLow ? "bg-rose-500 shadow-[2px_0_10px_rgba(244,63,94,0.4)]" : "bg-slate-800"
              )} />

              <div className="flex flex-col gap-1 w-full md:w-auto mb-4 md:mb-0 pl-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-lg md:text-xl tracking-tight group-hover:text-amber-500 transition-colors uppercase truncate max-w-[200px] md:max-w-none">
                    {item.name}
                  </span>
                  {isLow && <AlertTriangle size={14} className="text-rose-500 animate-pulse md:hidden" />}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-3">
                  <span className={cn(
                    "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    isLow 
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20" 
                      : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  )}>
                    {isLow ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                    {isLow ? "Low Stock" : "In Stock"}
                  </span>
                  <span className="text-slate-500 text-[9px] uppercase font-black tracking-widest bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800/50">
                    {item.unit} • Alert @ {item.minStockLevel}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-10 bg-slate-950/50 md:bg-transparent p-3 md:p-0 rounded-2xl border border-slate-800/50 md:border-none">
                <div className="text-left md:text-right pl-2 md:pl-0">
                  <p className={cn(
                    "text-3xl md:text-4xl font-black tracking-tighter leading-none italic",
                    isLow ? "text-rose-500" : "text-amber-500"
                  )}>
                    {item.currentStock}
                  </p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-0.5">
                    Current Balance
                  </p>
                </div>
                
                {/* Thumb-ready trigger button */}
                <div className="scale-110 md:scale-100">
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