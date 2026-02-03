"use client";

import { useState } from "react";
import { Plus, UtensilsCrossed, IndianRupee } from "lucide-react";
import { addMenuItem } from "@/lib/actions/menu";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogTrigger, 
  DialogTitle, DialogDescription 
} from "@/components/ui/dialog";

export default function AddMenuItemModal({ categories }: { categories: any[] }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await addMenuItem(formData);
    if (res.success) {
      toast.success("Dish added to menu");
      setOpen(false);
    } else {
      toast.error("Error saving item");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex-1 md:flex-none amber-button py-4 px-6 rounded-2xl flex items-center justify-center gap-2">
          <Plus size={18} /> <span className="text-xs uppercase tracking-widest">Add Dish</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-transparent border-none p-0 max-w-md shadow-none outline-none">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="text-center mb-6">
            <DialogTitle className="text-white font-black text-2xl uppercase tracking-tighter">Register Dish</DialogTitle>
            <DialogDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Set price and category</DialogDescription>
          </div>

          <form action={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                <UtensilsCrossed size={10} /> Dish Name
              </label>
              <input name="name" required placeholder="Paneer Butter Masala" className="settings-input" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                  Category
                </label>
                <select name="categoryId" required className="settings-input appearance-none bg-slate-950">
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
                  <IndianRupee size={10} /> Price
                </label>
                <input name="price" type="number" step="0.01" required placeholder="250.00" className="settings-input" />
              </div>
            </div>

            <button disabled={loading} className="amber-button w-full py-5 rounded-2xl mt-4">
              {loading ? "Saving to Cloud..." : "Add to Digital Menu"}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}