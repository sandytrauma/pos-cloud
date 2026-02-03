import { db } from "@/db";
import { categories, menuItems } from "@/db/schema";
import AddCategoryModal from "@/components/menu/AddCategoryModal";
import AddMenuItemModal from "@/components/menu/AddMenuItemModal";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export default async function MenuPage() {
  const allCategories = await db.query.categories.findMany({
    with: { items: true }, // Ensure you define relations in schema
    orderBy: (cat, { asc }) => [asc(cat.order)],
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic">
            Digital <span className="text-amber-500">Menu</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">Manage dishes, categories, and pricing.</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <AddCategoryModal />
          <AddMenuItemModal categories={allCategories} />
        </div>
      </header>

      <div className="space-y-10">
        {allCategories.map((cat) => (
          <section key={cat.id} className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-slate-400 font-black uppercase tracking-widest text-sm">{cat.name}</h2>
              <div className="h-[1px] grow bg-slate-800" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Fetching items for this category */}
              <MenuItemsList categoryId={cat.id} />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

// Sub-component to fetch items per category
async function MenuItemsList({ categoryId }: { categoryId: number }) {
  const items = await db.select().from(menuItems).where(eq(menuItems.categoryId, categoryId));

  return (
    <>
      {items.map((item) => (
        <div key={item.id} className="bg-slate-900 border border-slate-800 p-5 rounded-[2rem] flex justify-between items-center group hover:border-amber-500/50 transition-all">
          <div className="flex flex-col">
            <span className="text-white font-bold text-lg">{item.name}</span>
            <span className="text-amber-500 font-black tracking-tighter text-xl">₹{item.price}</span>
          </div>
          <button className="h-12 w-12 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-500 hover:text-white border border-slate-800">
             {/* Edit Icon */}
             <span className="text-[10px] font-bold">EDIT</span>
          </button>
        </div>
      ))}
    </>
  );
}