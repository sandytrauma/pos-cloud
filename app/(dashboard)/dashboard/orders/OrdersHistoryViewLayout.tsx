// Location: app/(dashboard)/dashboard/orders/OrdersHistoryViewLayout.tsx
"use client";

import React, { useState } from "react";
import { Clock, Calendar as CalendarIcon, History, Search, X, Printer } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientOrderItem {
  id: string;
  itemName: string;
  quantity: number;
  price: number;
}

interface ClientOrderRecord {
  id: string;
  tokenNumber: string;
  customerPhone: string | null;
  source: string;
  totalAmount: number;
  gstAmount: number;
  netAmount: number;
  status: string;
  createdAt: string;
  items: ClientOrderItem[];
}

export default function OrdersHistoryViewLayout({ orders = [] }: { orders: ClientOrderRecord[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<ClientOrderRecord | null>(null);

  // Native Indian Rupee Monetary Utility Formatter
  const safeFormatCurrency = (val: number) => {
    if (isNaN(val) || val === null) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(val);
  };

  // 🌟 RESTORED: Filter criteria tracking query searches matching Token IDs or phone fields cleanly
  const filteredOrders = orders.filter((order) => {
    const normalizeQuery = searchQuery.trim().toLowerCase();
    if (!normalizeQuery) return true;
    return (
      order.tokenNumber.toLowerCase().includes(normalizeQuery) ||
      (order.customerPhone && order.customerPhone.toLowerCase().includes(normalizeQuery))
    );
  });

  const handlePrintReceiptWindow = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10 relative z-10">
      {/* Header Panel */}
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-inner">
            <History size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
              Order <span className="text-amber-500">History</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1.5">
              Audit & Token Management
            </p>
          </div>
        </div>

        {/* 🌟 RESTORED: Client-side Interactive Search Bar Layout */}
        <div className="w-full xl:w-80 relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Token Number or Phone..."
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-slate-600 outline-none focus:border-amber-500/40 transition-all shadow-inner"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </header>

      {/* Primary History Ledger Grid Wrapper */}
      <div className="grid gap-3">
        {filteredOrders.length === 0 ? (
          <div className="py-24 text-center bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-800/60 flex flex-col items-center justify-center">
            <div className="h-16 w-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-4">
              <History size={30} />
            </div>
            <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-xs">No records found</p>
            <p className="text-slate-700 text-[10px] font-bold mt-1.5 uppercase tracking-wide">
              No dynamic metrics found matching your search values inside the active registry index.
            </p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const orderDate = new Date(order.createdAt);
            const consolidatedItems = order.items || [];
            
            const timeStr = orderDate.toLocaleTimeString("en-IN", { 
              hour: "2-digit", 
              minute: "2-digit", 
              hour12: true 
            });
            const dateStr = orderDate.toLocaleDateString("en-IN", { 
              day: "2-digit", 
              month: "short", 
              year: "numeric" 
            });

            return (
              <div 
                key={order.id} 
                className="group bg-slate-900 border border-slate-800/60 p-5 rounded-[2.5rem] flex items-center justify-between hover:bg-slate-800/20 hover:border-amber-500/30 transition-all shadow-xl active:scale-[0.99] relative overflow-hidden"
              >
                <div className="flex items-center gap-6 truncate">
                  {/* Dynamic Ticket Channel Source Box */}
                  <div className="h-16 w-16 rounded-[1.5rem] bg-slate-950 flex flex-col items-center justify-center border border-slate-800 group-hover:border-amber-500/20 transition-colors shrink-0 shadow-inner">
                    <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter mb-0.5">Source</span>
                    <span className="text-amber-500 font-black text-lg italic leading-none uppercase">
                      {(order.source || "POS")[0]}
                    </span>
                  </div>
                  
                  <div className="truncate">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-black text-white text-2xl tracking-tighter italic leading-none">
                        {order.tokenNumber}
                      </span>
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-800">
                        {consolidatedItems.length} Items
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-500 text-[10px] font-black uppercase tracking-[0.12em]">
                      <span className="flex items-center gap-1.5"><CalendarIcon size={11} className="text-slate-700" /> {dateStr}</span>
                      <span className="flex items-center gap-1.5"><Clock size={11} className="text-slate-700" /> {timeStr}</span>
                    </div>
                    
                    {/* Display item name chips inline */}
                    {consolidatedItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 max-w-md">
                        {consolidatedItems.slice(0, 3).map((it, idx) => (
                          <span key={it.id || idx} className="text-[9px] font-bold text-slate-400 bg-slate-950/40 px-1.5 py-0.5 rounded border border-slate-800/40 truncate max-w-[120px]">
                            {it.quantity}x {it.itemName}
                          </span>
                        ))}
                        {consolidatedItems.length > 3 && (
                          <span className="text-[9px] font-bold text-amber-500 bg-amber-500/5 px-1 py-0.5 rounded border border-amber-500/10">
                            +{consolidatedItems.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6 md:gap-10 shrink-0 pl-2">
                  <div className="text-right hidden sm:block">
                    <p className="text-white font-black text-xl tracking-tighter mb-0.5">
                      {safeFormatCurrency(order.totalAmount)}
                    </p>
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      order.status === "COMPLETED" ? "text-emerald-500" : "text-amber-500"
                    )}>
                      {order.status}
                    </p>
                  </div>
                  
                  <div className="bg-slate-950 p-2 rounded-2xl border border-slate-800 group-hover:border-amber-500/30 transition-all shadow-inner">
                    {/* 🌟 FIXED: Wires up the active open modal toggle loop callback explicitly */}
                    <button
                      type="button"
                      onClick={() => setActiveReceiptOrder(order)}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 text-amber-500 hover:border-amber-500/30 text-xs font-black uppercase tracking-wider rounded-xl transition-all active:scale-95 shadow-md"
                    >
                      Reprint Bill
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* ========================================== */}
      {/* 🌟 MODAL DIALOG: INTERACTIVE RECEIPT PREVIEW & PRINT ENGINE */}
      {/* ========================================== */}
      {activeReceiptOrder && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white text-slate-950 p-6 rounded-[2rem] max-w-sm w-full relative space-y-6 shadow-2xl print:p-0 print:shadow-none animate-in zoom-in-95 duration-200">
            
            {/* Close Trigger Icon */}
            <button 
              onClick={() => setActiveReceiptOrder(null)} 
              className="absolute right-6 top-6 text-slate-400 hover:text-slate-950 transition-colors print:hidden"
            >
              <X size={18} />
            </button>

            {/* Receipt Form Structure Template view block */}
            <div className="text-center space-y-1 pt-2 border-b border-dashed border-slate-300 pb-4">
              <h3 className="text-xl font-black tracking-tighter uppercase italic">TAX INVOICE</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Store Token ID: {activeReceiptOrder.tokenNumber}</p>
              <p className="text-[9px] text-slate-400 font-medium">{new Date(activeReceiptOrder.createdAt).toLocaleString("en-IN")}</p>
              {activeReceiptOrder.customerPhone && (
                <p className="text-[9px] font-bold text-slate-600 mt-1">Phone: +91 {activeReceiptOrder.customerPhone}</p>
              )}
            </div>

            {/* Items Matrix lines loop */}
            <div className="space-y-3 text-xs max-h-48 overflow-y-auto pr-1 border-b border-dashed border-slate-300 pb-4">
              {activeReceiptOrder.items.map((it, idx) => (
                <div key={it.id || idx} className="flex justify-between items-center font-medium">
                  <div>
                    <p className="font-bold text-slate-900 uppercase tracking-tight">{it.itemName}</p>
                    <p className="text-[10px] text-slate-500">{it.quantity} x {safeFormatCurrency(it.price)}</p>
                  </div>
                  <span className="font-bold text-slate-900">{safeFormatCurrency(it.quantity * it.price)}</span>
                </div>
              ))}
            </div>

            {/* Tax Financial Totals Evaluation Panel */}
            <div className="space-y-1.5 text-xs font-bold text-slate-600 border-b border-dashed border-slate-300 pb-4">
              <div className="flex justify-between">
                <span className="font-medium">Subtotal Amount:</span>
                <span>{safeFormatCurrency(activeReceiptOrder.totalAmount - activeReceiptOrder.gstAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">CGST / SGST Tax Amount:</span>
                <span>{safeFormatCurrency(activeReceiptOrder.gstAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-950 pt-1">
                <span>GRAND TOTAL:</span>
                <span className="text-emerald-600 italic">{safeFormatCurrency(activeReceiptOrder.totalAmount)}</span>
              </div>
            </div>

            {/* Bottom Form Actions Control Elements Bar */}
            <div className="flex gap-2 pt-1 print:hidden">
              <button
                type="button"
                onClick={handlePrintReceiptWindow}
                className="flex-1 bg-slate-950 text-white font-black py-3 rounded-xl uppercase tracking-wider text-xs hover:bg-slate-800 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Printer size={14} /> Send To Printer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}