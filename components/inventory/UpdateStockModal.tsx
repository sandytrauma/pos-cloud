"use client";

import { useState } from "react";
import { PlusCircle, MinusCircle, User, AlertCircle } from "lucide-react";
import { updateStockAction } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function UpdateStockModal({ item, setOpen }: { item: any, setOpen: any }) {
  const [type, setType] = useState<'IN' | 'OUT'>('OUT');
  const [loading, setLoading] = useState(false);

  // Safety Guard: Prevents crash if modal opens without data
  if (!item) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] text-center">
        <AlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
        <p className="text-white font-bold tracking-tighter uppercase">No Item Data</p>
      </div>
    );
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await updateStockAction(item.id, type, formData);
    
    if (res.success) {
      toast.success(`${item.name} updated successfully`);
      if (setOpen) setOpen(false); 
    } else {
      toast.error("Failed to update stock");
    }
    setLoading(false);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
      <div className="text-center mb-6">
        <h3 className="text-white font-black text-2xl uppercase tracking-tighter">
          {item.name}
        </h3>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Manual Stock Adjustment</p>
      </div>
      
      <form action={handleSubmit} className="space-y-4">
        {/* Toggle between IN and OUT */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={() => setType('IN')}
            className={cn(
              "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
              type === 'IN' ? "border-emerald-500 bg-emerald-500/10 text-emerald-500" : "border-slate-800 text-slate-600"
            )}
          >
            <PlusCircle size={20} /> <span className="text-amber-500 text-[10px] uppercase">Stock In</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setType('OUT')}
            className={cn(
              "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all",
              type === 'OUT' ? "border-rose-500 bg-rose-500/10 text-rose-500" : "border-slate-800 text-slate-600"
            )}
          >
            <MinusCircle size={20} /> <span className="font-black text-[10px] uppercase">Stock Out</span>
          </button>
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-2">
            Quantity ({item.unit})
          </label>
          <input 
            name="quantity"
            type="number" 
            step="0.01"
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-amber-500 font-black text-xl outline-none focus:border-amber-500 transition-all"
            placeholder="0.00"
          />
        </div>

        {/* Accountability Field */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
            <User size={10} /> Staff Name
          </label>
          <input 
            name="staffName"
            type="text" 
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-amber-500"
            placeholder="Enter your name"
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-amber-500 text-slate-950 font-black py-5 rounded-2xl uppercase tracking-tighter hover:bg-amber-400 active:scale-95 transition-all shadow-xl shadow-amber-500/10 disabled:opacity-50"
        >
          {loading ? "Updating Ledger..." : "Confirm Entry"}
        </button>
      </form>
    </div>
  );
}