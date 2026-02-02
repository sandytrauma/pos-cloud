"use client";

import { useState } from "react";
import { Plus, Package, Ruler, AlertTriangle } from "lucide-react";
import { createInventoryItem } from "@/lib/actions/inventory";
import { toast } from "sonner";
// Add DialogTitle and DialogDescription to your imports
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
        <button className="amber-button flex items-center gap-2">
          <Plus size={18} /> New Item
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-transparent border-none p-0 max-w-md shadow-none outline-none">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="text-center mb-6">
            {/* FIX: Use DialogTitle and DialogDescription for accessibility */}
            <DialogTitle className="text-white font-black text-2xl uppercase tracking-tighter">
              New Stock Item
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
              Add to Amber Kitchen
            </DialogDescription>
          </div>

          <form action={handleSubmit} className="space-y-4">
            {/* ... rest of your form ... */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                <Package size={10} /> Item Name
              </label>
              <input name="name" required placeholder="e.g. Chicken Breast" className="settings-input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                  <Ruler size={10} /> Unit
                </label>
                <select name="unit" required className="settings-input appearance-none">
                  <option value="kg">KG</option>
                  <option value="ltr">Litre</option>
                  <option value="pcs">Pieces</option>
                  <option value="pkt">Packet</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                  <AlertTriangle size={10} /> Min Level
                </label>
                <input name="minStock" type="number" step="0.01" required placeholder="5.00" className="settings-input" />
              </div>
            </div>

            <button 
              disabled={loading}
              className="w-full bg-amber-500 text-slate-950 font-black py-5 rounded-2xl uppercase tracking-tighter hover:bg-amber-400 active:scale-95 transition-all disabled:opacity-50 mt-4"
            >
              {loading ? "Registering..." : "Confirm Item"}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}