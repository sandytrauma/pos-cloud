// Location: components/pos/PosClient.tsx
"use client";

import React, { useState } from "react";
import { 
  ShoppingCart, Plus, Minus, Receipt, 
  Utensils, Trash2, X, Loader2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface CartItem {
  name: string;
  price: number;
  qty: number;
}

interface PosClientProps {
  /** Map arrays containing core digital catalogs and matching sub-item entities */
  initialMenu: any[];
  /** Injected server action callback to commit active transactional order records */
  createPosOrder: (formData: {
    items: { itemName: string; quantity: number; price: number }[];
  }) => Promise<{ success: boolean; token?: string; error?: string }>;
  /** Optional dynamic white-label indicator variable config (Defaults to "₹") */
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

  /**
   * 🌟 FIXED: Native Inline Tax Processing
   * Bypasses dangerous prop passing rules and keeps checkout lightning-fast.
   */
  const calculateGstBreakdown = (totalAmount: number) => {
    const gstAmount = (totalAmount * 5) / 100;
    return {
      netAmount: totalAmount,
      gstAmount: gstAmount
    };
  };

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

  // --- Calculations ---
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const { gstAmount } = calculateGstBreakdown(subtotal);
  const total = subtotal + gstAmount;

  // --- Checkout Processing ---
  const handleCheckout = async () => {
    if (cart.length === 0 || isSending) return;
    
    if (typeof createPosOrder !== "function") {
      return toast.error("Database connection missing from terminal router.");
    }

    setIsSending(true);
    try {
      const res = await createPosOrder({
        items: cart.map(i => ({ itemName: i.name, quantity: i.qty, price: i.price }))
      });
      if (res.success) {
        toast.success(`Token ${res.token || "N/A"} created!`, {
          description: `Date: ${format(new Date(), "dd MMM yyyy")} | Time: ${format(new Date(), "hh:mm a")}`,
        });
        setCart([]);
        setIsCartOpen(false);
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

      {/* RIGHT/OVERLAY: Cart Drawer Summary Sheet */}
      <div className={cn(
        "fixed inset-0 lg:relative lg:inset-auto z-[100] lg:z-0 lg:flex lg:w-[400px] bg-slate-950/80 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none transition-transform duration-300",
        isCartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
      )}>
        <div className="absolute bottom-0 lg:relative w-full h-[90vh] lg:h-full bg-slate-900 border-t lg:border border-slate-800 rounded-t-[3rem] lg:rounded-[3rem] flex flex-col shadow-2xl overflow-hidden shrink-0">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-amber-500" size={20} />
              <h2 className="text-white font-black uppercase italic tracking-tighter text-lg">Order <span className="text-amber-500">List</span></h2>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={clearCart} className="p-2 text-slate-500 hover:text-rose-500" aria-label="Purge total cart list items"><Trash2 size={18} /></button>
              <button type="button" onClick={() => setIsCartOpen(false)} className="lg:hidden p-2 text-slate-200 bg-slate-800 rounded-full"><X size={18} /></button>
            </div>
          </div>

          {/* Cart Item Feed List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-[1.5rem] flex justify-between items-center border border-slate-800/40">
                <div className="flex-1 pr-2 truncate">
                  <p className="text-white font-bold text-xs uppercase truncate">{item.name}</p>
                  <p className="text-[10px] text-slate-500 font-black italic mt-0.5">{currencySymbol}{item.price}</p>
                </div>
                <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-xl shrink-0">
                  <button type="button" onClick={() => removeFromCart(item.name)} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-rose-500"><Minus size={14}/></button>
                  <span className="text-white font-black text-sm w-4 text-center">{item.qty}</span>
                  <button type="button" onClick={() => addToCart(item)} className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-emerald-500"><Plus size={14}/></button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-20">
                <Utensils size={48} className="text-slate-400 mb-2" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Add items to start</p>
              </div>
            )}
          </div>

          {/* Financial Breakdown Processing Footer */}
          <div className="p-8 bg-slate-950/80 border-t border-slate-800 space-y-4 backdrop-blur-md">
            <div className="flex justify-between items-end">
              <span className="text-xs font-black uppercase text-white tracking-widest mb-1">Total Amount</span>
              <span className="text-5xl font-black text-amber-500 tracking-tighter italic leading-none">{currencySymbol}{total.toFixed(0)}</span>
            </div>
            <button 
              type="button"
              onClick={handleCheckout}
              disabled={cart.length === 0 || isSending}
              className={cn(
                "w-full py-6 rounded-[2rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl font-black text-xl uppercase tracking-tighter italic disabled:opacity-50",
                isSending ? "bg-slate-800 text-slate-600" : "bg-amber-500 text-slate-950 shadow-amber-500/20"
              )}
            >
              {isSending ? (
                <Loader2 size={24} className="animate-spin text-white" />
              ) : (
                <>
                  <Receipt size={24} /> 
                  <span>Punch Order</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}