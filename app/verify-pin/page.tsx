"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Lock } from "lucide-react";
import { verifyAdminPin } from "@/lib/actions/auth"; // You'll create this
import { toast } from "sonner";

export default function VerifyPinPage() {
  const [pin, setPin] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await verifyAdminPin(pin);
    if (res.success) {
      toast.success("Identity Confirmed");
      router.push("/dashboard");
    } else {
      toast.error("Invalid Admin PIN");
      setPin("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[3rem] p-10 text-center space-y-8 shadow-2xl">
        <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500">
          <Lock size={32} />
        </div>
        
        <div>
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">Security Check</h1>
          <p className="text-slate-500 text-sm font-medium mt-2">Enter your 6-digit Admin Access PIN</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input 
            type="password" 
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] text-amber-500 focus:border-amber-500 outline-none transition-all"
            placeholder="******"
            autoFocus
          />
          
          <button 
            type="submit"
            className="w-full py-5 bg-amber-500 text-slate-950 rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-amber-500/10 active:scale-95 transition-all"
          >
            Authorize Access
          </button>
        </form>
      </div>
    </div>
  );
}