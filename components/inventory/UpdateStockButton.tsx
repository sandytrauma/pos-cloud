"use client";

import { useState } from "react";
import { ArrowRightLeft, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

// --- WHITE-LABEL PROPS INTERFACE ---
interface UpdateStockModalProps {
  /** The specific item object being modified */
  item: any;
  /** React state setter to close the parent dialog wrapper */
  setOpen: (open: boolean) => void;
  /** Injected server action callback to handle multi-tenant stock adjustments */
  updateStockAction: (
    inventoryId: number, 
    type: 'IN' | 'OUT', 
    formData: FormData
  ) => Promise<{ success: boolean; error?: string }>;
  /** Injected server action callback to handle structural CSV generation */
  getInventoryReportData: () => Promise<{ success: boolean; data?: string; error?: string }>;
}

export default function UpdateStockModal({
  item,
  setOpen,
  updateStockAction,
  getInventoryReportData
}: UpdateStockModalProps) {
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [adjustmentType, setAdjustmentType] = useState<'IN' | 'OUT'>('IN');

  // Handle Form Submission for Stock Updates
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updateStockAction(item.id, adjustmentType, formData);
      if (res.success) {
        toast.success(`Ledger synced successfully for ${item.name}`);
        setOpen(false);
      } else {
        toast.error(res.error || "Failed to update stock level");
      }
    } catch (err) {
      toast.error("Network or database connection error.");
    } finally {
      setLoading(false);
    }
  }

  // Handle Client-Side CSV Generation and Download
  async function handleDownloadReport() {
    setExportLoading(true);
    try {
      const res = await getInventoryReportData();
      if (res.success && res.data) {
        const blob = new Blob([res.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Stock_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Exported successfully!");
      } else {
        toast.error(res.error || "Failed to generate stock data payload");
      }
    } catch (err) {
      toast.error("System error processing spreadsheet export.");
    } finally {
      setExportLoading(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl mx-4 relative overflow-hidden">
      {/* Background glow branding element */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px]" />

      {/* Header Controls */}
      <div className="flex justify-between items-center mb-8 relative z-10">
        <div className="w-12 h-12 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center">
          <ArrowRightLeft className="text-amber-500" size={20} />
        </div>
        
        <button
          type="button"
          onClick={handleDownloadReport}
          disabled={exportLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-400 hover:text-amber-500 disabled:opacity-50 transition-all text-[10px] font-black uppercase tracking-widest"
        >
          {exportLoading ? (
            <Loader2 size={14} className="animate-spin text-amber-500" />
          ) : (
            <Download size={14} />
          )}
          Export CSV
        </button>
      </div>

      {/* Meta Labels */}
      <div className="mb-6 relative z-10">
        <h3 className="text-white font-black text-2xl uppercase tracking-tighter italic leading-none truncate">
          {item.name}
        </h3>
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest mt-1.5">
          Current Balance: <span className="text-white">{item.currentStock} {item.unit}</span>
        </p>
      </div>

      {/* Segmented Direction Picker Controls */}
      <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 mb-6 relative z-10">
        <button
          type="button"
          onClick={() => setAdjustmentType('IN')}
          className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
            adjustmentType === 'IN' 
              ? 'bg-amber-500 text-slate-950 shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Stock In (Restock)
        </button>
        <button
          type="button"
          onClick={() => setAdjustmentType('OUT')}
          className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
            adjustmentType === 'OUT' 
              ? 'bg-rose-500 text-white shadow-md' 
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Stock Out (Usage)
        </button>
      </div>

      {/* Transaction Logging Input Form */}
      <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">
            Quantity ({item.unit})
          </label>
          <input
            name="quantity"
            type="number"
            step="0.01"
            required
            autoFocus
            placeholder="0.00"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-white text-xl font-black focus:border-amber-500 outline-none transition-all placeholder:text-slate-900"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-500 uppercase ml-1 tracking-widest">
            Logged By (Staff Name)
          </label>
          <input
            name="staffName"
            type="text"
            placeholder="System Manager"
            className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-5 text-white font-bold focus:border-amber-500 outline-none transition-all placeholder:text-slate-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full font-black py-5 rounded-2xl uppercase tracking-tighter italic text-lg transition-all active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 mt-4 flex items-center justify-center gap-2 shadow-xl ${
            adjustmentType === 'IN' 
              ? 'bg-amber-500 text-slate-950 shadow-amber-500/5' 
              : 'bg-rose-500 text-white shadow-rose-500/5'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              <span>Updating Ledger Balances...</span>
            </>
          ) : (
            `Confirm Stock ${adjustmentType}`
          )}
        </button>
      </form>
    </div>
  );
}