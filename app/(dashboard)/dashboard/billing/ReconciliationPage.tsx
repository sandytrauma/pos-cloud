"use client";

import { useState, useEffect, useTransition } from "react";
import { TrendingUp, TrendingDown, UserCircle, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FinancialStats {
  revenue: number;
  inventoryExpense: number;
  orderCount: number;
}

interface ReconciliationPageProps {
  /** Injected async server action payload resolver to pull initial transaction metrics and live log list */
  getDailySummaryAction: () => Promise<{ 
    success: boolean; 
    data?: {
      revenue: number;
      inventoryExpense: number;
      orderCount: number;
      ordersList?: Array<{
        id: number | string;
        tokenNumber: string;
        netAmount: string | number;
        createdAt: Date | string | null;
        status: string;
      }>;
    }; 
    error?: string;
  }>;
  /** Injected server action endpoint to execute final ledger closing transactions */
  saveReconciliationAction: (payload: {
    revenue: number;
    inventoryExpense: number;
    orderCount: number;
    staffExp: number;
    miscExp: number;
    netEarning: number;
    staffName: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const currencyFormatter = (value: number) => {
  if (isNaN(value) || value === null) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(value);
};

export default function ReconciliationPage({
  getDailySummaryAction,
  saveReconciliationAction
}: ReconciliationPageProps) {
  const [stats, setStats] = useState<FinancialStats>({ revenue: 0, inventoryExpense: 0, orderCount: 0 });
  const [orders, setOrders] = useState<any[]>([]); 
  const [staffExp, setStaffExp] = useState<number>(0);
  const [miscExp, setMiscExp] = useState<number>(0);
  const [staffName, setStaffName] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, startTransition] = useTransition();

  // 🌟 SAFEFUARD: Prevent timezone hydration mismatches across server/client compilation frames
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    let isMounted = true;

    async function loadData() {
      try {
        if (typeof getDailySummaryAction !== "function") {
          if (isMounted) setLoading(false);
          return;
        }
        
        const res = await getDailySummaryAction();
        
        if (res.success && res.data) {
          if (isMounted) {
            setStats({ 
              revenue: Number(res.data.revenue || 0), 
              inventoryExpense: Number(res.data.inventoryExpense || 0), 
              orderCount: Number(res.data.orderCount || 0) 
            });
            setOrders(res.data.ordersList || []); 
          }
        } else {
          toast.error(res.error || "Failed to load audit metrics summary.");
        }
      } catch (err) {
        console.error("Hydration Error: ", err);
        toast.error("Internal processing error reading financial logs.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();

    return () => {
      isMounted = false;
    };
  }, [getDailySummaryAction]);

  const netEarning = (stats.revenue || 0) - (stats.inventoryExpense || 0) - staffExp - miscExp;

  function handleCloseDay() {
    if (!staffName.trim()) {
      return toast.error("Please provide a valid staff name signature to seal the daily ledger.");
    }
    
    if (typeof saveReconciliationAction !== "function") {
      return toast.error("Server action link unavailable.");
    }

    startTransition(async () => {
      try {
        const res = await saveReconciliationAction({
          revenue: stats.revenue,
          inventoryExpense: stats.inventoryExpense,
          orderCount: stats.orderCount,
          staffExp,
          miscExp,
          netEarning,
          staffName
        });

        if (res.success) {
          toast.success("Day closed successfully. Balancing tokens dispatched to root ledger.");
          setStaffExp(0);
          setMiscExp(0);
          setStaffName("");
        } else {
          toast.error(res.error || "Error committing reconciliation entry changes.");
        }
      } catch (error) {
        toast.error("Network communication failure closing out operational terminal.");
      }
    });
  }

  // Helper formatting engine to keep row presentation clean
  const formatOrderTime = (dateInput: any) => {
    if (!dateInput || !isClient) return "--:--";
    try {
      return new Date(dateInput).toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
      });
    } catch {
      return "N/A";
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="animate-spin text-amber-500" size={40} />
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Calculating Daily Metrics...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 relative z-10">
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
        {/* REVENUE CARD SECTION */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] relative overflow-hidden shadow-xl">
          <TrendingUp className="absolute -right-4 -top-4 text-emerald-500/5 pointer-events-none" size={140} />
          <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mb-2">
            POS Revenue ({stats.orderCount || 0} Orders)
          </p>
          <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-4 truncate">
            {currencyFormatter(stats.revenue || 0)}
          </h2>
          <div className="pt-4 border-t border-slate-800/50">
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest leading-loose">
              Aggregated Terminal & Platform Sales Logs
            </p>
          </div>
        </div>

        {/* MATERIAL EXPENDITURE CARD SECTION */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] relative overflow-hidden shadow-xl">
          <TrendingDown className="absolute -right-4 -top-4 text-rose-500/5 pointer-events-none" size={140} />
          <p className="text-rose-500 text-[10px] font-black uppercase tracking-widest mb-2">Material Cost (COGS)</p>
          <h2 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-4 truncate">
            {currencyFormatter(stats.inventoryExpense || 0)}
          </h2>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest border-t border-slate-800/50 pt-4">
            Extracted via Real-time Stock Dispatches
          </p>
        </div>

        {/* ADJUSTMENT MANUAL INPUTS CARD SECTION */}
        <div className="bg-slate-900 border border-slate-800 p-6 md:p-8 rounded-[3rem] space-y-4 shadow-xl">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Staff / Petty Expenses</label>
            <input 
              type="number" 
              min={0}
              disabled={isSaving}
              value={staffExp === 0 ? "" : staffExp} 
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-rose-500/50 transition-all placeholder:text-slate-800"
              placeholder="0.00"
              onChange={(e) => setStaffExp(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">Miscellaneous Deductions</label>
            <input 
              type="number" 
              min={0}
              disabled={isSaving}
              value={miscExp === 0 ? "" : miscExp}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:border-rose-500/50 transition-all placeholder:text-slate-800"
              placeholder="0.00"
              onChange={(e) => setMiscExp(e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>
      </div>

      {/* DYNAMIC REAL-TIME BILLING LOG SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-6 md:p-8 space-y-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4">
          <h3 className="text-lg font-black uppercase italic tracking-tighter text-white">
            Today&apos;s Live <span className="text-amber-500">Billing Log</span>
          </h3>
          <span className="text-[10px] bg-slate-950 px-3 py-1 rounded-full text-slate-400 font-bold uppercase tracking-wider border border-slate-800">
            {orders.length} Records Processed
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/60 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                <th className="pb-4">Token</th>
                <th className="pb-4">Time Stamp</th>
                <th className="pb-4">Status</th>
                <th className="pb-4 text-right">Net Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {orders.map((order) => (
                <tr key={order.id} className="text-slate-300 hover:bg-slate-950/40 transition-colors group">
                  <td className="py-4 font-black text-amber-500 group-hover:text-amber-400 transition-colors">{order.tokenNumber}</td>
                  <td className="py-4 text-slate-500 font-medium">
                    {formatOrderTime(order.createdAt)}
                  </td>
                  <td className="py-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                      order.status === "COMPLETED" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    )}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 font-black text-white text-right">{currencyFormatter(Number(order.netAmount || 0))}</td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-16 text-slate-600 font-black uppercase tracking-widest italic bg-slate-950/10 rounded-2xl">
                    No order transactions recorded yet today.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER CALCULATION BAR PANEL */}
      <div className={cn(
        "p-8 md:p-10 rounded-[4rem] flex flex-col lg:flex-row items-center justify-between gap-8 transition-all duration-500 border-b-8 shadow-2xl relative overflow-hidden",
        netEarning >= 0 ? "bg-amber-500 border-amber-600" : "bg-rose-500 border-rose-600"
      )}>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="text-center lg:text-left relative z-10">
          <h3 className="text-slate-950 font-black text-4xl md:text-5xl uppercase tracking-tighter italic leading-none">
            {netEarning >= 0 ? "Net Profit" : "Net Loss"}
          </h3>
          <p className="text-slate-950/40 text-xs font-black uppercase tracking-[0.2em] mt-2">
            Remaining Net Yield after structural COGS parameters
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 w-full lg:w-auto relative z-10">
          <span className="text-slate-950 font-black text-5xl md:text-7xl tracking-tighter italic break-all text-center lg:text-right">
            {currencyFormatter(netEarning)}
          </span>
          
          <div className="flex flex-col gap-3 min-w-full sm:min-w-[260px]">
            <div className="relative">
              <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-900/40" size={18} />
              <input 
                type="text" 
                placeholder="Staff Signature"
                disabled={isSaving}
                className="w-full bg-slate-950/10 border border-slate-950/20 rounded-2xl py-4 pl-12 pr-4 text-slate-950 font-black placeholder:text-slate-950/30 outline-none focus:bg-slate-950/20 transition-all uppercase text-xs"
                value={staffName}
                onChange={(e) => setStaffName(e.target.value)}
              />
            </div>
            <button 
              type="button"
              onClick={handleCloseDay}
              disabled={isSaving || !staffName.trim()}
              className="w-full bg-slate-950 text-white font-black py-5 rounded-2xl uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-40 shadow-xl disabled:transform-none"
            >
              {isSaving ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
              Confirm Day Closing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}