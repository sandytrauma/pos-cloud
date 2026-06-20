"use client";

import { useState } from "react";
import { FolderPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, DialogContent, DialogTrigger, 
  DialogTitle, DialogDescription 
} from "@/components/ui/dialog";

interface AddCategoryModalProps {
  /** Injected server action callback to handle structural menu category registration */
  addCategory: (name: string) => Promise<{ success: boolean; error?: string }>;
}

export default function AddCategoryModal({ addCategory }: AddCategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const name = formData.get("name") as string;
    
    try {
      const res = await addCategory(name);
      
      if (res.success) {
        toast.success("Category created successfully");
        setOpen(false);
      } else {
        toast.error(res.error || "Failed to create category");
      }
    } catch (error) {
      toast.error("Failed to connect to the active menu database service.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="flex-1 md:flex-none bg-slate-900 border border-slate-800 text-slate-400 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 hover:text-amber-500 transition-all active:scale-95 shadow-lg shadow-slate-950/20">
          <FolderPlus size={18} /> <span className="text-xs uppercase tracking-widest">Category</span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-transparent border-none p-0 max-w-md shadow-none outline-none">
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl mx-4 relative overflow-hidden">
          
          {/* Subtle design polish glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px]" />

          <div className="text-center mb-6 relative z-10">
            <DialogTitle className="text-white font-black text-2xl uppercase tracking-tighter italic">
              New <span className="text-amber-500">Category</span>
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1.5">
              Organize your digital menu
            </DialogDescription>
          </div>

          <form action={handleSubmit} className="space-y-4 relative z-10">
            <input 
              name="name" 
              required 
              type="text"
              autoFocus
              placeholder="e.g. Beverages" 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-white font-bold focus:border-amber-500 outline-none transition-all placeholder:text-slate-800"
            />
            
            <button 
              disabled={loading} 
              type="submit"
              className="w-full py-5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl font-black uppercase italic text-md shadow-xl shadow-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:bg-slate-800 disabled:text-slate-600"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>Creating Section...</span>
                </>
              ) : (
                "Add Category"
              )}
            </button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}