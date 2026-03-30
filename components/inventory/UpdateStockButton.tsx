"use client";

import { useState } from "react";
import { Edit3 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import UpdateStockModal from "./UpdateStockModal";

export default function UpdateStockButton({ item }: { item: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* Thumb-friendly trigger with Amber hover states */}
        <button 
          className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-amber-500 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all active:scale-90 flex items-center justify-center group"
          aria-label={`Update ${item.name} stock`}
        >
          <Edit3 size={20} className="group-hover:rotate-12 transition-transform" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-transparent border-none p-0 max-w-md shadow-none outline-none overflow-visible">
        {/* Accessibility requirement: Descriptive title hidden from UI */}
        <DialogTitle className="sr-only">Update Stock: {item.name}</DialogTitle> 
        
        {/* The actual form component */}
        <UpdateStockModal item={item} setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
}