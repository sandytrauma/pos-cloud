"use client";

import { useState, useTransition } from "react";
import { 
  Search, 
  User, 
  Crown, 
  CalendarCheck, 
  Coins, 
  Sparkles, 
  X, 
  Loader2, 
  Phone, 
  Utensils 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { lookupCustomer, CustomerProfileData } from "@/lib/actions/customer-actions";
import { toast } from "sonner";

interface CustomerProfileLookupProps {
  onSelectCustomer?: (customer: CustomerProfileData | null) => void;
}

const currencyFormatter = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CustomerProfileLookup({ onSelectCustomer }: CustomerProfileLookupProps) {
  const [query, setQuery] = useState("");
  const [customer, setCustomer] = useState<CustomerProfileData | null>(null);
  const [isSearching, startSearch] = useTransition();

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    startSearch(async () => {
      const res = await lookupCustomer(query);
      if (res.success && res.data) {
        setCustomer(res.data);
        onSelectCustomer?.(res.data);
      } else {
        toast.error(res.error || "Customer not found");
      }
    });
  }

  function handleClear() {
    setCustomer(null);
    setQuery("");
    onSelectCustomer?.(null);
  }

  return (
    <div className="w-full space-y-3">
      {/* Search Input */}
      {!customer ? (
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Search customer by name or phone..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-semibold text-white placeholder:text-slate-600 outline-none focus:border-amber-500/50 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching || query.trim().length < 3}
            className="px-4 bg-amber-500 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider hover:bg-amber-400 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
          >
            {isSearching ? <Loader2 size={14} className="animate-spin" /> : "Lookup"}
          </button>
        </form>
      ) : (
        /* Active Customer Profile Card */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 relative overflow-hidden shadow-lg animate-in fade-in zoom-in-95 duration-200">
          {/* Header Row */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-500">
                {customer.customerType === "VIP" ? (
                  <Crown size={20} className="text-amber-400" />
                ) : customer.customerType === "SUBSCRIBER" ? (
                  <CalendarCheck size={20} className="text-emerald-400" />
                ) : (
                  <User size={20} className="text-slate-400" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-white text-sm tracking-tight">{customer.name}</h4>
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                      customer.customerType === "VIP" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                      customer.customerType === "SUBSCRIBER" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                      customer.customerType === "REGULAR" && "bg-slate-800 text-slate-400 border-slate-700"
                    )}
                  >
                    {customer.customerType}
                  </span>
                </div>
                {customer.phone && (
                  <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1 mt-0.5">
                    <Phone size={10} /> {customer.phone}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleClear}
              className="w-7 h-7 rounded-full bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
            >
              <X size={14} />
            </button>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Points</span>
              <span className="text-xs font-black text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                <Coins size={11} /> {customer.loyaltyPoints}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">LTV</span>
              <span className="text-xs font-black text-white mt-0.5 block">
                {currencyFormatter(customer.totalSpent)}
              </span>
            </div>
            <div className="bg-slate-950/60 border border-slate-800/60 rounded-xl p-2">
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">Visits</span>
              <span className="text-xs font-black text-white mt-0.5 block">{customer.totalVisits}</span>
            </div>
          </div>

          {/* Active Subscription Banner */}
          {customer.activeSubscription && (
            <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-400 shrink-0" />
                <span className="text-xs font-black text-emerald-300">
                  {customer.activeSubscription.planName}
                </span>
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-500/30">
                {customer.activeSubscription.remainingDays} Days Left
              </span>
            </div>
          )}

          {/* Upsell Indicator for Regulars */}
          {!customer.activeSubscription && customer.totalVisits >= 4 && (
            <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl p-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                <Sparkles size={13} />
                <span>Frequent Visitor • Upsell Monthly Plan</span>
              </div>
            </div>
          )}

          {/* Preferences / Tags */}
          {customer.favoriteCategories.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Utensils size={10} /> Prefers:
              </span>
              {customer.favoriteCategories.map((cat, idx) => (
                <span key={idx} className="bg-slate-950 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-800">
                  {cat}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}