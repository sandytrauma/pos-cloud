"use client";

import { updateOrderStatus } from "@/lib/actions/orders";
import { cn, formatINR } from "@/lib/utils";
import { CheckCircle2, Clock, ExternalLink } from "lucide-react";

interface OrderProps {
  order: any; // Use the Drizzle type in production
}

export default function OrderCard({ order }: OrderProps) {
  const sourceColors: any = {
    ZOMATO: "border-rose-500 text-rose-500 bg-rose-500/10",
    SWIGGY: "border-orange-500 text-orange-500 bg-orange-500/10",
    POS: "border-emerald-500 text-emerald-500 bg-emerald-500/10",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all hover:scale-[1.01]">
      <div className="p-4 flex justify-between items-center border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-white tracking-tighter">#{order.tokenNumber}</span>
          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold border", sourceColors[order.source])}>
            {order.source}
          </span>
        </div>
        <div className="flex items-center text-slate-500 text-xs gap-1">
          <Clock size={14} /> <span>5 mins ago</span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div className="space-y-1">
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-slate-300 font-medium">{item.quantity}x {item.itemName}</span>
            </div>
          ))}
        </div>
        
        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
          <span className="text-xs text-slate-500">Total (Inc. GST)</span>
          <span className="text-lg font-bold text-emerald-400">{formatINR(order.totalAmount)}</span>
        </div>
      </div>

      <div className="p-2 bg-slate-950/50 flex gap-2">
        <button 
          onClick={() => updateOrderStatus(order.id, "READY")}
          className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          <CheckCircle2 size={14} /> MARK READY
        </button>
        <button className="p-2 bg-slate-800 text-slate-400 rounded-lg hover:text-white transition-all">
          <ExternalLink size={16} />
        </button>
      </div>
    </div>
  );
}