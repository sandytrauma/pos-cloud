"use client";

import { useState, useCallback } from "react";
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

  // Memoize the close function to prevent unnecessary re-renders in the modal
  const handleOpenChange = useCallback((val: boolean) => {
    setOpen(val);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button 
          className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-500 hover:text-amber-500 hover:border-amber-500/40 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)] transition-all active:scale-90 flex items-center justify-center group"
          aria-label={`Update ${item.name} stock`}
        >
          <Edit3 size={20} className="group-hover:rotate-12 transition-transform" />
        </button>
      </DialogTrigger>
      
      <DialogContent className="bg-transparent border-none p-0 max-w-md shadow-none outline-none overflow-visible">
        {/* Screen reader title for accessibility */}
        <DialogTitle className="sr-only">Update Stock: {item.name}</DialogTitle> 
        
        {/* KEY TRICK: Adding a key based on 'open' + 'item.id' forces the 
          UpdateStockModal to unmount and remount. This clears out old 
          form data (quantity/staff name) from the previous edit session.
        */}
        <UpdateStockModal 
          key={`${item.id}-${open}`} 
          item={item} 
          setOpen={setOpen} 
        />
      </DialogContent>
    </Dialog>
  );
}