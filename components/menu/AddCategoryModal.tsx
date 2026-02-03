"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { addCategory } from "@/lib/actions/menu";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogTrigger, 
  DialogTitle, DialogDescription 
} from "@/components/ui/dialog";

export default function AddCategoryModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const name = formData.get("name") as string;
    const res = await addCategory(name);
    
    if (res.success) {
      toast.success("Category created");
      setOpen(false);
    } else {
      toast.error("Failed to create category");
    }
    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex-1 md:flex-none bg-slate-900 border border-slate-800 text-slate-400 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:text-amber-500 transition-all">
          <FolderPlus size={18} /> <span className="text-xs uppercase tracking-widest">Category</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-transparent border-none p-0 max-w-md shadow-none outline-none">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
          <div className="text-center mb-6">
            <DialogTitle className="text-white font-black text-2xl uppercase tracking-tighter">New Category</DialogTitle>
            <DialogDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Organize your digital menu</DialogDescription>
          </div>

          <form action={handleSubmit} className="space-y-4">
            <input 
              name="name" 
              required 
              placeholder="e.g. Beverages" 
              className="settings-input"
            />
            <button disabled={loading} className="amber-button w-full py-5 rounded-2xl">
              {loading ? "Creating..." : "Add Category"}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}