"use client";

import { useState } from "react";
import { Search, Crown, CalendarCheck, User, Sparkles, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerRow, getCustomers } from "./actions";
import SubscriptionModal from "./SubscriptionModal";

interface CustomerDirectoryProps {
  initialCustomers: CustomerRow[];
}

const currencyFormatter = (value: number) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
};

export default function CustomerDirectory({ initialCustomers }: CustomerDirectoryProps) {
  const [customers, setCustomers] = useState<CustomerRow[]>(initialCustomers);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerRow | null>(null);

  async function handleSearch(term: string) {
    setSearch(term);
    const res = await getCustomers(term);
    if (res.success && res.data) {
      setCustomers(res.data);
    }
  }

  async function refreshData() {
    const res = await getCustomers(search);
    if (res.success && res.data) {
      setCustomers(res.data);
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            placeholder="Search by customer name or phone..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-xs font-bold text-white placeholder:text-slate-600 outline-none focus:border-amber-500 transition-all"
          />
        </div>
        <div className="text-slate-400 text-xs font-bold">
          Total Profiles: <span className="text-white">{customers.length}</span>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-slate-500 text-[10px] uppercase font-black tracking-widest bg-slate-950/40">
                <th className="p-5">Customer</th>
                <th className="p-5">Status Tier</th>
                <th className="p-5">Active Subscription</th>
                <th className="p-5">Loyalty Points</th>
                <th className="p-5">Total Spent</th>
                <th className="p-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs">
              {customers.map((c) => (
                <tr key={c.userId} className="text-slate-300 hover:bg-slate-950/40 transition-colors">
                  <td className="p-5">
                    <div className="font-black text-white">{c.name}</div>
                    <div className="text-[11px] text-slate-500 font-medium">{c.phone || "No phone linked"}</div>
                  </td>
                  <td className="p-5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border",
                        c.customerType === "VIP" && "bg-amber-500/10 text-amber-400 border-amber-500/20",
                        c.customerType === "SUBSCRIBER" && "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                        c.customerType === "REGULAR" && "bg-slate-800 text-slate-400 border-slate-700"
                      )}
                    >
                      {c.customerType === "VIP" && <Crown size={11} />}
                      {c.customerType === "SUBSCRIBER" && <CalendarCheck size={11} />}
                      {c.customerType === "REGULAR" && <User size={11} />}
                      {c.customerType}
                    </span>
                  </td>
                  <td className="p-5">
                    {c.activePlanName ? (
                      <div>
                        <div className="text-emerald-400 font-black">{c.activePlanName}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{c.remainingDays} days remaining</div>
                      </div>
                    ) : (
                      <span className="text-slate-600 font-medium italic">No active package</span>
                    )}
                  </td>
                  <td className="p-5 font-black text-amber-400">
                    <span className="flex items-center gap-1">
                      <Coins size={12} /> {c.loyaltyPoints}
                    </span>
                  </td>
                  <td className="p-5 font-black text-white">{currencyFormatter(c.totalSpent)}</td>
                  <td className="p-5 text-right">
                    <button
                      onClick={() => setSelectedCustomer(c)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-slate-950 border border-amber-500/20 text-amber-400 text-[10px] font-black uppercase tracking-wider transition-all inline-flex items-center gap-1"
                    >
                      <Sparkles size={11} />
                      {c.activePlanName ? "Renew / Change" : "Assign Plan"}
                    </button>
                  </td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-600 font-black uppercase tracking-widest italic">
                    No matching customer profiles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-over Plan Assignment Modal */}
      {selectedCustomer && (
        <SubscriptionModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onSuccess={refreshData}
        />
      )}
    </div>
  );
}