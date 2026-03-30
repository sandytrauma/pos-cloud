import { db } from "@/db";
import { categories, menuItems } from "@/db/schema";
import AddCategoryModal from "@/components/menu/AddCategoryModal";
import AddMenuItemModal from "@/components/menu/AddMenuItemModal";
import EditMenuItemModal from "@/components/menu/EditMenuItemModal"; // Import this
import { eq } from "drizzle-orm";
import { Pencil } from "lucide-react"; // Better for thumb-targets

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const allCategories = await db.query.categories.findMany({
    with: { items: true }, 
    orderBy: (cat, { asc }) => [asc(cat.order)],
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
            Digital <span className="text-amber-500">Menu</span>
          </h1>
          <p className="text-slate-500 text-xs md:text-sm font-medium mt-1">Manage dishes, categories, and pricing.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <AddCategoryModal />
          <AddMenuItemModal categories={allCategories} />
        </div>
      </header>

      <div className="space-y-10">
        {allCategories.map((cat) => (
          <section key={cat.id} className="space-y-4">
            <div className="flex items-center gap-4 px-1">
              <h2 className="text-slate-500 font-black uppercase tracking-widest text-[10px]">{cat.name}</h2>
              <div className="h-[1px] grow bg-slate-800/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
      {items.map((item) => (
        <div 
          key={item.id} 
          className="bg-slate-900 border border-slate-800 p-5 rounded-[2rem] flex justify-between items-center group hover:border-amber-500/30 transition-all active:scale-[0.98]"
        >
          <div className="flex flex-col gap-1">
            <span className="text-white font-bold text-base md:text-lg uppercase tracking-tight">{item.name}</span>
            <span className="text-amber-500 font-black tracking-tighter text-xl italic">₹{item.price}</span>
          </div>
          
          {/* UPDATED: Thumb-ready Edit Modal Trigger */}
          <div className="shrink-0">
             <EditMenuItemModal item={item} />
          </div>
        </div>
      ))}
    </>
  );
}