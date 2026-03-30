"use client";

import { useState } from "react";
import { PlusCircle, MinusCircle, User, AlertCircle, ArrowRightLeft } from "lucide-react";
import { updateStockAction } from "@/lib/actions/inventory";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function UpdateStockModal({ item, setOpen }: { item: any, setOpen: any }) {
  const [type, setType] = useState<'IN' | 'OUT'>('OUT');
  const [loading, setLoading] = useState(false);

  if (!item) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] text-center">
        <AlertCircle className="mx-auto text-amber-500 mb-2" size={32} />
        <p className="text-white font-black tracking-tighter uppercase italic">No Item Data</p>
      </div>
    );
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const res = await updateStockAction(item.id, type, formData);
    
    if (res.success) {
      toast.success(`${item.name} updated: ${type === 'IN' ? '+' : '-'}${formData.get('quantity')} ${item.unit}`);
      if (setOpen) setOpen(false); 
    } else {
      toast.error(res.error || "Failed to update stock");
    }
    setLoading(false);
  }

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl mx-4">
      <div className="text-center mb-8">
        <div className="w-12 h-12 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center mx-auto mb-4">
          <ArrowRightLeft className="text-amber-500" size={20} />
        </div>
        <h3 className="text-white font-black text-2xl uppercase tracking-tighter italic leading-none">
          {item.name}
        </h3>
        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] mt-2">
          Manual Ledger Adjustment
        </p>
      </div>
      
      <form action={handleSubmit} className="space-y-5">
        {/* Toggle between IN and OUT */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={() => setType('IN')}
            className={cn(
              "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95",
              type === 'IN' 
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                : "border-slate-800 text-slate-600 hover:border-slate-700"
            )}
          >
            <PlusCircle size={22} /> 
            <span className="font-black text-[10px] uppercase tracking-widest">Stock In</span>
          </button>
          
          <button 
            type="button"
            onClick={() => setType('OUT')}
            className={cn(
              "p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all active:scale-95",
              type === 'OUT' 
                ? "border-rose-500 bg-rose-500/10 text-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.1)]" 
                : "border-slate-800 text-slate-600 hover:border-slate-700"
            )}
          >
            <MinusCircle size={22} /> 
            <span className="font-black text-[10px] uppercase tracking-widest">Stock Out</span>
          </button>
        </div>

        {/* Quantity Input */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-2">
            Adjustment Amount ({item.unit})
          </label>
          <div className="relative">
            <input 
              name="quantity"
              type="number" 
              step="0.01"
              required
              autoFocus
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-black text-2xl outline-none focus:border-amber-500 transition-all placeholder:text-slate-800 italic"
              placeholder="0.00"
            />
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-700 font-black text-xs uppercase">
              {item.unit}
            </div>
          </div>
        </div>

        {/* Accountability Field */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1">
            <User size={10} /> Authorized By
          </label>
          <input 
            name="staffName"
            type="text" 
            required
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-white text-sm font-bold outline-none focus:border-amber-500 transition-all placeholder:text-slate-800"
            placeholder="Staff Name"
          />
        </div>

        <button 
          disabled={loading}
          className={cn(
            "w-full font-black py-5 rounded-2xl uppercase tracking-tighter italic transition-all active:scale-95 shadow-xl disabled:opacity-50 mt-2",
            type === 'IN' ? "bg-emerald-500 text-slate-950" : "bg-rose-500 text-white"
          )}
        >
          {loading ? "Syncing Ledger..." : `Confirm Stock ${type}`}
        </button>
      </form>
    </div>
  );
}