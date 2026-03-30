import { db } from "@/db";
import { categories, menuItems } from "@/db/schema";
import AddCategoryModal from "@/components/menu/AddCategoryModal";
import AddMenuItemModal from "@/components/menu/AddMenuItemModal";
import EditMenuItemModal from "@/components/menu/EditMenuItemModal";
import { eq, asc } from "drizzle-orm";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const allCategories = await db.query.categories.findMany({
    orderBy: [asc(categories.order)],
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
            Digital <span className="text-amber-500">Menu</span>
          </h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.2em] mt-1">
            Costing & Pricing Engine
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <AddCategoryModal />
          <AddMenuItemModal categories={allCategories} />
        </div>
      </header>

      <div className="space-y-12">
        {allCategories.map((cat) => (
          <section key={cat.id} className="space-y-6">
            <div className="flex items-center gap-4 px-1">
              <h2 className="text-slate-500 font-black uppercase tracking-widest text-[10px]">
                {cat.name}
              </h2>
              <div className="h-[1px] grow bg-slate-800/30" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MenuItemsList categoryId={cat.id} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

async function MenuItemsList({ categoryId }: { categoryId: number }) {
  const items = await db.select().from(menuItems).where(eq(menuItems.categoryId, categoryId));

  return (
    <>
      {items.map((item) => {
        const sellingPrice = Number(item.price || 0);
        const costPrice = Number(item.costPrice || 0);
        const profit = sellingPrice - costPrice;
        const margin = sellingPrice > 0 ? Math.round((profit / sellingPrice) * 100) : 0;

        return (
          <div 
            key={item.id} 
            className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] flex justify-between items-center group hover:border-amber-500/30 transition-all active:scale-[0.98] relative overflow-hidden"
          >
            {/* Background Margin Indicator */}
            <div 
              className={cn(
                "absolute bottom-0 left-0 h-1 transition-all duration-1000",
                margin > 60 ? "bg-emerald-500" : margin > 30 ? "bg-amber-500" : "bg-rose-500"
              )} 
              style={{ width: `${margin}%` }} 
            />

            <div className="flex flex-col gap-1">
              <span className="text-white font-black text-base uppercase tracking-tighter group-hover:text-amber-500 transition-colors leading-tight">
                {item.name}
              </span>
              
              <div className="flex items-center gap-3 mt-1">
                <span className="text-amber-500 font-black tracking-tighter text-xl italic leading-none">
                  ₹{sellingPrice}
                </span>
                <div className="h-3 w-[1px] bg-slate-800" />
                <div className="flex flex-col">
                  <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest leading-none">Cost</span>
                  <span className="text-[11px] text-slate-400 font-bold leading-none">₹{costPrice}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
               <EditMenuItemModal item={item} />
               <div className={cn(
                 "text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest",
                 margin > 50 ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-950 text-slate-500 border border-slate-800"
               )}>
                 {margin}% Margin
               </div>
            </div>
          </div>
        );
      })}
    </>
  );
}