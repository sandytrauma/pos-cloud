"use client";

import { useState } from "react";
import { createPosOrder } from "@/lib/actions/orders";
import { formatINR, calculateGstBreakdown } from "@/lib/utils";
import { ShoppingCart, Plus, Minus, Receipt, Utensils, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface CartItem {
  name: string;
  price: number;
  qty: number;
}

export default function PosClient({ initialMenu }: { initialMenu: any[] }) {
  const [activeCategory, setActiveCategory] = useState(initialMenu[0]?.id || null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSending, setIsSending] = useState(false);

  // --- Cart Logic ---
  const addToCart = (item: any) => {
    // Haptic feedback for touch screens
    if (typeof window !== "undefined" && window.navigator.vibrate) {
      window.navigator.vibrate(10);
    }

    setCart(prev => {
      const existing = prev.find(i => i.name === item.name);
      if (existing) {
        return prev.map(i => i.name === item.name ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { name: item.name, price: Number(item.price), qty: 1 }];
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

  // --- Totals Calculation ---
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const { gstAmount } = calculateGstBreakdown(subtotal);
  const total = subtotal + Number(gstAmount);

  // --- Checkout Logic ---
  const handleCheckout = async () => {
    if (cart.length === 0 || isSending) return;
    
    setIsSending(true);
    try {
      const res = await createPosOrder({
        items: cart.map(i => ({ itemName: i.name, quantity: i.qty, price: i.price }))
      });
      
      if (res.success) {
        const now = new Date();
        toast.success(`Token ${res.token} created!`, {
          description: `Date: ${format(now, "dd MMM yyyy")} | Time: ${format(now, "hh:mm a")}`,
          duration: 5000,
        });
        setCart([]);
      } else {
        toast.error("Checkout failed. Please try again.");
      }
    } catch (error) {
      toast.error("A connection error occurred.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] overflow-hidden">
      
      {/* LEFT: Category Selector (Scrollable & Thumb-Friendly) */}
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar lg:w-48 shrink-0 pb-2 lg:pb-0">
        {initialMenu.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 lg:shrink active:scale-90",
              activeCategory === cat.id 
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20" 
                : "bg-slate-900 text-slate-500 border border-slate-800 hover:border-slate-700"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* CENTER: Items Grid (Big Tap Targets) */}
      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start pb-20 lg:pb-0">
        {initialMenu
          .find(c => c.id === activeCategory)
          ?.items?.map((item: any) => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="aspect-square p-5 bg-slate-900 border-2 border-slate-800 rounded-[2.5rem] flex flex-col justify-between hover:border-amber-500/50 active:scale-95 transition-all text-left group shadow-lg"
            >
              <span className="text-white font-black text-sm uppercase leading-tight group-hover:text-amber-500 transition-colors">
                {item.name}
              </span>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Price</span>
                <span className="text-amber-500 font-black text-2xl italic tracking-tighter">
                  ₹{Number(item.price).toFixed(0)}
                </span>
              </div>
            </button>
          ))}
      </div>

      {/* RIGHT: Cart & Checkout Summary */}
      <div className="w-full lg:w-[400px] bg-slate-900 border border-slate-800 rounded-[3rem] flex flex-col shadow-2xl overflow-hidden shrink-0">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-amber-500" size={20} />
            <h2 className="text-white font-black uppercase italic tracking-tighter text-lg">Order <span className="text-amber-500">List</span></h2>
          </div>
          <button 
            onClick={clearCart}
            className="p-2 text-slate-500 hover:text-rose-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {cart.map((item, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-[1.5rem] flex justify-between items-center border border-slate-800/40 animate-in slide-in-from-right-4 duration-200">
              <div className="flex-1 pr-2">
                <p className="text-white font-bold text-xs uppercase truncate w-32">{item.name}</p>
                <p className="text-[10px] text-slate-500 font-black italic mt-0.5">₹{item.price} per unit</p>
              </div>
              <div className="flex items-center gap-3 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                <button 
                  onClick={() => removeFromCart(item.name)} 
                  className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-rose-500 active:bg-rose-500 active:text-white transition-all"
                >
                  <Minus size={14}/>
                </button>
                <span className="text-white font-black text-sm w-4 text-center">{item.qty}</span>
                <button 
                  onClick={() => addToCart(item)} 
                  className="w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg text-emerald-500 active:bg-emerald-500 active:text-white transition-all"
                >
                  <Plus size={14}/>
                </button>
              </div>
            </div>
          ))}

          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center py-10 opacity-20">
              <Utensils size={48} className="text-slate-400 mb-2" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Add items to start</p>
            </div>
          )}
        </div>

        {/* Totals & Sticky Action Button */}
        <div className="p-8 bg-slate-950/80 border-t border-slate-800 space-y-4 backdrop-blur-md">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase text-slate-500 tracking-widest">
              <span>Tax (GST 5%)</span>
              <span>₹{Number(gstAmount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-xs font-black uppercase text-white tracking-widest mb-1">Grand Total</span>
              <span className="text-5xl font-black text-amber-500 tracking-tighter italic leading-none">
                ₹{total.toFixed(0)}
              </span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSending}
            className={cn(
              "w-full py-6 rounded-[2rem] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl font-black text-xl uppercase tracking-tighter italic",
              isSending 
                ? "bg-slate-800 text-slate-600 cursor-not-allowed" 
                : "bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20"
            )}
          >
            {isSending ? (
              <div className="w-6 h-6 border-4 border-slate-600 border-t-white rounded-full animate-spin" />
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
  );
}