"use client";

import { useState } from "react";
import { Plus, UtensilsCrossed, IndianRupee, DollarSign, Wallet, Tag } from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogTrigger, 
  DialogTitle, DialogDescription 
} from "@/components/ui/dialog";

interface AddMenuItemModalProps {
  /** Map listing arrays passed directly from the parent dashboard page context */
  categories: any[];
  /** Injected server action callback to handle structural item database additions */
  addMenuItem: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  /** Optional dynamic currency identifier localization flag (Defaults to 'INR') */
  currencyLocale?: "INR" | "USD" | "EUR" | "GBP";
}

export default function AddMenuItemModal({ 
  categories, 
  addMenuItem,
  currencyLocale = "INR"
}: AddMenuItemModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const res = await addMenuItem(formData);
      if (res.success) {
        toast.success("Dish added to menu");
        setOpen(false);
      } else {
        toast.error("Error saving menu item");
      }
    } catch (error) {
      toast.error("Failed to parse catalog configuration context updates.");
    } finally {
      setLoading(false);
    }
  }

  // Handle dynamic multi-currency iconography
  const renderCurrencyIcon = () => {
    switch (currencyLocale) {
      case "USD": return <DollarSign size={10} />;
      default: return <IndianRupee size={10} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 py-4 px-6 rounded-2xl flex items-center justify-center gap-2 font-black transition-all active:scale-95 shadow-lg shadow-amber-500/10">
          <Plus size={18} /> <span className="text-xs uppercase tracking-widest">Add Dish</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-transparent border-none p-0 max-w-md shadow-none outline-none">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl mx-4 relative overflow-hidden">
          
          {/* Accent style canvas glow overlay */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px]" />

          <div className="text-center mb-8 relative z-10">
            <DialogTitle className="text-white font-black text-2xl uppercase tracking-tighter italic">
              Register <span className="text-amber-500">Dish</span>
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1.5">
              Initialize pricing & profitability
            </DialogDescription>
          </div>

          <form action={handleSubmit} className="space-y-5 relative z-10">
            {/* Dish Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1 tracking-widest">
                <UtensilsCrossed size={10} /> Dish Name
              </label>
              <input 
                name="name" 
                required 
                type="text"
                placeholder="Paneer Butter Masala" 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-white font-bold focus:border-amber-500 outline-none transition-all placeholder:text-slate-800" 
              />
            </div>

            {/* Category Selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1 tracking-widest">
                <Tag size={10} /> Category
              </label>
              <div className="relative">
                <select 
                  name="categoryId" 
                  required 
                  defaultValue=""
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-white font-bold focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id} className="bg-slate-900 text-white">{cat.name}</option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <Plus size={14} className="rotate-45" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Selling Price */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1 tracking-widest">
                  {renderCurrencyIcon()} Selling Price
                </label>
                <input 
                  name="price" 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="250.00" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-amber-500 font-black italic focus:border-amber-500 outline-none transition-all placeholder:text-slate-900" 
                />
              </div>

              {/* Base Cost */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1 tracking-widest">
                  <Wallet size={10} /> Base Cost
                </label>
                <input 
                  name="costPrice" 
                  type="number" 
                  step="0.01" 
                  placeholder="95.00" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-emerald-500 font-black italic focus:border-emerald-500 outline-none transition-all placeholder:text-slate-900" 
                />
              </div>
            </div>

            <button 
              disabled={loading} 
              type="submit"
              className="w-full py-5 rounded-2xl mt-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 transition-all active:scale-95 disabled:bg-slate-800 disabled:text-slate-600"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-slate-600 border-t-slate-950 rounded-full animate-spin" />
                  <span>Syncing to Kitchen...</span>
                </>
              ) : (
                "Add to Digital Menu"
              )}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}