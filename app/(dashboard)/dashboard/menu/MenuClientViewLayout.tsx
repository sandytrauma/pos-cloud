// Location: app/(dashboard)/dashboard/menu/MenuClientViewLayout.tsx
"use client";

import React, { useState, useMemo, useTransition } from "react";
import { 
  Utensils, Plus, FolderPlus, Search, X, 
  TrendingUp, IndianRupee, Layers, 
  Edit3, Trash2
} from "lucide-react";
import { formatINR, cn } from "@/lib/utils";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogTrigger, 
  DialogTitle, DialogDescription 
} from "@/components/ui/dialog";

interface ClientCategory {
  id: string | number;
  name: string;
  order?: number | null;
}

interface ClientMenuItem {
  id: string | number;
  categoryId: string | number | null;
  name: string;
  description?: string | null;
  price: number;
  costPrice?: number | null;
  isAvailable?: boolean;
}

interface MenuClientViewLayoutProps {
  categories: ClientCategory[];
  menuItems: ClientMenuItem[];
  onAddCategory: (name: string) => Promise<{ success: boolean; error?: string }>;
  onAddMenuItem: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  onUpdateMenuItem: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  onToggleAvailability: (id: number, isAvailable: boolean) => Promise<{ success: boolean; error?: string }>;
  onDeleteMenuItem: (id: number) => Promise<{ success: boolean; error?: string }>;
}

export default function MenuClientViewLayout({
  categories = [],
  menuItems = [],
  onAddCategory,
  onAddMenuItem,
  onUpdateMenuItem,
  onToggleAvailability,
  onDeleteMenuItem,
}: MenuClientViewLayoutProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingItemId, setEditingItemId] = useState<string | number | null>(null);

  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory = 
        selectedCategoryId === "ALL" || 
        String(item.categoryId) === String(selectedCategoryId);

      const matchesSearch = 
        !searchQuery.trim() || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, selectedCategoryId, searchQuery]);

  const metrics = useMemo(() => {
    const totalItems = menuItems.length;
    if (totalItems === 0) return { avgPrice: 0, avgMargin: 0, availableCount: 0 };

    const totalPrice = menuItems.reduce((sum, item) => sum + Number(item.price || 0), 0);
    const avgPrice = totalPrice / totalItems;

    let totalMarginPercent = 0;
    menuItems.forEach((item) => {
      const price = Number(item.price || 0);
      const cost = Number(item.costPrice || 0);
      const margin = price > 0 ? ((price - cost) / price) * 100 : 0;
      totalMarginPercent += Math.max(0, margin);
    });
    const avgMargin = Math.round(totalMarginPercent / totalItems);
    const availableCount = menuItems.filter((i) => i.isAvailable !== false).length;

    return { avgPrice, avgMargin, availableCount };
  }, [menuItems]);

  const categoryMap = useMemo(() => {
    const map = new Map<string, string>();
    categories.forEach((cat) => map.set(String(cat.id), cat.name));
    return map;
  }, [categories]);

  const handleToggle = (id: number, currentAvailable: boolean) => {
    startTransition(async () => {
      try {
        const res = await onToggleAvailability(id, !currentAvailable);
        if (res.success) {
          toast.success(!currentAvailable ? "Dish marked Available" : "Dish marked 86 (Out of Stock)");
        } else {
          toast.error(res.error || "Failed to toggle status");
        }
      } catch (err) {
        toast.error("Network error toggling status");
      }
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from the menu?`)) return;

    startTransition(async () => {
      try {
        const res = await onDeleteMenuItem(id);
        if (res.success) {
          toast.success(`"${name}" deleted from menu.`);
        } else {
          toast.error(res.error || "Failed to delete item");
        }
      } catch (err) {
        toast.error("Error deleting dish");
      }
    });
  };

  const handleCreateCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("categoryName") as string)?.trim();
    if (!name) return;

    startTransition(async () => {
      try {
        const res = await onAddCategory(name);
        if (res.success) {
          toast.success(`Category "${name}" created!`);
          setIsAddCategoryOpen(false);
        } else {
          toast.error(res.error || "Failed to create category");
        }
      } catch (err) {
        toast.error("Network communication error");
      }
    });
  };

  const handleCreateDish = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const res = await onAddMenuItem(formData);
        if (res.success) {
          toast.success("New dish successfully added to menu!");
          setIsAddDishOpen(false);
        } else {
          toast.error(res.error || "Failed to add dish");
        }
      } catch (err) {
        toast.error("Error saving dish");
      }
    });
  };

  const handleUpdatePrice = async (e: React.FormEvent<HTMLFormElement>, item: ClientMenuItem) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append("id", String(item.id));
    formData.append("name", item.name);

    startTransition(async () => {
      try {
        const res = await onUpdateMenuItem(formData);
        if (res.success) {
          toast.success(`Pricing updated for "${item.name}"`);
          setEditingItemId(null);
        } else {
          toast.error(res.error || "Failed to update pricing");
        }
      } catch (err) {
        toast.error("Error saving pricing update");
      }
    });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      
      {/* 1. ADAPTIVE HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-5 sm:p-7 rounded-[2rem] shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
              <Utensils size={20} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-white uppercase italic tracking-tight leading-none">
                Digital <span className="text-amber-400">Menu</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                Recipe Costing & Multi-Channel Availability Engine
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons: Full-Width on Mobile, Inline on Desktop */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Add Category Dialog */}
          <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
            <DialogTrigger asChild>
              <button 
                type="button"
                className="flex-1 sm:flex-none h-12 px-4 sm:px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
              >
                <FolderPlus size={16} className="text-amber-400" />
                <span>+ Category</span>
              </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl max-w-md w-[92%]">
              <DialogTitle className="text-xl font-black text-white uppercase italic">
                Create Menu <span className="text-amber-400">Category</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Organize menu items by sections (e.g. Starters, Tandoor, Mains, Beverages).
              </DialogDescription>
              <form onSubmit={handleCreateCategory} className="space-y-4 pt-3">
                <input
                  type="text"
                  name="categoryName"
                  placeholder="e.g. Tandoori Kebabs & Chaap"
                  required
                  autoFocus
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-400 transition-colors"
                />
                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                  {isPending ? "Creating..." : "Save Category"}
                </button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Add Dish Dialog */}
          <Dialog open={isAddDishOpen} onOpenChange={setIsAddDishOpen}>
            <DialogTrigger asChild>
              <button 
                type="button"
                className="flex-1 sm:flex-none h-12 px-5 sm:px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-amber-500/25"
              >
                <Plus size={16} strokeWidth={3} />
                <span>+ New Dish</span>
              </button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border border-slate-800 p-6 sm:p-8 rounded-[2.5rem] shadow-2xl max-w-lg w-[92%] max-h-[90vh] overflow-y-auto">
              <DialogTitle className="text-2xl font-black text-white uppercase italic">
                Register New <span className="text-amber-400">Dish</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                Add an artisanal item, define pricing and cost to monitor profit margins.
              </DialogDescription>
              
              <form onSubmit={handleCreateDish} className="space-y-4 pt-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Dish Name *</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="e.g. Soya Chaap Gravy"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none focus:border-amber-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Selling Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="price"
                      placeholder="e.g. 280"
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-slate-600 outline-none focus:border-amber-400"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cost Price (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="costPrice"
                      placeholder="e.g. 85"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-mono placeholder:text-slate-600 outline-none focus:border-amber-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Category *</label>
                  <select
                    name="categoryId"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-amber-400"
                  >
                    <option value="">Select Section</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Kitchen Description / Notes</label>
                  <textarea
                    name="description"
                    rows={2}
                    placeholder="Short description of ingredients, marinade, or culinary prep..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-400 resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPending}
                  className="w-full h-13 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-xl shadow-amber-500/25 active:scale-95 disabled:opacity-50 mt-2"
                >
                  {isPending ? "Saving..." : "Add to Menu"}
                </button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 2. RESPONSIVE METRIC ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
              Available Dishes
            </span>
            <p className="text-2xl sm:text-3xl font-black text-white italic tracking-tight">
              {metrics.availableCount} <span className="text-xs not-italic font-mono text-slate-500">/ {menuItems.length}</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
            <Layers size={18} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
              Avg. Ticket Price
            </span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 italic tracking-tight">
              {formatINR(metrics.avgPrice)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400">
            <IndianRupee size={18} />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between">
          <div>
            <span className="text-[9.5px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">
              Avg. Gross Margin
            </span>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 italic tracking-tight">
              {metrics.avgMargin}%
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400">
            <TrendingUp size={18} />
          </div>
        </div>
      </div>

      {/* 3. MULTI-SCREEN SEARCH & SWIPEABLE CATEGORY BAR */}
      <div className="space-y-3.5">
        <div className="relative w-full">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search menu dishes by name, spice, ingredient..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-10 py-3.5 text-xs sm:text-sm text-white placeholder:text-slate-500 outline-none focus:border-amber-400 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Horizontally Scrolling Category Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            type="button"
            onClick={() => setSelectedCategoryId("ALL")}
            className={cn(
              "h-10 px-4 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 shadow-sm active:scale-95",
              selectedCategoryId === "ALL"
                ? "bg-amber-500 text-slate-950 shadow-amber-500/20"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
            )}
          >
            <span>All Dishes</span>
            <span className={cn(
              "text-[9px] px-1.5 py-0.2 rounded-full font-mono",
              selectedCategoryId === "ALL" ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
            )}>
              {menuItems.length}
            </span>
          </button>

          {categories.map((cat) => {
            const count = menuItems.filter((i) => String(i.categoryId) === String(cat.id)).length;
            const isSelected = String(selectedCategoryId) === String(cat.id);

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(String(cat.id))}
                className={cn(
                  "h-10 px-4 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 transition-all flex items-center gap-1.5 shadow-sm active:scale-95",
                  isSelected
                    ? "bg-amber-500 text-slate-950 shadow-amber-500/20"
                    : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                )}
              >
                <span>{cat.name}</span>
                <span className={cn(
                  "text-[9px] px-1.5 py-0.2 rounded-full font-mono",
                  isSelected ? "bg-slate-950/20 text-slate-950" : "bg-slate-800 text-slate-400"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. ADAPTIVE DISH GRID */}
      <div className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-dashed border-slate-800 rounded-3xl space-y-3">
            <Utensils size={32} className="mx-auto text-slate-600" />
            <p className="text-slate-400 font-bold text-sm">No dishes found matching your filter.</p>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="text-xs font-black text-amber-400 underline uppercase tracking-wider"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredItems.map((item) => {
              const sellingPrice = Number(item.price || 0);
              const costPrice = Number(item.costPrice || 0);
              const profit = sellingPrice - costPrice;
              const margin = sellingPrice > 0 ? Math.round((profit / sellingPrice) * 100) : 0;
              const isAvailable = item.isAvailable !== false;
              const isEditing = editingItemId === item.id;
              const categoryName = categoryMap.get(String(item.categoryId)) || "Artisanal";

              return (
                <div 
                  key={item.id}
                  className={cn(
                    "bg-slate-900 border rounded-3xl p-5 shadow-xl transition-all flex flex-col justify-between relative overflow-hidden group hover:border-slate-700",
                    isAvailable ? "border-slate-800" : "border-slate-800/50 opacity-70 bg-slate-950/60"
                  )}
                >
                  {/* Margin Color Strip */}
                  <div 
                    className={cn(
                      "absolute top-0 left-0 right-0 h-1 transition-all",
                      margin > 50 ? "bg-emerald-500" : margin > 25 ? "bg-amber-500" : "bg-rose-500"
                    )}
                  />

                  <div className="space-y-3">
                    {/* Top Row: Category Tag & Availability Toggle */}
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-lg truncate max-w-[150px]">
                        {categoryName}
                      </span>

                      {/* 86 / In-Stock Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggle(Number(item.id), isAvailable)}
                        disabled={isPending}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95 border",
                          isAvailable 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20" 
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                        )}
                        title={isAvailable ? "Click to 86 / Mark Out of Stock" : "Click to Mark Available"}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", isAvailable ? "bg-emerald-400" : "bg-rose-400")} />
                        <span>{isAvailable ? "In-Stock" : "86 (Out)"}</span>
                      </button>
                    </div>

                    {/* Dish Title & Description */}
                    <div>
                      <h3 className="text-lg font-black text-white uppercase italic tracking-tight leading-tight group-hover:text-amber-400 transition-colors">
                        {item.name}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    {/* Pricing & Cost Structure */}
                    <div className="pt-2 border-t border-slate-800/60 flex justify-between items-end">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Price</span>
                        <span className="text-2xl font-black text-amber-400 italic tracking-tight font-mono">
                          {formatINR(sellingPrice)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Cost</span>
                        <span className="text-xs text-slate-400 font-mono font-bold">
                          {costPrice > 0 ? formatINR(costPrice) : "—"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Margin</span>
                        <span className={cn(
                          "text-xs font-black font-mono px-2 py-0.5 rounded-md",
                          margin > 50 ? "bg-emerald-500/15 text-emerald-400" :
                          margin > 25 ? "bg-amber-500/15 text-amber-400" : "bg-rose-500/15 text-rose-400"
                        )}>
                          {margin}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Inline Quick-Edit Drawer */}
                  <div className="pt-4 mt-3 border-t border-slate-800/60">
                    {isEditing ? (
                      <form onSubmit={(e) => handleUpdatePrice(e, item)} className="space-y-2.5 bg-slate-950 p-3 rounded-2xl border border-slate-800">
                        <div className="text-[9.5px] font-black uppercase text-amber-400 tracking-wider">
                          Update Pricing
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[8px] uppercase text-slate-500 font-bold">Selling Price</label>
                            <input
                              type="number"
                              step="0.01"
                              name="price"
                              defaultValue={sellingPrice}
                              required
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-amber-400 font-mono font-bold outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[8px] uppercase text-slate-500 font-bold">Cost Price</label>
                            <input
                              type="number"
                              step="0.01"
                              name="costPrice"
                              defaultValue={costPrice || ""}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-mono font-bold outline-none"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            type="submit"
                            disabled={isPending}
                            className="flex-1 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider rounded-lg transition-all"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingItemId(null)}
                            className="px-3 py-1.5 bg-slate-800 text-slate-400 hover:text-white font-bold text-[10px] uppercase rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingItemId(item.id)}
                          className="flex-1 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-amber-400 text-[10.5px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-95"
                        >
                          <Edit3 size={13} />
                          <span>Edit Pricing</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(Number(item.id), item.name)}
                          disabled={isPending}
                          className="w-9 h-9 rounded-xl bg-slate-800/40 hover:bg-rose-950/40 text-slate-500 hover:text-rose-400 flex items-center justify-center transition-all active:scale-95 shrink-0"
                          title="Delete Dish"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}