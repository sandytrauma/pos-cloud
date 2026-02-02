"use client";

import { useState } from "react";
import { Edit3 } from "lucide-react";
// Ensure these are imported from your UI folder
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import UpdateStockModal from "./UpdateStockModal";

export default function UpdateStockButton({ item }: { item: any }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* This is the button staff actually click */}
        <button 
          className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-amber-500 hover:border-amber-500/50 transition-all active:scale-95"
        >
          <Edit3 size={18} />
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-transparent border-none p-0 max-w-md shadow-none outline-none">
  {/* Add this so Radix is happy. It links the modal to the item name */}
  <DialogTitle className="sr-only">Update {item.name}</DialogTitle> 
  
  <UpdateStockModal item={item} setOpen={setOpen} />
</DialogContent>
    </Dialog>
  );
}