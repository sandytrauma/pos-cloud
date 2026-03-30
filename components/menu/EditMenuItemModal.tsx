"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Pencil, Save, Trash2, AlertCircle } from "lucide-react";
import { updateMenuItem, deleteMenuItem } from "@/lib/actions/menu"; // Added deleteMenuItem
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: number;
  name: string;
  price: string | number;
  categoryId: number | null; // Add | null here
  description?: string | null;
}

export default function EditMenuItemModal({ item }: { item: MenuItem }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleUpdate(formData: FormData) {
    setIsPending(true);
    const res = await updateMenuItem(formData);
    setIsPending(false);
    
    if (res.success) {
      toast.success(`${item.name} updated successfully`);
      setOpen(false);
    } else {
      toast.error("Failed to update item");
    }
  }

  async function handleDelete() {
    // Simple confirmation for touchscreens
    const confirmed = confirm(`Are you sure you want to delete "${item.name}"?`);
    if (!confirmed) return;

    setIsDeleting(true);
    const res = await deleteMenuItem(item.id);
    setIsDeleting(false);

    if (res.success) {
      toast.error(`${item.name} removed from menu`);
      setOpen(false);
    } else {
      toast.error("Failed to delete item");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="h-12 w-12 rounded-2xl bg-slate-950 flex items-center justify-center text-slate-500 hover:text-amber-500 border border-slate-800 transition-all active:scale-90">
          <Pencil size={18} />
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-[2.5rem] w-[95%] max-w-md p-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
            Manage <span className="text-amber-500">Dish</span>
          </DialogTitle>
        </DialogHeader>

        <form action={handleUpdate} className="space-y-6 pt-4">
          <input type="hidden" name="id" value={item.id} />
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dish Name</label>
            <input 
              name="name"
              type="text"
              defaultValue={item.name}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-white font-bold focus:border-amber-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Price (₹)</label>
            <input 
              name="price"
              type="number"
              defaultValue={item.price}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-amber-500 text-2xl font-black italic focus:border-amber-500 outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <button
              type="submit"
              disabled={isPending || isDeleting}
              className={cn(
                "w-full py-4 rounded-2xl font-black uppercase tracking-tighter italic flex items-center justify-center gap-2 transition-all active:scale-95",
                isPending ? "bg-slate-800 text-slate-500" : "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
              )}
            >
              {isPending ? <div className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin" /> : <Save size={20} />}
              Update Changes
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending || isDeleting}
              className="w-full py-4 rounded-2xl font-black uppercase tracking-tighter text-[10px] text-rose-500/50 hover:text-rose-500 flex items-center justify-center gap-2 transition-colors border border-transparent hover:border-rose-500/20"
            >
              {isDeleting ? <div className="w-4 h-4 border-2 border-rose-500/20 border-t-rose-500 rounded-full animate-spin" /> : <Trash2 size={14} />}
              Remove from Menu
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}