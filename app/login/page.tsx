"use client";

import { useActionState } from "react"; 
import { UtensilsCrossed, Loader2, ChevronLeft } from "lucide-react";
// 🌟 FIXED: Direct import guarantees Next.js registers the $$FORM_ACTION property perfectly
import { authenticate } from "@/lib/actions/auth"; 
import Link from "next/link";

interface LoginPageProps {
  /** Optional override server action to run credentials verification */
  authenticateAction?: (prevState: string | undefined, formData: FormData) => Promise<string | undefined> | any;
  /** Optional customized configuration to adjust presentation layers dynamically */
  branding?: {
    titlePrefix?: string;
    titleSuffix?: string;
    formHeaderLabel?: string;
  };
}

export default function LoginPage({ 
  authenticateAction, 
  branding 
}: LoginPageProps) {
  
  // 🌟 FIXED: Fall back safely to our explicit, statically tracked action route endpoint.
  // This layout permanently stops the "Cannot read properties of undefined (reading '$$FORM_ACTION')" error.
  const targetAction = authenticateAction || authenticate;

  const [errorMessage, dispatch, isPending] = useActionState(
    targetAction, 
    undefined
  );

  const displayPrefix = branding?.titlePrefix || "Kitchen";
  const displaySuffix = branding?.titleSuffix || "Cloud";
  const headerLabel = branding?.formHeaderLabel || "Log in to manage orders.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="relative mx-auto flex w-full max-w-[400px] flex-col space-y-2.5 py-4 animate-in fade-in duration-500">
        
        {/* Brand Banner Display */}
        <div className="flex h-24 w-full items-end rounded-t-2xl bg-amber-500 p-4 md:h-32 shadow-xl shadow-amber-500/10">
          <div className="text-slate-950 flex items-center gap-2 font-black text-2xl uppercase tracking-tighter italic">
            <UtensilsCrossed size={28} className="stroke-[2.5]" /> 
            <span>
              {displayPrefix}<span className="text-white">{displaySuffix}</span>
            </span>
            <Link href="/"><ChevronLeft size={28} className="stroke-[2.5]"/></Link>
          </div>
        </div>
        
        {/* Input Work Form Panel */}
        <form 
          action={dispatch} 
          className="space-y-4 rounded-b-2xl bg-slate-900 border border-slate-800 px-6 pb-6 pt-8 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          <h1 className="text-sm font-black text-slate-400 uppercase tracking-wide relative z-10">
            {headerLabel}
          </h1>
          
          <div className="w-full space-y-4 relative z-10">
            <div>
              <label className="mb-2 block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Email Address
              </label>
              <input
                className="peer block w-full rounded-xl border border-slate-800 bg-slate-950 py-3.5 px-4 text-sm text-white placeholder:text-slate-800 outline-none focus:border-amber-500 transition-all font-bold"
                name="email"
                type="email"
                placeholder="admin@kitchen.com"
                required
              />
            </div>
            
            <div>
              <label className="mb-2 block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                Password
              </label>
              <input
                className="peer block w-full rounded-xl border border-slate-800 bg-slate-950 py-3.5 px-4 text-sm text-white placeholder:text-slate-800 outline-none focus:border-amber-500 transition-all font-bold"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isPending} 
            className="mt-2 flex w-full items-center justify-center rounded-xl bg-amber-500 px-4 py-4 text-xs font-black uppercase tracking-widest text-slate-950 transition-all hover:bg-amber-400 active:scale-[0.98] disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed relative z-10 shadow-lg shadow-amber-500/10"
          >
            {isPending ? (
              <Loader2 className="animate-spin mr-2" size={16} />
            ) : "Sign In"}
          </button>
          
          {errorMessage && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center animate-in fade-in slide-in-from-top-2 duration-200 relative z-10">
               <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{errorMessage}</p>
            </div>
          )}
        </form>
      </div>
    </main>
  );
}