// Location: components/pos/PosClient.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  ShoppingCart, Plus, Minus, Receipt, Utensils, 
  Trash2, X, Loader2, Sparkles, Printer, CheckCircle2, 
  Phone, User, ArrowRight, UserCheck, Search, LayoutGrid, 
  List, Banknote, QrCode, CreditCard, FileText, Check, 
  Clock, Hash, MapPin
} from "lucide-react";
import { cn, formatINR } from "@/lib/utils";
import { toast } from "sonner";
import CustomerProfileLookup from "./CustomerProfileLookup";
import type { CustomerProfileData } from "@/lib/actions/customer-actions";

// Self-contained interfaces for 100% type safety
export interface PosOrderItem {
  itemName: string;
  quantity: number;
  price?: number;
  notes?: string;
}

export interface PosOrderPayload {
  customerPhone?: string;
  userId?: number | null;
  customerName?: string;
  items: PosOrderItem[];
  subtotal?: number;
  discount?: number;
  gstAmount?: number;
  netAmount?: number;
  loyaltyPointsEarned?: number;
  orderType?: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableNumber?: string;
  paymentMethod?: "CASH" | "UPI" | "CARD";
  amountTendered?: number;
  changeDue?: number;
}

export interface PosReceiptData {
  tokenNumber: string;
  date: string;
  time: string;
  items: { itemName: string; quantity: number; price: number; notes?: string }[];
  subtotal: number;
  discount: number;
  gstAmount: number;
  total: number;
  customerName?: string;
  loyaltyPointsEarned: number;
  orderType?: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableNumber?: string;
  paymentMethod?: "CASH" | "UPI" | "CARD";
  amountTendered?: number;
  changeDue?: number;
}

interface CartItem {
  name: string;
  price: number;
  qty: number;
  notes?: string;
}

interface PosClientProps {
  initialMenu: any[];
  createPosOrder: (formData: PosOrderPayload | any) => Promise<{
    success: boolean;
    orderId?: number;
    token?: string;
    receipt?: PosReceiptData | any;
    error?: string;
  }>;
  currencySymbol?: string;
}

export default function PosClient({ 
  initialMenu = [], 
  createPosOrder, 
  currencySymbol = "₹"
}: PosClientProps) {
  const [activeCategory, setActiveCategory] = useState<any>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [orderType, setOrderType] = useState<"DINE_IN" | "TAKEAWAY" | "DELIVERY">("DINE_IN");
  const [tableNumber, setTableNumber] = useState("");
  const [editingNoteItem, setEditingNoteItem] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "UPI" | "CARD">("CASH");
  const [cashTendered, setCashTendered] = useState<string>("");

  const [activeCustomer, setActiveCustomer] = useState<CustomerProfileData | null>(null);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [promptPhone, setPromptPhone] = useState("");
  const [promptName, setPromptName] = useState("");
  const [completedReceipt, setCompletedReceipt] = useState<PosReceiptData | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        if (searchQuery) setSearchQuery("");
        else searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [searchQuery]);

  const allDishes = React.useMemo(() => {
    const list: any[] = [];
    initialMenu.forEach(cat => {
      (cat.items || []).forEach((item: any) => {
        list.push({ ...item, categoryName: cat.name, categoryId: cat.id });
      });
    });
    return list;
  }, [initialMenu]);

  const displayedItems = React.useMemo(() => {
    let base = activeCategory === "all" 
      ? allDishes 
      : (initialMenu.find(c => c.id === activeCategory)?.items || []);
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return allDishes.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.categoryName && item.categoryName.toLowerCase().includes(q))
      );
    }
    return base;
  }, [activeCategory, allDishes, initialMenu, searchQuery]);

  const addToCart = (item: any) => {
    if (typeof window !== "undefined" && window.navigator?.vibrate) {
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

  const updateItemNote = (name: string, noteText: string) => {
    setCart(prev => prev.map(i => 
      i.name === name ? { ...i, notes: noteText } : i
    ));
  };

  const clearCart = () => {
    if (cart.length > 0) {
      setCart([]);
      setCashTendered("");
      toast.info("Cart cleared");
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  let discount = 0;
  if (activeCustomer) {
    if (activeCustomer.customerType === "SUBSCRIBER") {
      discount = subtotal * 0.15;
    } else if (activeCustomer.customerType === "VIP" || activeCustomer.isLoyal) {
      discount = subtotal * 0.10;
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const gstAmount = (discountedSubtotal * 5) / 100;
  const total = discountedSubtotal + gstAmount;
  const loyaltyPointsEarned = Math.floor(total * 0.1);

  const tenderedNumeric = parseFloat(cashTendered) || 0;
  const changeDue = paymentMethod === "CASH" && tenderedNumeric > total ? tenderedNumeric - total : 0;

  const handleInitiateCheckout = () => {
    if (cart.length === 0 || isSending) return;

    if (activeCustomer) {
      executeOrderSubmission({
        userId: activeCustomer.userId,
        phone: activeCustomer.phone || undefined,
        name: activeCustomer.name,
      });
    } else {
      executeOrderSubmission();
    }
  };

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
        items: cart.map(i => ({ 
          itemName: i.name, 
          quantity: i.qty, 
          price: i.price,
          notes: i.notes 
        })),
        subtotal,
        discount,
        gstAmount,
        netAmount: total,
        loyaltyPointsEarned: customerMeta?.phone ? loyaltyPointsEarned : 0,
        orderType,
        tableNumber: orderType === "DINE_IN" && tableNumber.trim() ? tableNumber.trim() : undefined,
        paymentMethod,
        amountTendered: paymentMethod === "CASH" && tenderedNumeric > 0 ? tenderedNumeric : undefined,
        changeDue: paymentMethod === "CASH" && changeDue > 0 ? changeDue : undefined,
      };

      const res = await createPosOrder(payload);

      if (res.success) {
        toast.success(`Token ${res.token || "N/A"} punched successfully!`);
        if (res.receipt) {
          setCompletedReceipt(res.receipt as PosReceiptData);
        }
        setCart([]);
        setIsCartOpen(false);
        setPromptPhone("");
        setPromptName("");
        setActiveCustomer(null);
        setCashTendered("");
        setTableNumber("");
      } else {
        toast.error(res.error || "Failed to commit order execution.");
      }
    } catch (error) {
      toast.error("Network or terminal connection error.");
    } finally {
      setIsSending(false);
    }
  };

  const getItemCartQty = (name: string) => {
    return cart.find(i => i.name === name)?.qty || 0;
  };

  return (
    <div className="relative flex flex-col lg:flex-row gap-4 h-[calc(100vh-100px)] lg:h-[calc(100vh-140px)] overflow-hidden w-full text-slate-100">
      
      {/* LEFT + CENTER: Catalog & Real-Time Search */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden space-y-3">
        
        {/* Top Controls Bar */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-3 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shrink-0 shadow-lg">
          
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search dishes or categories... (Press '/' to search)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-9 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 shrink-0 self-end md:self-auto">
            <button
              type="button"
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                viewMode === "grid" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              )}
              title="Grid View"
            >
              <LayoutGrid size={15} />
              <span className="hidden sm:inline text-[10px] uppercase font-black">Grid</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                viewMode === "list" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
              )}
              title="Compact List View"
            >
              <List size={15} />
              <span className="hidden sm:inline text-[10px] uppercase font-black">Compact</span>
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar shrink-0 px-1 py-1">
          <button
            type="button"
            onClick={() => { setActiveCategory("all"); setSearchQuery(""); }}
            className={cn(
              "px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shrink-0 active:scale-95 flex items-center gap-1.5 shadow-sm",
              activeCategory === "all" && !searchQuery
                ? "bg-amber-500 text-slate-950 shadow-amber-500/20" 
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            )}
          >
            <span>All Dishes</span>
            <span className={cn(
              "text-[9px] px-1.5 py-0.5 rounded-full font-mono",
              activeCategory === "all" && !searchQuery ? "bg-slate-950 text-amber-500" : "bg-slate-800 text-slate-400"
            )}>
              {allDishes.length}
            </span>
          </button>

          {initialMenu.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => { setActiveCategory(cat.id); setSearchQuery(""); }}
              className={cn(
                "px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shrink-0 active:scale-95 flex items-center gap-1.5 shadow-sm",
                activeCategory === cat.id && !searchQuery
                  ? "bg-amber-500 text-slate-950 shadow-amber-500/20" 
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              )}
            >
              <span>{cat.name}</span>
              <span className={cn(
                "text-[9px] px-1.5 py-0.5 rounded-full font-mono",
                activeCategory === cat.id && !searchQuery ? "bg-slate-950 text-amber-500" : "bg-slate-800 text-slate-400"
              )}>
                {(cat.items || []).length}
              </span>
            </button>
          ))}
        </div>

        {/* Menu Items Container */}
        <div className="flex-1 overflow-y-auto pr-1 pb-24 lg:pb-2">
          {viewMode === "grid" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 content-start">
              {displayedItems.map((item: any) => {
                const cartQty = getItemCartQty(item.name);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => addToCart(item)}
                    className={cn(
                      "group relative p-4 bg-slate-900 border-2 rounded-3xl flex flex-col justify-between hover:border-amber-500/60 active:scale-95 transition-all text-left shadow-lg min-h-[120px]",
                      cartQty > 0 ? "border-amber-500/80 bg-slate-900/90" : "border-slate-800"
                    )}
                  >
                    {cartQty > 0 && (
                      <div className="absolute -top-2 -right-2 bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-lg flex items-center gap-1">
                        <span>{cartQty} in cart</span>
                      </div>
                    )}

                    <div className="space-y-1">
                      <span className="text-white font-black text-xs sm:text-sm uppercase leading-tight line-clamp-2 block group-hover:text-amber-400 transition-colors">
                        {item.name}
                      </span>
                      {item.categoryName && (
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">
                          {item.categoryName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 mt-2">
                      <span className="text-amber-500 font-black text-lg sm:text-xl italic tracking-tighter">
                        {currencySymbol}{Number(item.price || 0).toFixed(0)}
                      </span>
                      <div className="w-7 h-7 rounded-xl bg-slate-800 group-hover:bg-amber-500 group-hover:text-slate-950 text-slate-400 flex items-center justify-center transition-all">
                        <Plus size={14} strokeWidth={3} />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl divide-y divide-slate-800/60">
              {displayedItems.map((item: any) => {
                const cartQty = getItemCartQty(item.name);
                return (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="p-3.5 hover:bg-slate-800/40 cursor-pointer flex items-center justify-between transition-colors group select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-colors",
                        cartQty > 0 ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                      )}>
                        {cartQty > 0 ? `${cartQty}x` : <Utensils size={13} />}
                      </div>
                      <div className="truncate">
                        <p className="text-white font-bold text-xs uppercase truncate group-hover:text-amber-400">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-slate-500 uppercase font-black">
                          {item.categoryName || "General"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-amber-500 font-black text-sm italic">
                        {currencySymbol}{Number(item.price || 0).toFixed(0)}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); addToCart(item); }}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 flex items-center justify-center transition-all"
                      >
                        <Plus size={13} strokeWidth={3} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {displayedItems.length === 0 && (
            <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-3xl text-slate-500 font-bold text-xs uppercase tracking-widest">
              No matching dishes found
            </div>
          )}
        </div>
      </div>

      {/* MOBILE TRIGGER */}
      <div className="lg:hidden fixed bottom-20 left-1/2 -translate-x-1/2 w-[92%] z-50">
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="w-full bg-amber-500 text-slate-950 font-black py-4 rounded-2xl flex items-center justify-between px-6 shadow-2xl shadow-amber-500/40 active:scale-95 transition-all"
        >
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} />
            <span className="uppercase tracking-wider text-xs font-black">{cart.reduce((s, i) => s + i.qty, 0)} Items</span>
          </div>
          <span className="text-lg font-black italic">{currencySymbol}{total.toFixed(0)}</span>
        </button>
      </div>

      {/* RIGHT: Cart Drawer */}
      <div className={cn(
        "fixed inset-0 lg:relative lg:inset-auto z-[100] lg:z-0 lg:flex lg:w-[440px] bg-slate-950/85 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none transition-transform duration-300",
        isCartOpen ? "translate-y-0" : "translate-y-full lg:translate-y-0"
      )}>
        <div className="absolute bottom-0 lg:relative w-full h-[94vh] lg:h-full bg-slate-900 border-t lg:border border-slate-800 rounded-t-[2.5rem] lg:rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden shrink-0">
          
          {/* Cart Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <ShoppingCart className="text-amber-500" size={18} />
              <h2 className="text-white font-black uppercase italic tracking-tighter text-base">
                Current <span className="text-amber-500">Order</span>
              </h2>
              <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                {cart.reduce((s, i) => s + i.qty, 0)}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <button 
                type="button" 
                onClick={clearCart} 
                className="p-2 text-slate-500 hover:text-rose-500 rounded-xl hover:bg-slate-800/50 transition-all" 
                title="Clear Cart"
              >
                <Trash2 size={16} />
              </button>
              <button 
                type="button" 
                onClick={() => setIsCartOpen(false)} 
                className="lg:hidden p-1.5 text-slate-400 bg-slate-800 rounded-full"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Order Type & Table Switcher */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 space-y-2">
            <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setOrderType("DINE_IN")}
                className={cn(
                  "py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                  orderType === "DINE_IN" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                )}
              >
                <Utensils size={12} /> Dine-In
              </button>
              <button
                type="button"
                onClick={() => setOrderType("TAKEAWAY")}
                className={cn(
                  "py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                  orderType === "TAKEAWAY" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                )}
              >
                <Receipt size={12} /> Takeaway
              </button>
              <button
                type="button"
                onClick={() => setOrderType("DELIVERY")}
                className={cn(
                  "py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                  orderType === "DELIVERY" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                )}
              >
                <MapPin size={12} /> Delivery
              </button>
            </div>

            {orderType === "DINE_IN" && (
              <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
                <Hash size={13} className="text-amber-500 shrink-0" />
                <input
                  type="text"
                  placeholder="Table Number (Optional, e.g. 4 or A-2)"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full bg-transparent text-[11px] font-bold text-white placeholder:text-slate-600 outline-none"
                />
              </div>
            )}
          </div>

          {/* Customer Lookup */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/30">
            <CustomerProfileLookup onSelectCustomer={setActiveCustomer} />
          </div>

          {/* Cart Feed */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {cart.map((item, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-2xl border border-slate-800/60 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1 pr-2 min-w-0">
                    <p className="text-white font-bold text-xs uppercase truncate leading-tight">{item.name}</p>
                    <p className="text-[10px] text-amber-500 font-black italic mt-0.5">
                      {currencySymbol}{item.price} each • <span className="text-slate-400 font-mono">{currencySymbol}{(item.price * item.qty).toFixed(0)}</span>
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button 
                      type="button" 
                      onClick={() => removeFromCart(item.name)} 
                      className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-all"
                    >
                      <Minus size={12} strokeWidth={2.5}/>
                    </button>
                    <span className="text-white font-black text-xs w-5 text-center font-mono">{item.qty}</span>
                    <button 
                      type="button" 
                      onClick={() => addToCart(item)} 
                      className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-all"
                    >
                      <Plus size={12} strokeWidth={2.5}/>
                    </button>
                  </div>
                </div>

                {/* Kitchen Note Field */}
                <div className="pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px]">
                  {editingNoteItem === item.name ? (
                    <div className="flex items-center gap-1.5 w-full">
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. Less spicy, pack separate..."
                        defaultValue={item.notes || ""}
                        onBlur={(e) => {
                          updateItemNote(item.name, e.target.value);
                          setEditingNoteItem(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            updateItemNote(item.name, (e.target as HTMLInputElement).value);
                            setEditingNoteItem(null);
                          }
                        }}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-white text-[10px] outline-none focus:border-amber-500"
                      />
                      <button 
                        type="button" 
                        onClick={() => setEditingNoteItem(null)} 
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Check size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between w-full">
                      <button
                        type="button"
                        onClick={() => setEditingNoteItem(item.name)}
                        className="text-slate-500 hover:text-amber-400 flex items-center gap-1 font-bold text-[9px] uppercase tracking-tight"
                      >
                        <FileText size={11} />
                        <span>{item.notes ? `Note: "${item.notes}"` : "+ Add Kitchen Note"}</span>
                      </button>
                      {item.notes && (
                        <button
                          type="button"
                          onClick={() => updateItemNote(item.name, "")}
                          className="text-slate-600 hover:text-rose-500"
                          title="Remove Note"
                        >
                          <X size={10} />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-16 opacity-30 text-center">
                <Utensils size={36} className="text-slate-400 mb-2 stroke-[1.5]" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Order is empty</p>
                <p className="text-[9px] text-slate-600 mt-1">Tap menu items to add</p>
              </div>
            )}
          </div>

          {/* Tender Calculator & Punch Footer */}
          <div className="p-4 bg-slate-950/95 border-t border-slate-800 space-y-3 backdrop-blur-md">
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Payment Method</label>
              <div className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("CASH")}
                  className={cn(
                    "py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                    paymentMethod === "CASH" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  <Banknote size={13} /> Cash
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentMethod("UPI"); setCashTendered(""); }}
                  className={cn(
                    "py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                    paymentMethod === "UPI" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  <QrCode size={13} /> UPI / QR
                </button>
                <button
                  type="button"
                  onClick={() => { setPaymentMethod("CARD"); setCashTendered(""); }}
                  className={cn(
                    "py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1",
                    paymentMethod === "CARD" ? "bg-amber-500 text-slate-950 shadow-md" : "text-slate-400 hover:text-white"
                  )}
                >
                  <CreditCard size={13} /> Card
                </button>
              </div>
            </div>

            {paymentMethod === "CASH" && (
              <div className="bg-slate-900/80 p-2.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-400 uppercase">Cash Tendered:</span>
                  <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                    <span className="text-amber-500 font-bold">{currencySymbol}</span>
                    <input
                      type="number"
                      placeholder="Amount"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-20 bg-transparent text-right text-xs font-black text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setCashTendered(Math.ceil(total).toString())}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[9px] font-black shrink-0"
                  >
                    Exact ({currencySymbol}{Math.ceil(total)})
                  </button>
                  {[100, 200, 500, 2000].map(val => (
                    val >= total ? (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashTendered(val.toString())}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[9px] font-black shrink-0"
                      >
                        {currencySymbol}{val}
                      </button>
                    ) : null
                  ))}
                </div>

                {tenderedNumeric > 0 && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/80 text-xs">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Change Due:</span>
                    <span className={cn(
                      "font-black text-sm italic font-mono",
                      tenderedNumeric >= total ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {tenderedNumeric >= total 
                        ? `${currencySymbol}${changeDue.toFixed(2)}` 
                        : `Short: ${currencySymbol}${(total - tenderedNumeric).toFixed(2)}`}
                    </span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-1 text-xs pt-1">
              <div className="flex justify-between text-slate-400 font-bold text-[10px]">
                <span>Subtotal</span>
                <span>{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold text-[10px]">
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

              <div className="flex justify-between items-end border-t border-slate-800/80 pt-1.5">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Net Total</span>
                  <span className="text-[9px] text-slate-600 font-bold uppercase">{orderType.replace('_', ' ')}</span>
                </div>
                <span className="text-3xl font-black text-amber-500 tracking-tighter italic leading-none">
                  {currencySymbol}{total.toFixed(0)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              {!activeCustomer && (
                <button
                  type="button"
                  onClick={() => setShowPhonePrompt(true)}
                  className="px-3.5 py-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all flex items-center justify-center"
                  title="Link Customer Phone"
                >
                  <Phone size={18} />
                </button>
              )}

              <button 
                type="button"
                onClick={handleInitiateCheckout}
                disabled={cart.length === 0 || isSending}
                className={cn(
                  "flex-1 py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl font-black text-sm uppercase tracking-wider italic disabled:opacity-50",
                  isSending ? "bg-slate-800 text-slate-600" : "bg-amber-500 text-slate-950 shadow-amber-500/20 hover:bg-amber-400"
                )}
              >
                {isSending ? (
                  <Loader2 size={18} className="animate-spin text-white" />
                ) : (
                  <>
                    <Receipt size={18} /> 
                    <span>Punch Order • {currencySymbol}{total.toFixed(0)}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CUSTOMER PROMPT MODAL */}
      {showPhonePrompt && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[150] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-white font-black uppercase italic tracking-tight">
                <UserCheck className="text-amber-500" size={18} />
                <span>Customer Loyalty Profile</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPhonePrompt(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X size={14} />
              </button>
            </div>

            <p className="text-slate-400 text-xs">
              Enter phone number to credit <span className="text-amber-400 font-bold">+{loyaltyPointsEarned} loyalty points</span> to their account.
            </p>

            <div className="space-y-3">
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="tel"
                  placeholder="Customer Phone (10 digits)"
                  value={promptPhone}
                  onChange={(e) => setPromptPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all font-mono"
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
              <button
                type="button"
                onClick={() => executeOrderSubmission()}
                className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all"
              >
                Skip (Walk-in)
              </button>
              <button
                type="button"
                onClick={() => executeOrderSubmission({ phone: promptPhone, name: promptName })}
                disabled={!promptPhone.trim()}
                className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 disabled:opacity-40"
              >
                <span>Link & Punch</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* THERMAL 80MM RECEIPT MODAL */}
      {completedReceipt && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between print:hidden">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Order #{completedReceipt.tokenNumber}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black text-xs uppercase flex items-center gap-1 transition-all"
                >
                  <Printer size={13} /> Print Bill
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

            <div className="p-6 bg-white text-black font-mono text-xs space-y-3 print:m-0 print:p-2 print:w-full">
              <div className="text-center space-y-0.5 border-b border-dashed border-neutral-400 pb-3">
                <h2 className="text-base font-black uppercase tracking-tight">RESTAURANT OS</h2>
                <p className="text-[10px] text-neutral-600">Tax Invoice & Order Slip</p>
                <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">
                  {completedReceipt.orderType?.replace('_', ' ') || "DINE IN"}
                  {completedReceipt.tableNumber ? ` • Table #${completedReceipt.tableNumber}` : ""}
                </p>
              </div>

              <div className="space-y-1 text-[11px] border-b border-dashed border-neutral-400 pb-3">
                <div className="flex justify-between font-bold text-sm">
                  <span>TOKEN:</span>
                  <span className="font-black text-base">{completedReceipt.tokenNumber}</span>
                </div>
                <div className="flex justify-between text-neutral-600 text-[10px]">
                  <span>Date: {completedReceipt.date}</span>
                  <span>Time: {completedReceipt.time}</span>
                </div>
                {completedReceipt.customerName && (
                  <div className="text-neutral-700 text-[10px]">
                    Customer: <span className="font-bold">{completedReceipt.customerName}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2 py-1 border-b border-dashed border-neutral-400 pb-3">
                <div className="flex justify-between font-black text-[10px] uppercase text-neutral-500 border-b border-neutral-200 pb-1">
                  <span>Item</span>
                  <span>Qty × Price</span>
                  <span>Total</span>
                </div>
                {completedReceipt.items.map((item, i) => (
                  <div key={i} className="space-y-0.5">
                    <div className="flex justify-between">
                      <span className="font-bold truncate pr-2">{item.itemName}</span>
                      <span className="text-neutral-600 font-mono text-[10px]">{item.quantity} × {item.price}</span>
                      <span className="font-bold font-mono text-right min-w-[50px]">
                        {currencySymbol}{(item.quantity * item.price).toFixed(2)}
                      </span>
                    </div>
                    {item.notes && (
                      <p className="text-[9px] text-neutral-500 italic pl-2">↳ Note: {item.notes}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px] pt-1">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{currencySymbol}{completedReceipt.subtotal.toFixed(2)}</span>
                </div>
                {completedReceipt.discount > 0 && (
                  <div className="flex justify-between text-neutral-800 font-bold">
                    <span>Discount</span>
                    <span>-{currencySymbol}{completedReceipt.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600">
                  <span>GST (5%)</span>
                  <span>{currencySymbol}{completedReceipt.gstAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-black text-sm pt-2 border-t border-dashed border-neutral-400">
                  <span>GRAND TOTAL</span>
                  <span className="text-base">{currencySymbol}{completedReceipt.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-neutral-400 pt-2 space-y-0.5 text-[10px]">
                <div className="flex justify-between font-bold">
                  <span>Payment Mode:</span>
                  <span>{completedReceipt.paymentMethod || "CASH"}</span>
                </div>
                {completedReceipt.paymentMethod === "CASH" && completedReceipt.amountTendered && (
                  <>
                    <div className="flex justify-between text-neutral-600">
                      <span>Cash Tendered:</span>
                      <span>{currencySymbol}{completedReceipt.amountTendered.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-neutral-800 font-bold">
                      <span>Change Returned:</span>
                      <span>{currencySymbol}{(completedReceipt.changeDue || 0).toFixed(2)}</span>
                    </div>
                  </>
                )}
                {completedReceipt.loyaltyPointsEarned > 0 && (
                  <div className="flex justify-between text-neutral-700 font-bold pt-1">
                    <span>Points Earned:</span>
                    <span>+{completedReceipt.loyaltyPointsEarned} pts</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 border-t border-dashed border-neutral-400 space-y-0.5">
                <p className="font-black text-[10px] uppercase">Thank you for dining with us!</p>
                <p className="text-[9px] text-neutral-500">Please retain this receipt for your records</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}