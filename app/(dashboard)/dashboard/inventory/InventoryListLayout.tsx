// Location: app/(dashboard)/dashboard/inventory/InventoryListLayout.tsx
"use client";

import React, { useState, useTransition } from "react";
import { Package, AlertTriangle, CheckCircle2, CalendarClock, Zap, Loader2, X } from "lucide-react";
import { format, isBefore, addDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface InventoryItem {
  id: number;
  name: string;
  currentStock: number;
  minStockLevel: number;
  unitPrice: number;
  unit: string;
  expiryDate: string | null;
}

interface InventoryListLayoutProps {
  stock: InventoryItem[];
  onUpdateStock: (id: number, type: "IN" | "OUT", qty: number, staff: string) => Promise<{ success: boolean; error?: string }>;
  onCreateItem: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
}

export default function InventoryListLayout({ 
  stock = [], 
  onUpdateStock,
  onCreateItem
}: InventoryListLayoutProps) {
  const today = startOfDay(new Date());
  const [isPending, startTransition] = useTransition();

  // 🌟 MODAL STATES
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeUpdateItem, setActiveUpdateItem] = useState<InventoryItem | null>(null);

  // 🌟 SUBMIT FORM STATES (ADJUSTMENT MODAL)
  const [adjType, setAdjType] = useState<"IN" | "OUT">("IN");
  const [adjQty, setAdjQty] = useState("");
  const [adjStaff, setAdjStaff] = useState("");

  const safeFormatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const totalLedgerValue = stock.reduce((acc, item) => acc + (item.currentStock * item.unitPrice), 0);

  // Handlers
  const handleAddSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await onCreateItem(formData);
      if (res.success) {
        toast.success("Item registered in system ledger!");
        setIsAddOpen(false);
      } else {
        toast.error(res.error || "Failed to save entry.");
      }
    });
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeUpdateItem) return;
    const parsedQty = parseFloat(adjQty);
    if (isNaN(parsedQty) || parsedQty <= 0) return toast.error("Enter a valid amount");
    if (!adjStaff.trim()) return toast.error("Staff signature required");

    startTransition(async () => {
      const res = await onUpdateStock(activeUpdateItem.id, adjType, parsedQty, adjStaff);
      if (res.success) {
        toast.success(`Ledger balanced successfully for ${activeUpdateItem.name}`);
        setActiveUpdateItem(null);
        setAdjQty("");
        setAdjStaff("");
      } else {
        toast.error(res.error || "Transaction rejected");
      }
    });
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-24 md:pb-10 relative z-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
            Stock <span className="text-amber-500">Ledger</span>
          </h1>
          <div className="flex items-center gap-2 mt-3">
            <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">
              Inventory Assets:
            </p>
            <span className="text-emerald-500 text-[10px] font-black tracking-widest uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shadow-sm">
              {safeFormatCurrency(totalLedgerValue)}
            </span>
          </div>
        </div>
        
        {/* 🌟 ADD ITEM TRIGGER CONNECTED */}
        <button 
          type="button" 
          onClick={() => setIsAddOpen(true)}
          className="px-5 py-3 bg-amber-500 text-slate-950 font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-amber-400 active:scale-95 transition-all shadow-lg"
        >
          + Add Inventory Item
        </button>
      </header>

      <div className="grid gap-3 md:gap-4">
        {stock.map((item) => {
          const stockValue = item.currentStock * item.unitPrice;
          const expiryDate = item.expiryDate ? new Date(item.expiryDate) : null;
          const isExpired = expiryDate && isBefore(expiryDate, today);
          const isExpiringSoon = expiryDate && !isExpired && isBefore(expiryDate, addDays(today, 3));
          const isLow = item.currentStock <= item.minStockLevel;
          
          return (
            <div 
              key={item.id} 
              className={cn(
                "bg-slate-900 border p-4 md:p-6 rounded-[2rem] md:rounded-[3rem] flex flex-col md:flex-row items-start md:items-center justify-between transition-all group relative overflow-hidden",
                isExpired ? "border-rose-500/40 bg-rose-500/[0.01]" : "border-slate-800 hover:border-slate-700/80 shadow-md"
              )}
            >
              <div className={cn(
                "absolute left-0 top-0 bottom-0 w-2 transition-all",
                isExpired ? "bg-rose-600 shadow-[4px_0_15px_rgba(225,29,72,0.3)]" : 
                isExpiringSoon ? "bg-amber-500 animate-pulse" : 
                isLow ? "bg-rose-500" : "bg-slate-800"
              )} />

              <div className="flex flex-col gap-1 w-full md:w-auto mb-4 md:mb-0 pl-4">
                <div className="flex items-center gap-2">
                  <span className="text-white font-black text-lg md:text-xl tracking-tight group-hover:text-amber-500 transition-colors uppercase italic truncate max-w-[200px] md:max-w-none">
                    {item.name}
                  </span>
                  {isExpiringSoon && <Zap size={13} className="text-amber-500 fill-amber-500 animate-bounce" />}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                  <span className={cn(
                    "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                    isLow || isExpired ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  )}>
                    {isExpired || isLow ? <AlertTriangle size={10} /> : <CheckCircle2 size={10} />}
                    {isExpired ? "Expired" : isLow ? "Low Stock" : "In Stock"}
                  </span>

                  {expiryDate && (
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border flex items-center gap-1",
                      isExpired ? "bg-rose-600 text-white border-rose-500" : isExpiringSoon ? "bg-amber-500/20 text-amber-500 border-amber-500/30" : "bg-slate-950 text-slate-400 border-slate-800"
                    )}>
                      <CalendarClock size={10} />
                      {format(expiryDate, "dd MMM yy")}
                    </span>
                  )}

                  <span className="text-slate-500 text-[9px] uppercase font-black tracking-widest bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800/60">
                    {item.unit} • Value: {safeFormatCurrency(stockValue)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-10 bg-slate-950/50 md:bg-transparent p-3 md:p-0 rounded-2xl border border-slate-800/40 md:border-none">
                <div className="text-left md:text-right pl-2 md:pl-0">
                  <p className={cn(
                    "text-3xl md:text-5xl font-black tracking-tighter leading-none italic",
                    isLow || isExpired ? "text-rose-500" : "text-white group-hover:text-amber-500 transition-colors"
                  )}>
                    {item.currentStock}
                  </p>
                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1.5">
                    Qty Remaining
                  </p>
                </div>
                
                <div className="scale-110 md:scale-100 pr-2 md:pr-0">
                  {/* 🌟 ADJUST STOCK TRIGGER CONNECTED */}
                  <button 
                    type="button"
                    disabled={isPending}
                    onClick={() => setActiveUpdateItem(item)}
                    className="px-4 py-2 bg-slate-900 border border-slate-800 text-amber-500 hover:border-amber-500/30 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 disabled:opacity-40 flex items-center gap-2 shadow-md"
                  >
                    {isPending && <Loader2 className="animate-spin" size={12} />}
                    Adjust Stock
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {stock.length === 0 && (
          <div className="py-24 text-center border-2 border-dashed border-slate-800 rounded-[3rem] bg-slate-950/40 flex flex-col items-center justify-center">
            <Package size={36} className="text-slate-800 mb-3" />
            <p className="text-slate-600 font-black uppercase tracking-[0.2em] text-xs">
              Ledger Empty
            </p>
          </div>
        )}
      </div>

      {/* ========================================== */}
      {/* 🌟 MODAL DIALOG 1: ADD NEW INVENTORY DISPATCH */}
      {/* ========================================== */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2.5rem] max-w-md w-full relative space-y-6 animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddOpen(false)} className="absolute right-6 top-6 text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic">Add Stock Record</h3>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Catalog Registry Index Entry</p>
            </div>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <input type="text" name="name" placeholder="Item Name (e.g. Tomato Sauce)" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium text-xs placeholder:text-slate-700 outline-none focus:border-amber-500/50" />
              <input type="text" name="unit" placeholder="Unit Measure (e.g. kg, ltr, pcs)" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium text-xs placeholder:text-slate-700 outline-none focus:border-amber-500/50" />
              <input type="number" step="0.01" name="minStock" placeholder="Minimum Level Alert Trigger (Default 5.00)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium text-xs placeholder:text-slate-700 outline-none focus:border-amber-500/50" />
              <input type="number" step="0.01" name="unitPrice" placeholder="Unit Price per Unit Measure (INR)" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium text-xs placeholder:text-slate-700 outline-none focus:border-amber-500/50" />
              <input type="date" name="expiryDate" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium text-xs placeholder:text-slate-700 outline-none focus:border-amber-500/50" />
              <button type="submit" disabled={isPending} className="w-full bg-amber-500 text-slate-950 font-black py-3 rounded-xl uppercase tracking-wider text-xs hover:bg-amber-400 active:scale-98 transition-all flex items-center justify-center gap-2">
                {isPending && <Loader2 className="animate-spin" size={14} />} Commit Entry
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* 🌟 MODAL DIALOG 2: ADJUST BALANCE QUANTITY */}
      {/* ========================================== */}
      {activeUpdateItem && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[2.5rem] max-w-md w-full relative space-y-6 animate-in zoom-in-95 duration-200">
            <button onClick={() => setActiveUpdateItem(null)} className="absolute right-6 top-6 text-slate-500 hover:text-white transition-colors">
              <X size={18} />
            </button>
            <div>
              <h3 className="text-xl font-black text-white uppercase italic truncate">Adjust: {activeUpdateItem.name}</h3>
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Current Stock Balance: {activeUpdateItem.currentStock} {activeUpdateItem.unit}</p>
            </div>
            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 border border-slate-800 rounded-xl">
                <button type="button" onClick={() => setAdjType("IN")} className={cn("py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", adjType === "IN" ? "bg-emerald-500 text-slate-950" : "text-slate-500")}>RESTOCK (IN)</button>
                <button type="button" onClick={() => setAdjType("OUT")} className={cn("py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", adjType === "OUT" ? "bg-rose-500 text-slate-950" : "text-slate-500")}>USAGE (OUT)</button>
              </div>
              <input type="number" step="0.01" value={adjQty} onChange={(e) => setAdjQty(e.target.value)} placeholder={`Quantity amount (${activeUpdateItem.unit})`} required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium text-xs placeholder:text-slate-700 outline-none focus:border-amber-500/50" />
              <input type="text" value={adjStaff} onChange={(e) => setAdjStaff(e.target.value)} placeholder="Staff Signature Name" required className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-medium text-xs placeholder:text-slate-700 outline-none focus:border-amber-500/50" />
              <button type="submit" disabled={isPending} className="w-full bg-amber-500 text-slate-950 font-black py-3 rounded-xl uppercase tracking-wider text-xs hover:bg-amber-400 active:scale-98 transition-all flex items-center justify-center gap-2">
                {isPending && <Loader2 className="animate-spin" size={14} />} Confirm Audit Change
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}