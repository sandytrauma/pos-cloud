"use client";

import { useState } from "react";
import { createPosOrder } from "@/lib/actions/orders";
import { formatINR, calculateGstBreakdown } from "@/lib/utils";
import { ShoppingCart, Plus, Minus, Receipt } from "lucide-react";

const MENU_ITEMS = [
  { id: 1, name: "Butter Chicken", price: 450 },
  { id: 2, name: "Paneer Tikka", price: 320 },
  { id: 3, name: "Dal Makhani", price: 280 },
  { id: 4, name: "Garlic Naan", price: 60 },
];



export default function PosPage() {
  const [cart, setCart] = useState<{name: string, price: number, qty: number}[]>([]);

  const addToCart = (item: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.name === item.name);
      if (existing) {
        return prev.map(i => i.name === item.name ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { name: item.name, price: item.price, qty: 1 }];
    });
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const { netAmount, gstAmount } = calculateGstBreakdown(total);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    const res = await createPosOrder({
      items: cart.map(i => ({ itemName: i.name, quantity: i.qty, price: i.price }))
    });
    if (res.success) {
      alert(`Order Token: ${res.orderId} Generated!`);
      setCart([]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-120px)]">
      {/* Menu Area */}
      <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
        <h2 className="text-2xl text-slate-400 font-bold">Menu</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => addToCart(item)}
              className="p-6 bg-slate-900 border border-slate-800 rounded-2xl text-left hover:border-amber-500 transition-all group"
            >
              <p className="font-bold text-lg text-slate-600 group-hover:text-amber-500">{item.name}</p>
              <p className="text-slate-400 font-mono">{formatINR(item.price)}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col shadow-2xl">
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
          <ShoppingCart className="text-amber-500" />
          <h2 className="text-xl text-slate-400 font-bold">Current Order</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {cart.map((item, idx) => (
            <div key={idx} className="flex text-amber-500 justify-between items-center">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-slate-500">{item.qty} x {formatINR(item.price)}</p>
              </div>
              <p className="font-bold">{formatINR(item.price * item.qty)}</p>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-800 pt-6 mt-6 space-y-2">
          <div className="flex justify-between text-slate-400">
            <span>GST (5%)</span>
            <span>{formatINR(gstAmount)}</span>
          </div>
          <div className="flex justify-between text-2xl font-black text-white">
            <span>Total</span>
            <span>{formatINR(total)}</span>
          </div>
          <button 
            onClick={handleCheckout}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-4 rounded-2xl mt-4 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Receipt size={20} /> PRINT INVOICE & TOKEN
          </button>
        </div>
      </div>
    </div>
  );
}