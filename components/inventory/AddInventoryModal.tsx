"use client";

import { useState } from "react";
import { Plus, Package, Ruler, AlertTriangle, IndianRupee, CalendarClock, Loader2 } from "lucide-react";
import { createInventoryItem } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";

export default function AddInventoryModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await createInventoryItem(formData);
    if (res.success) {
      toast.success("New item added to ledger");
      setOpen(false);
    } else {
      toast.error(res.error || "Failed to create item");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-amber-500/10">
          <Plus size={18} /> <span className="text-xs uppercase tracking-widest">New Item</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-transparent border-none p-0 max-w-md shadow-none outline-none overflow-visible">
        {/* Forces the form to reset completely whenever 'open' state changes */}
        <div key={open ? "open" : "closed"} className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl mx-4 relative overflow-hidden">
          
          {/* Subtle glow effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-[80px]" />

          <div className="text-center mb-8 relative z-10">
            <DialogTitle className="text-white font-black text-2xl uppercase tracking-tighter italic">
              Register <span className="text-amber-500">Stock</span>
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
              Initialize Ledger & Expiry
            </DialogDescription>
          </div>

          <form action={handleSubmit} className="space-y-5 relative z-10">
            {/* Item Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1 tracking-widest">
                <Package size={10} /> Item Name
              </label>
              <input 
                name="name" 
                required 
                placeholder="e.g. Basmati Rice" 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-white font-bold focus:border-amber-500 outline-none transition-all placeholder:text-slate-800" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Unit Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1 tracking-widest">
                  <Ruler size={10} /> Unit
                </label>
                <div className="relative">
                  <select name="unit" required className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-white font-bold focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer">
                    <option value="kg">KG</option>
                    <option value="ltr">Litre</option>
                    <option value="pcs">Pieces</option>
                    <option value="pkt">Packet</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-600">
                    ▼
                  </div>
                </div>
              </div>

              {/* Min Stock Level */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1 tracking-widest">
                  <AlertTriangle size={10} /> Alert Level
                </label>
                <input 
                  name="minStock" 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="5.00" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-rose-500 font-black italic focus:border-rose-500 outline-none transition-all placeholder:text-slate-900" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Unit Cost */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1 tracking-widest">
                  <IndianRupee size={10} /> Unit Cost
                </label>
                <input 
                  name="unitPrice" 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="0.00" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-emerald-500 font-black italic focus:border-emerald-500 outline-none transition-all placeholder:text-slate-900" 
                />
              </div>

              {/* Expiry Date */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1 tracking-widest">
                  <CalendarClock size={10} /> Expiry Date
                </label>
                <input 
                  name="expiryDate" 
                  type="date" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-amber-500 font-bold focus:border-amber-500 outline-none transition-all uppercase text-[10px] cursor-pointer [color-scheme:dark]" 
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-5 rounded-2xl uppercase tracking-tighter italic transition-all active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 mt-4 flex items-center justify-center gap-2 shadow-xl shadow-amber-500/5"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Syncing Ledger...</span>
                </>
              ) : "Confirm & Save Item"}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}