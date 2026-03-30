"use client";

import { useState } from "react";
import { Plus, Package, Ruler, AlertTriangle, IndianRupee, CalendarClock } from "lucide-react";
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
      
      <DialogContent className="bg-transparent border-none p-0 max-w-md shadow-none outline-none">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl mx-4">
          <div className="text-center mb-8">
            <DialogTitle className="text-white font-black text-2xl uppercase tracking-tighter italic">
              Register <span className="text-amber-500">Stock</span>
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
              Initialize Ledger & Expiry
            </DialogDescription>
          </div>

          <form action={handleSubmit} className="space-y-5">
            {/* Item Name */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                <Package size={10} /> Item Name
              </label>
              <input 
                name="name" 
                required 
                placeholder="e.g. Basmati Rice" 
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-white font-bold focus:border-amber-500 outline-none transition-all placeholder:text-slate-700" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Unit Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                  <Ruler size={10} /> Unit
                </label>
                <select name="unit" required className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-white font-bold focus:border-amber-500 outline-none transition-all appearance-none cursor-pointer">
                  <option value="kg">KG</option>
                  <option value="ltr">Litre</option>
                  <option value="pcs">Pieces</option>
                  <option value="pkt">Packet</option>
                </select>
              </div>

              {/* Min Stock Level */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                  <AlertTriangle size={10} /> Alert Level
                </label>
                <input 
                  name="minStock" 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="5.00" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-rose-500 font-black italic focus:border-rose-500 outline-none transition-all placeholder:text-slate-800" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Unit Cost (New) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                  <IndianRupee size={10} /> Unit Cost
                </label>
                <input 
                  name="unitPrice" 
                  type="number" 
                  step="0.01" 
                  required 
                  placeholder="0.00" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-emerald-500 font-black italic focus:border-emerald-500 outline-none transition-all placeholder:text-slate-800" 
                />
              </div>

              {/* Expiry Date (New) */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                  <CalendarClock size={10} /> Expiry Date
                </label>
                <input 
                  name="expiryDate" 
                  type="date" 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-amber-500 font-bold focus:border-amber-500 outline-none transition-all uppercase text-xs cursor-pointer [color-scheme:dark]" 
                />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-5 rounded-2xl uppercase tracking-tighter italic transition-all active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950/20 border-t-slate-950 rounded-full animate-spin" />
                  Registering...
                </>
              ) : "Confirm & Save Item"}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}