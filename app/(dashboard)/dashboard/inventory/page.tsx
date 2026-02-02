import { db } from "@/db";
import { inventory } from "@/db/schema";
import UpdateStockButton from "@/components/inventory/UpdateStockButton";
import { cn } from "@/lib/utils";
import AddInventoryModal from "@/components/inventory/AddInventoryModal";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const stock = await db.query.inventory.findMany({
    orderBy: (items, { asc }) => [asc(items.name)],
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
            Stock <span className="text-amber-500">Ledger</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium tracking-tight">
            Manual tracking for kitchen raw materials.
          </p>
        </div>
        
        {/* Registration Button Placeholder */}
        <div className="hidden md:block">
           <div className="h-12 w-32 bg-slate-900/50 rounded-2xl border border-slate-800 border-dashed flex items-center justify-center">
             <AddInventoryModal />
           </div>
        </div>
      </header>

      <div className="grid gap-4">
        {stock.map((item) => {
          const currentStock = Number(item.currentStock) || 0;
          const minStock = Number(item.minStockLevel) || 0;
          const isLow = currentStock <= minStock;
          
          return (
            <div 
              key={item.id} 
              className="bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between hover:border-slate-600 transition-all group relative overflow-hidden"
            >
              {/* Subtle accent for low stock */}
              {isLow && <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-500" />}

              <div className="flex flex-col gap-1">
                <span className="text-white font-black text-xl tracking-tight group-hover:text-amber-500 transition-colors uppercase">
                  {item.name}
                </span>
                
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                    isLow ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-500"
                  )}>
                    <span className={cn("h-1.5 w-1.5 rounded-full", isLow ? "bg-rose-500 animate-pulse" : "bg-emerald-500")} />
                    {isLow ? "Low Stock" : "In Stock"}
                  </span>
                  <span className="text-slate-600 text-[10px] uppercase font-black tracking-widest">
                    Unit: {item.unit} • Alert @ {item.minStockLevel}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-6 md:gap-10">
                <div className="text-right">
                  <p className={cn(
                    "text-4xl font-black tracking-tighter leading-none",
                    isLow ? "text-rose-500" : "text-white"
                  )}>
                    {item.currentStock}
                  </p>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">
                    Balance
                  </p>
                </div>
                
                {/* THE TRIGGER BUTTON - Placed clearly at the end of the row */}
                <UpdateStockButton item={item} />
              </div>
            </div>
          );
        })}

        {stock.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-950/50">
            <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-xs">
              Ledger Empty
            </p>
          </div>
        )}
      </div>
    </div>
  );
}