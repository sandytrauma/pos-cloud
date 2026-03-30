"use client";

import { useState, useEffect } from "react";
import { Calculator, TrendingUp, TrendingDown, UserCircle, Loader2, CheckCircle2 } from "lucide-react";
import { formatINR, cn } from "@/lib/utils";
import { getDailySummary, saveReconciliationAction } from "@/lib/actions/reconciliation";
import { toast } from "sonner";

export default function ReconciliationPage() {
  const [stats, setStats] = useState({ revenue: 0, inventoryExpense: 0, orderCount: 0 });
  const [staffExp, setStaffExp] = useState(0);
  const [miscExp, setMiscExp] = useState(0);
  const [staffName, setStaffName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      const res = await getDailySummary();
      if (res.success) {
        setStats({ 
            revenue: res.revenue || 0, 
            inventoryExpense: res.inventoryExpense || 0, 
            orderCount: res.orderCount || 0 
        });
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const netEarning = stats.revenue - stats.inventoryExpense - staffExp - miscExp;

  async function handleCloseDay() {
    if (!staffName) return toast.error("Please enter staff name to close the day");
    
    setSaving(true);
    const res = await saveReconciliationAction({
      ...stats,
      staffExp,
      miscExp,
      netEarning,
      staffName
    });

    if (res.success) {
      toast.success("Day closed and ledger updated");
    } else {
      toast.error("Error saving reconciliation");
    }
    setSaving(false);
  }

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-amber-500" size={40} />
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Calculating Daily Metrics...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
            Day-End <span className="text-amber-500">Reconciliation</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Financial Audit Mode
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* REVENUE SECTION */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] relative overflow-hidden">
          <TrendingUp className="absolute -right-4 -top-4 text-emerald-500/10" size={120} />
          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2">POS Revenue ({stats.orderCount} Orders)</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter mb-4">
            {formatINR(stats.revenue)}
          </h2>
          <div className="pt-4 border-t border-slate-800/50">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest leading-loose">
              Includes Zomato, Swiggy & POS Sales
            </p>
          </div>
        </div>

        {/* COGS SECTION */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] relative overflow-hidden">
          <TrendingDown className="absolute -right-4 -top-4 text-rose-500/10" size={120} />
          <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest mb-2">Material Cost (COGS)</p>
          <h2 className="text-5xl font-black text-white italic tracking-tighter mb-4">
            {formatINR(stats.inventoryExpense)}
          </h2>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Calculated from Stock Logs</p>
        </div>

        {/* INPUTS SECTION */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Staff/Petty Expenses</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-rose-500"
              placeholder="0.00"
              onChange={(e) => setStaffExp(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Miscellaneous Costs</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-rose-500"
              placeholder="0.00"
              onChange={(e) => setMiscExp(Number(e.target.value))}
            />
          </div>
        </div>
      </div>

      {/* FINAL CALCULATION BAR */}
      <div className={cn(
        "p-10 rounded-[4rem] flex flex-col lg:flex-row items-center justify-between gap-8 transition-all duration-500 border-b-8 shadow-2xl",
        netEarning >= 0 ? "bg-amber-500 border-amber-600" : "bg-rose-500 border-rose-600"
      )}>
        <div className="text-center lg:text-left">
          <h3 className="text-slate-950 font-black text-5xl uppercase tracking-tighter italic leading-none">
            {netEarning >= 0 ? "Net Profit" : "Net Loss"}
          </h3>
          <p className="text-slate-900/40 text-xs font-black uppercase tracking-[0.2em] mt-2">
            After all deductions & COGS
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8">
          <span className="text-slate-950 font-black text-7xl tracking-tighter italic">
            {formatINR(netEarning)}
          </span>
          
          <div className="flex flex-col gap-3 min-w-[240px]">
            <div className="relative">
                <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900/40" size={18} />
                <input 
                    type="text" 
                    placeholder="Staff Signature"
                    className="w-full bg-slate-950/20 border border-slate-950/30 rounded-2xl py-4 pl-12 pr-4 text-slate-950 font-black placeholder:text-slate-950/30 outline-none focus:bg-slate-950/30 transition-all uppercase text-xs"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                />
            </div>
            <button 
                onClick={handleCloseDay}
                disabled={saving || !staffName}
                className="w-full bg-slate-950 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 shadow-2xl"
            >
              {saving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Confirm Day Closing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}