"use client";

import { useState } from "react";
import { createPosOrder } from "@/lib/actions/orders";
import { formatINR, calculateGstBreakdown } from "@/lib/utils";
import { ShoppingCart, Plus, Minus, Receipt, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function PosClient({ initialMenu }: { initialMenu: any[] }) {
  const [activeCategory, setActiveCategory] = useState(initialMenu[0]?.id || null);
  const [cart, setCart] = useState<{name: string, price: number, qty: number}[]>([]);

  const addToCart = (item: any) => {
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

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const { gstAmount } = calculateGstBreakdown(subtotal);
  const total = subtotal + Number(gstAmount);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const res = await createPosOrder({
      items: cart.map(i => ({ itemName: i.name, quantity: i.qty, price: i.price }))
    });
    if (res.success) {
      toast.success(`Order #${res.orderId} Placed!`);
      setCart([]);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-140px)] overflow-hidden">
      
      {/* LEFT: Category Selector (Vertical on Desktop, Horizontal on Mobile) */}
      <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-y-auto no-scrollbar lg:w-48 shrink-0">
        {initialMenu.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={cn(
              "px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shrink-0 lg:shrink",
              activeCategory === cat.id 
                ? "bg-amber-500 text-slate-950 shadow-lg" 
                : "bg-slate-900 text-slate-500 border border-slate-800"
            )}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* CENTER: Items Grid (Thumb-Target Optimized) */}
      <div className="flex-1 overflow-y-auto pr-2 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
        {initialMenu
          .find(c => c.id === activeCategory)
          ?.items?.map((item: any) => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="aspect-square p-5 bg-slate-900 border-2 border-slate-800 rounded-[2rem] flex flex-col justify-between hover:border-amber-500 active:scale-95 transition-all text-left group"
            >
              <span className="text-white font-black text-sm uppercase leading-tight group-hover:text-amber-500">
                {item.name}
              </span>
              <span className="text-amber-500 font-black text-xl italic tracking-tighter">
                ₹{item.price}
              </span>
            </button>
          ))}
      </div>

      {/* RIGHT: Cart & Checkout (Thumb-Ready Bottom for 7") */}
      <div className="w-full lg:w-[380px] bg-slate-900 border border-slate-800 rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-2">
          <ShoppingCart className="text-amber-500" size={20} />
          <h2 className="text-white font-black uppercase italic tracking-tighter">Bill Summary</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.map((item, idx) => (
            <div key={idx} className="bg-slate-950 p-4 rounded-2xl flex justify-between items-center border border-slate-800/50">
              <div className="flex-1">
                <p className="text-white font-bold text-xs uppercase">{item.name}</p>
                <p className="text-[10px] text-slate-500 font-black italic mt-0.5">₹{item.price} x {item.qty}</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => removeFromCart(item.name)} className="p-1 bg-slate-800 rounded-lg text-rose-500"><Minus size={14}/></button>
                <span className="text-white font-black text-sm w-4 text-center">{item.qty}</span>
                <button onClick={() => addToCart(item)} className="p-1 bg-slate-800 rounded-lg text-emerald-500"><Plus size={14}/></button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 bg-slate-950/50 border-t border-slate-800 space-y-3">
          <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
            <span>GST (5%)</span>
            <span>₹{Number(gstAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-[10px] font-black uppercase text-slate-500 mb-1">Grand Total</span>
            <span className="text-4xl font-black text-white tracking-tighter italic">₹{total.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-20 text-slate-950 font-black py-5 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-amber-500/10"
          >
            <Receipt size={22} />
            <span className="uppercase tracking-tighter text-lg">Send to Kitchen</span>
          </button>
        </div>
      </div>
    </div>
  );
}