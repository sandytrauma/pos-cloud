// Location: app/(dashboard)/dashboard/menu/MenuClientViewLayout.tsx
"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface ClientCategory {
  id: string | number;
  name: string;
  order?: number | null;
}

interface ClientMenuItem {
  id: string | number;
  categoryId: string | number | null;
  name: string;
  price: string | number;
  costPrice?: string | number | null;
}

interface MenuClientViewLayoutProps {
  categories: ClientCategory[];
  menuItems: ClientMenuItem[];
  onAddCategory: (name: string) => Promise<any>;
  onAddMenuItem: (formData: FormData) => Promise<any>;
  onUpdateMenuItem: (formData: FormData) => Promise<any>;
}

export default function MenuClientViewLayout({
  categories = [],
  menuItems = [],
  onAddCategory,
  onAddMenuItem,
  onUpdateMenuItem,
}: MenuClientViewLayoutProps) {

  // Native Indian Rupee Formatter utility block
  const safeFormatCurrency = (val: number) => {
    if (isNaN(val) || val === null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(val);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative z-10">
      {/* Header Panel */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 px-1">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
            Digital <span className="text-amber-500">Menu</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
            Costing & Pricing Engine
          </p>
        </div>

        {/* INLINE FORMS DIRECTLY ACCESSIBLE IN THE HEADER ROW CONTAINER */}
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto relative z-20">
          {/* Add Category Trigger Form */}
          <form
            action={async (formData: FormData) => {
              const name = formData.get("categoryName") as string;
              if (name?.trim()) await onAddCategory(name);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              name="categoryName"
              placeholder="Category Name"
              required
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-500/40 w-32"
            />
            <button type="submit" className="px-3 py-2 bg-slate-900 border border-slate-800 text-amber-500 hover:border-amber-500/30 font-black text-xs uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md shrink-0">+ Cat</button>
          </form>

          {/* Add Menu Item Trigger Form */}
          <form action={onAddMenuItem} className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-xl shadow-inner">
            <input type="text" name="name" placeholder="Dish Name" required className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-700 outline-none focus:border-amber-500/40 w-24" />
            <input type="number" step="0.01" name="price" placeholder="Price" required className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-700 outline-none focus:border-amber-500/40 w-16" />
            <input type="number" step="0.01" name="costPrice" placeholder="Cost" className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white placeholder:text-slate-700 outline-none focus:border-amber-500/40 w-16" />
            <select name="categoryId" required className="bg-slate-950 border border-slate-800 rounded-lg px-1 py-1 text-xs text-slate-400 outline-none focus:border-amber-500/40">
              <option value="">Section</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <button type="submit" className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded-lg hover:bg-amber-400 transition-all active:scale-95 shrink-0">+ Item</button>
          </form>
        </div>
      </header>

      {/* Catalog Layout Stack */}
      <div className="space-y-12">
        {categories.map((cat) => {
          const itemsInSection = menuItems.filter((item) => String(item.categoryId) === String(cat.id));

          return (
            <section key={cat.id} className="space-y-6">
              <div className="flex items-center gap-4 px-1">
                <h2 className="text-slate-500 font-black uppercase tracking-widest text-[10px]">
                  {cat.name} ({itemsInSection.length})
                </h2>
                <div className="h-[1px] grow bg-slate-800/30" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itemsInSection.map((item) => {
                  const sellingPrice = Number(item.price || 0);
                  const costPrice = Number(item.costPrice || 0);
                  const profit = sellingPrice - costPrice;
                  const margin = sellingPrice > 0 ? Math.round((profit / sellingPrice) * 100) : 0;

                  return (
                    <div 
                      key={item.id} 
                      className="bg-slate-900 border border-slate-800 p-6 rounded-[2.5rem] flex justify-between items-center group hover:border-amber-500/30 transition-all active:scale-[0.98] relative overflow-hidden shadow-xl"
                    >
                      <div 
                        className={cn(
                          "absolute bottom-0 left-0 h-1 transition-all duration-1000 opacity-60",
                          margin > 60 ? "bg-emerald-500" : margin > 30 ? "bg-amber-500" : "bg-rose-500"
                        )} 
                        style={{ width: `${Math.min(100, Math.max(0, margin))}%` }} 
                      />

                      <div className="flex flex-col gap-1 pr-2 truncate">
                        <span className="text-white font-black text-base uppercase tracking-tighter group-hover:text-amber-500 transition-colors leading-tight truncate">
                          {item.name}
                        </span>
                        
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-amber-500 font-black tracking-tighter text-xl italic leading-none">
                            {safeFormatCurrency(sellingPrice)}
                          </span>
                          <div className="h-3 w-[1px] bg-slate-800/80" />
                          <div className="flex flex-col">
                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest leading-none">Cost</span>
                            <span className="text-[11px] text-slate-400 font-bold leading-none mt-0.5">
                              {safeFormatCurrency(costPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Inline pricing updating system fields */}
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <form action={onUpdateMenuItem} className="flex items-center gap-1">
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="name" value={item.name} />
                          <input type="number" step="0.01" name="price" defaultValue={item.price} required className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-amber-500 font-black outline-none w-14 text-right" />
                          <input type="number" step="0.01" name="costPrice" defaultValue={item.costPrice || ""} className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-[11px] text-slate-400 font-bold outline-none w-12 text-right" />
                          <button type="submit" className="px-1.5 py-0.5 bg-slate-950 border border-slate-800 text-slate-500 hover:text-white text-[9px] font-black uppercase rounded">Save</button>
                        </form>

                        <div className={cn(
                          "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest shadow-inner",
                          margin > 50 ? "bg-emerald-500/10 text-emerald-500" : "bg-slate-950 text-slate-500"
                        )}>
                          {margin}% Margin
                        </div>
                      </div>
                    </div>
                  );
                })}

                {itemsInSection.length === 0 && (
                  <div className="col-span-full py-10 text-center border border-dashed border-slate-800/60 rounded-[2rem] text-slate-600 text-[10px] font-black uppercase tracking-widest">
                    No active dishes matching this section.
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}