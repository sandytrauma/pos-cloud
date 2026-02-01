"use client";

// 1. Import from 'react' instead of 'react-dom'
import { useActionState } from "react"; 
import { authenticate } from "@/lib/actions/auth";
import { UtensilsCrossed, Loader2 } from "lucide-react";

export default function LoginPage() {
  // 2. Rename useFormState to useActionState
  // The first argument is the action, second is the initial state
  const [errorMessage, dispatch, isPending] = useActionState(
    authenticate, 
    undefined
  );

  return (
    <main className="flex items-center justify-center md:h-screen bg-slate-950">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 p-4">
        <div className="flex h-20 w-full items-end rounded-t-2xl bg-amber-500 p-3 md:h-36">
          <div className="text-white flex items-center gap-2 font-bold text-2xl">
            <UtensilsCrossed size={32} /> <span>KitchenCloud</span>
          </div>
        </div>
        
        <form action={dispatch} className="space-y-3 rounded-b-2xl bg-slate-900 border border-slate-800 px-6 pb-4 pt-8 shadow-2xl">
          <h1 className="text-xl font-semibold text-slate-50">Log in to manage orders.</h1>
          
          <div className="w-full">
            <div>
              <label className="mb-2 mt-5 block text-xs font-medium text-slate-400 uppercase tracking-wider">
                Email Address
              </label>
              <input
                className="peer block w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-3 text-sm outline-none placeholder:text-slate-500 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                name="email"
                type="email"
                placeholder="admin@kitchen.com"
                required
              />
            </div>
            <div className="mt-4">
              <label className="mb-2 mt-5 block text-xs font-medium text-slate-400 uppercase tracking-wider">
                Password
              </label>
              <input
                className="peer block w-full rounded-xl border border-slate-700 bg-slate-800 py-3 pl-3 text-sm outline-none placeholder:text-slate-500 text-white focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            disabled={isPending} // 3. Use the built-in 'isPending' state
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 transition-all hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? (
              <Loader2 className="animate-spin mr-2" size={18} />
            ) : "Log in"}
          </button>
          
          {errorMessage && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
               <p className="text-xs font-bold text-rose-500 uppercase tracking-widest">{errorMessage}</p>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}