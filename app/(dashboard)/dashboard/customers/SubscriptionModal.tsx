"use client";

import { useState, useTransition } from "react";
import { X, Sparkles, Loader2, IndianRupee } from "lucide-react";
import { CustomerRow, assignCustomSubscription } from "./actions";
import { toast } from "sonner";

interface SubscriptionModalProps {
  customer: CustomerRow;
  onClose: () => void;
  onSuccess: () => void;
}

export default function SubscriptionModal({
  customer,
  onClose,
  onSuccess,
}: SubscriptionModalProps) {
  const [planName, setPlanName] = useState("Monthly Executive Plan");
  const [durationDays, setDurationDays] = useState(30);
  const [price, setPrice] = useState(3000);
  const [mealsPerDay, setMealsPerDay] = useState(1);
  const [paymentReference, setPaymentReference] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!planName.trim() || price <= 0) {
      return toast.error("Please provide valid plan details and price.");
    }

    startTransition(async () => {
      const res = await assignCustomSubscription({
        userId: customer.userId,
        planName,
        price,
        durationDays,
        mealsPerDay,
        paymentReference,
      });

      if (res.success) {
        toast.success(`Subscription activated for ${customer.name}!`);
        onSuccess();
        onClose();
      } else {
        toast.error(res.error || "Failed to assign subscription.");
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-xl font-black text-white italic tracking-tight flex items-center gap-2">
              <Sparkles className="text-amber-500" size={20} />
              Assign Custom Meal Plan
            </h3>
            <p className="text-slate-500 text-xs mt-1">
              Customer: <span className="text-slate-300 font-bold">{customer.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-bold">
          <div className="space-y-1.5">
            <label className="text-slate-400 uppercase tracking-widest text-[9px]">
              Plan Name / Description
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 transition-all"
              placeholder="e.g. 30-Day Executive High-Protein Lunch"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-400 uppercase tracking-widest text-[9px]">
                Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                value={durationDays}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 uppercase tracking-widest text-[9px]">
                Meals / Day
              </label>
              <input
                type="number"
                min={1}
                max={4}
                value={mealsPerDay}
                onChange={(e) => setMealsPerDay(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-slate-400 uppercase tracking-widest text-[9px]">
                Total Package Price (₹)
              </label>
              <div className="relative">
                <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="number"
                  min={0}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 pl-8 text-white outline-none focus:border-amber-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-400 uppercase tracking-widest text-[9px]">
                Payment Ref / Transaction ID
              </label>
              <input
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="UPI / Cash / Receipt #"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-amber-500 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-3.5 rounded-xl uppercase tracking-wider text-[11px] transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 rounded-xl uppercase tracking-wider text-[11px] transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-40"
            >
              {isPending ? <Loader2 size={16} className="animate-spin" /> : "Confirm & Upgrade"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}