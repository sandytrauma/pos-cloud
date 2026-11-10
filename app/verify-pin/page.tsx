import { Lock } from "lucide-react";
import PinInputField from "./PinInputField";
import { verifyAdminPin } from "@/lib/actions/auth";

export default function VerifyPinPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 md:p-12 text-center space-y-8 shadow-2xl relative z-10">
        <div className="mx-auto w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner">
          <Lock size={26} className="stroke-[2.5]" />
        </div>
        
        <div className="space-y-1.5">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter text-white">
            Terminal Security
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">
            Enter 4 to 6-Digit Operational Passkey
          </p>
        </div>

        {/* Centralized database-verified server action */}
        <PinInputField verifyAction={verifyAdminPin} />
      </div>
    </div>
  );
}
