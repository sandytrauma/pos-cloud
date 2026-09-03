// Location: components/pos/PosClient.tsx
"use client";

import React, { useState } from "react";
import { 
  ShoppingCart, Plus, Minus, Receipt, 
  Utensils, Trash2, X, Loader2, Sparkles, Printer, 
  CheckCircle2, Phone, User, ArrowRight, UserCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import CustomerProfileLookup from "./CustomerProfileLookup";
import type { CustomerProfileData } from "@/lib/actions/customer-actions";

export interface PosOrderPayload {
  customerPhone?: string;
  userId?: number | null;
  customerName?: string;
  items: { itemName: string; quantity: number; price: number }[];
  subtotal: number;
  discount?: number;
  gstAmount: number;
  netAmount: number;
  loyaltyPointsEarned?: number;
}

export interface PosReceiptData {
  tokenNumber: string;
  date: string;
  time: string;
  items: { itemName: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  gstAmount: number;
  total: number;
  customerName?: string;
  loyaltyPointsEarned: number;
}

interface CartItem {
  name: string;
  price: number;
  qty: number;
}

interface PosClientProps {
  initialMenu: any[];
  createPosOrder: (formData: PosOrderPayload) => Promise<{
    success: boolean;
    orderId?: number;
    token?: string;
    receipt?: PosReceiptData;
    error?: string;
  }>;
  currencySymbol?: string;
}

export default function PosClient({ 
  initialMenu = [], 
  createPosOrder, 
  currencySymbol = "₹"
}: PosClientProps) {
  const [activeCategory, setActiveCategory] = useState<any>(initialMenu[0]?.id || null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false); 

  // Customer Loyalty & Checkout Prompt States
  const [activeCustomer, setActiveCustomer] = useState<CustomerProfileData | null>(null);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [promptPhone, setPromptPhone] = useState("");
  const [promptName, setPromptName] = useState("");
  const [completedReceipt, setCompletedReceipt] = useState<PosReceiptData | null>(null);

  // --- Cart Logic ---
  const addToCart = (item: any) => {
    if (typeof window !== "undefined" && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }

    setCart(prev => {
      const existing = prev.find(i => i.name === item.name);
      if (existing) {
        return prev.map(i => i.name === item.name ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { name: item.name, price: Number(item.price) || 0, qty: 1 }];
    });
  };

  const removeFromCart = (name: string) => {
    setCart(prev => prev.map(i => 
      i.name === name ? { ...i, qty: i.qty - 1 } : i
    ).filter(i => i.qty > 0));
  };

  const clearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      toast.info("Cart cleared");
    }
  };

  // --- Financial Calculations ---
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  let discount = 0;
  if (activeCustomer) {
    if (activeCustomer.customerType === "SUBSCRIBER") {
      discount = subtotal * 0.15; // 15% Monthly Subscriber Allowance
    } else if (activeCustomer.customerType === "VIP" || activeCustomer.isLoyal) {
      discount = subtotal * 0.10; // 10% VIP Privilege
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const gstAmount = (discountedSubtotal * 5) / 100;
  const total = discountedSubtotal + gstAmount;
  const loyaltyPointsEarned = Math.floor(total * 0.1);

  // --- Initiate Checkout: Intercept if no customer linked ---
  const handleInitiateCheckout = () => {
    if (cart.length === 0 || isSending) return;

    // If customer already identified via lookup, commit immediately
    if (activeCustomer) {
      executeOrderSubmission({
        userId: activeCustomer.userId,
        phone: activeCustomer.phone || undefined,
        name: activeCustomer.name,
      });
    } else {
      // Prompt for phone number
      setShowPhonePrompt(true);
    }
  };

  // --- Core Order Submission ---
  const executeOrderSubmission = async (customerMeta?: {
    userId?: number | null;
    phone?: string;
    name?: string;
  }) => {
    if (typeof createPosOrder !== "function") {
      return toast.error("Database connection missing from terminal router.");
    }

    setIsSending(true);
    setShowPhonePrompt(false);

    try {
      const payload: PosOrderPayload = {
        customerPhone: customerMeta?.phone?.trim() || undefined,
        userId: customerMeta?.userId ?? null,
        customerName: customerMeta?.name?.trim() || undefined,
        items: cart.map(i => ({ itemName: i.name, quantity: i.qty, price: i.price })),
        subtotal,
        discount,
        gstAmount,
        netAmount: total,
        loyaltyPointsEarned: customerMeta?.phone ? loyaltyPointsEarned : 0,
      };

      const res = await createPosOrder(payload);

      if (res.success) {
        toast.success(`Token ${res.token || "N/A"} created!`);
        if (res.receipt) {
          setCompletedReceipt(res.receipt);
        }
        setCart([]);
        setIsCartOpen(false);
        setPromptPhone("");
        setPromptName("");
        setActiveCustomer(null);
      } else {
        toast.error(res.error || "Failed to commit order execution.");
      }
    } catch (error) {
      toast.error("Network or terminal connection error.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)] overflow-hidden w-full">
      
      {/* LEFT: Category Selector */}
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar lg:w-48 shrink-0 pb-2 lg:pb-0 px-2 lg:px-0">
        {initialMenu.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-5 py-3 lg:py-4 rounded-xl lg:rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 lg:shrink active:scale-95",
              activeCategory === cat.id 
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20" 
                : "bg-slate-900 text-slate-500 border border-slate-800"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* CENTER: Items Grid */}
      <div className="flex-1 overflow-y-auto px-2 lg:pr-2 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start pb-32 lg:pb-0">
        {(initialMenu.find(c => c.id === activeCategory)?.items || []).map((item: any) => (
          <button
            key={item.id}
            type="button"
            onClick={() => addToCart(item)}
            className="aspect-square p-4 lg:p-5 bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] flex flex-col justify-between hover:border-amber-500/50 active:scale-95 transition-all text-left shadow-lg min-w-0"
          >
            <span className="text-white font-black text-xs lg:text-sm uppercase leading-tight truncate w-full block">
              {item.name}
            </span>
            <div className="flex flex-col">
              <span className="text-amber-500 font-black text-lg lg:text-2xl italic tracking-tighter">
                {currencySymbol}{Number(item.price || 0).toFixed(0)}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* MOBILE FLOATING CART BUTTON TRIGGER */}
      <div className="lg:hidden fixed bottom-22 left-1/2 -translate-x-1/2 w-[90%] z-50">
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="w-full bg-amber-500 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-between px-6 shadow-2xl shadow-amber-500/40"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} />
            <span className="uppercase tracking-tighter text-sm">{cart.length} Items</span>
          </div>
          <span className="text-xl italic">{currencySymbol}{total.toFixed(0)}</span>
        </button>
      </div>

      {/* RIGHT/DRAWER: Cart Drawer & CRM Lookup */}
      <div className={cn(
        "fixed inset-0 lg:relative lg:inset-auto z-[100] lg:z-0 lg:flex lg:w-[420px] bg-slate-950/80 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none transition-transform duration-300",
        isCartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
      )}>
        <div className="absolute bottom-0 lg:relative w-full h-[92vh] lg:h-full bg-slate-900 border-t lg:border border-slate-800 rounded-t-[3rem] lg:rounded-[3rem] flex flex-col shadow-2xl overflow-hidden shrink-0">
          
          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-amber-500" size={18} />
              <h2 className="text-white font-black uppercase italic tracking-tighter text-base">
                Order <span className="text-amber-500">List</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={clearCart} className="p-2 text-slate-500 hover:text-rose-500" aria-label="Purge total cart list items">
                <Trash2 size={16} />
              </button>
              <button type="button" onClick={() => setIsCartOpen(false)} className="lg:hidden p-1.5 text-slate-200 bg-slate-800 rounded-full">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Customer Profile Lookup / Active Tag */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-950/40">
            <CustomerProfileLookup onSelectCustomer={setActiveCustomer} />
          </div>

          {/* Cart Item Feed List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
            {cart.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-3.5 rounded-[1.25rem] flex justify-between items-center border border-slate-800/40">
                <div className="flex-1 pr-2 truncate">
                  <p className="text-white font-bold text-xs uppercase truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500 font-black italic mt-0.5">{currencySymbol}{item.price}</p>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl shrink-0">
                  <button type="button" onClick={() => removeFromCart(item.name)} className="w-7 h-7 flex items-center justify-center bg-slate-800 rounded-lg text-rose-500"><Minus size={13}/></button>
                  <span className="text-white font-black text-xs w-4 text-center">{item.qty}</span>
                  <button type="button" onClick={() => addToCart(item)} className="w-7 h-7 flex items-center justify-center bg-slate-800 rounded-lg text-emerald-500"><Plus size={13}/></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-16 opacity-20">
                <Utensils size={40} className="text-slate-400 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Add items to start</p>
              </div>
            )}
          </div>

          {/* Financial Breakdown Processing Footer */}
          <div className="p-6 bg-slate-950/90 border-t border-slate-800 space-y-3 backdrop-blur-md">
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-slate-400 font-bold text-[11px]">
                <span>Subtotal</span>
                <span>{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold text-[11px]">
                  <span className="flex items-center gap-1">
                    <Sparkles size={11} /> {activeCustomer?.customerType} Privilege
                  </span>
                  <span>-{currencySymbol}{discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-500 font-medium text-[10px]">
                <span>GST (5%)</span>
                <span>{currencySymbol}{gstAmount.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-end border-t border-slate-800/80 pt-2">
                <span className="text-xs font-black uppercase text-white tracking-widest">Total Amount</span>
                <span className="text-4xl font-black text-amber-500 tracking-tighter italic leading-none">
                  {currencySymbol}{total.toFixed(0)}
                </span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleInitiateCheckout}
              disabled={cart.length === 0 || isSending}
              className={cn(
                "w-full py-5 rounded-2xl flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-xl font-black text-base uppercase tracking-tighter italic disabled:opacity-50",
                isSending ? "bg-slate-800 text-slate-600" : "bg-amber-500 text-slate-950 shadow-amber-500/20"
              )}
            >
              {isSending ? (
                <Loader2 size={22} className="animate-spin text-white" />
              ) : (
                <>
                  <Receipt size={22} /> 
                  <span>Punch Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 PROMPT MODAL: Fast Customer Phone Capture */}
      {showPhonePrompt && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-black uppercase italic tracking-tight">
                <UserCheck className="text-amber-500" size={20} />
                <span>Customer Details</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPhonePrompt(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-slate-400 text-xs leading-relaxed">
              Enter phone number to credit <span className="text-amber-400 font-bold">+{loyaltyPointsEarned} loyalty points</span> and link to their customer profile.
            </p>

            <div className="space-y-3">
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="tel"
                  autoFocus
                  placeholder="Customer Phone (e.g. 9876543210)"
                  value={promptPhone}
                  onChange={(e) => setPromptPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                />
              </div>

              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Customer Name (Optional)"
                  value={promptName}
                  onChange={(e) => setPromptName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {/* Skip / Walk-in Guest Button */}
              <button
                type="button"
                onClick={() => executeOrderSubmission()}
                className="flex-1 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
              >
                Skip (Walk-in)
              </button>

              {/* Confirm & Punch */}
              <button
                type="button"
                onClick={() => executeOrderSubmission({ phone: promptPhone, name: promptName })}
                disabled={!promptPhone.trim()}
                className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-40"
              >
                <span>Confirm & Punch</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Built-in Printable 80mm Receipt Modal */}
      {completedReceipt && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between print:hidden">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Order Placed
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs uppercase flex items-center gap-1 transition-all"
                >
                  <Printer size={13} /> Print
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedReceipt(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Thermal Print View */}
            <div className="p-6 bg-white text-black font-mono text-xs space-y-3 print:m-0 print:p-2 print:w-full">
              <div className="text-center space-y-0.5 border-b border-dashed border-neutral-400 pb-3">
                <h2 className="text-base font-black uppercase tracking-tight">RESTAURANT OS</h2>
                <p className="text-[10px] text-neutral-600">Tax Invoice & Order Slip</p>
                <p className="text-sm font-black mt-1">TOKEN: {completedReceipt.tokenNumber}</p>
                <p className="text-[10px] text-neutral-500">{completedReceipt.date} | {completedReceipt.time}</p>
              </div>

              {completedReceipt.customerName && (
                <div className="text-[10px] border-b border-dashed border-neutral-300 pb-2">
                  <span className="font-bold">Customer:</span> {completedReceipt.customerName}
                </div>
              )}

              <table className="w-full text-left border-collapse my-2">
                <thead>
                  <tr className="border-b border-neutral-400 text-[10px]">
                    <th className="pb-1">Item</th>
                    <th className="pb-1 text-center">Qty</th>
                    <th className="pb-1 text-right">Amt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-dashed divide-neutral-200">
                  {completedReceipt.items.map((it, idx) => (
                    <tr key={idx}>
                      <td className="py-1 pr-1 truncate max-w-[130px]">{it.itemName}</td>
                      <td className="py-1 text-center">{it.quantity}</td>
                      <td className="py-1 text-right">{currencySymbol}{(it.price * it.quantity).toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-neutral-400 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{currencySymbol}{completedReceipt.subtotal.toFixed(2)}</span>
                </div>
                {completedReceipt.discount > 0 && (
                  <div className="flex justify-between text-neutral-700 font-bold">
                    <span>Discount:</span>
                    <span>-{currencySymbol}{completedReceipt.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[10px] text-neutral-600">
                  <span>GST (5%):</span>
                  <span>{currencySymbol}{completedReceipt.gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-black border-t border-neutral-800 pt-1">
                  <span>NET TOTAL:</span>
                  <span>{currencySymbol}{completedReceipt.total.toFixed(0)}</span>
                </div>
              </div>

              {completedReceipt.loyaltyPointsEarned > 0 && (
                <div className="text-center text-[10px] bg-neutral-100 p-1.5 rounded border border-neutral-300 font-bold mt-2">
                  + {completedReceipt.loyaltyPointsEarned} Loyalty Points Credited
                </div>
              )}

              <div className="text-center text-[9px] text-neutral-500 pt-2 border-t border-dashed border-neutral-300">
                Thank You • Visit Again
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}