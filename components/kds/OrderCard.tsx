"use client";

import { useState } from "react";
import { updateOrderStatus } from "@/lib/actions/orders";
import { cn, formatINR } from "@/lib/utils";
import { CheckCircle2, Clock, ExternalLink, Loader2, PackageCheck } from "lucide-react";
import { toast } from "sonner";

// Define the literal types allowed by your Drizzle schema
type OrderStatus = "RECEIVED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED" | "archived";

interface OrderProps {
  order: {
    id: number;
    tokenNumber: string;
    // 1. Add 'null' here to match the database/Drizzle type
    source: "POS" | "ZOMATO" | "SWIGGY" | null; 
    status: OrderStatus;
    totalAmount: string | number;
    items?: { quantity: number; itemName: string }[];
    customerPhone?: string | null;
  };
}

export default function OrderCard({ order }: OrderProps) {
  const [isPending, setIsPending] = useState(false);

  const sourceColors: Record<string, string> = {
    ZOMATO: "border-rose-500 text-rose-500 bg-rose-500/10",
    SWIGGY: "border-orange-500 text-orange-500 bg-orange-500/10",
    POS: "border-emerald-500 text-emerald-500 bg-emerald-500/10",
    UNKNOWN: "border-slate-500 text-slate-500 bg-slate-500/10", // Fallback
  };

  // 3. Use a safe variable for the display source
  const displaySource = order.source || "UNKNOWN";

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    setIsPending(true);
    try {
      const res = await updateOrderStatus(order.id, newStatus);
      if (res.success) {
        toast.success(`Order #${order.tokenNumber} updated to ${newStatus}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all hover:border-slate-700/50">
      {/* Header */}
      <div className="p-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-white tracking-tighter italic">#{order.tokenNumber}</span>
          <span className={cn(
      "text-[10px] px-2 py-0.5 rounded-full font-bold border", 
      sourceColors[displaySource] // This is now safe
    )}>
      {displaySource}
    </span>
        </div>
        <div className="flex items-center text-slate-500 text-[10px] font-bold gap-1 uppercase">
          <Clock size={12} className="text-amber-500" /> 
          <span>Live</span>
        </div>
      </div>

      {/* Item List */}
      <div className="p-4 space-y-3">
        <div className="space-y-1.5">
          {order.items?.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-slate-300 font-bold">
                <span className="text-amber-500/80 mr-2">{item.quantity}x</span>
                {item.itemName}
              </span>
            </div>
          ))}
        </div>
        
        <div className="pt-2 border-t border-slate-800/50 flex justify-between items-end">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-black">Net Total</span>
            <span className="text-lg font-black text-emerald-400">{formatINR(order.totalAmount)}</span>
          </div>
          {order.customerPhone && (
             <span className="text-[10px] text-slate-600 font-mono mb-1">{order.customerPhone}</span>
          )}
        </div>
      </div>

      {/* Action Area */}
      <div className="p-2 bg-slate-950/50 flex gap-2">
        {order.status === "READY" ? (
          // Final step to ensure Revenue shows up on Reconciliation Page
          <button 
            disabled={isPending}
            onClick={() => handleStatusUpdate("COMPLETED")}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-tighter shadow-lg shadow-emerald-500/10 active:scale-95 disabled:opacity-50"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <PackageCheck size={14} />}
            Deliver & Finalize
          </button>
        ) : (
          <button 
            disabled={isPending}
            onClick={() => handleStatusUpdate("READY")}
            className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 uppercase tracking-tighter shadow-lg shadow-amber-500/10 active:scale-95 disabled:opacity-50"
          >
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Mark Ready
          </button>
        )}
        
        <button className="p-3 bg-slate-800 text-slate-400 rounded-xl hover:text-white transition-all active:scale-90">
          <ExternalLink size={16} />
        </button>
      </div>
    </div>
  );
}