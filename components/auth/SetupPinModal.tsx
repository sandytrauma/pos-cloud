"use client";

import { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, 
  DialogTitle, DialogTrigger 
} from "@/components/ui/dialog";
import { ShieldCheck, KeyRound, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SetupPinModalProps {
  /** Injected dynamic server action execution callback to verify current login password */
  verifyCurrentPassword: (password: string) => Promise<{ success: boolean }>;
  /** Injected dynamic server action execution callback to save newly built security PIN */
  resetAdminPin: (password: string, newPin: string) => Promise<{ success: boolean; error?: string }>;
}

export default function SetupPinModal({ 
  verifyCurrentPassword, 
  resetAdminPin 
}: SetupPinModalProps) {
  const [step, setStep] = useState(1);
  const [password, setPassword] = useState("");
  const [newPin, setNewPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Handle Step 1: Verify Password before moving to Step 2
  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await verifyCurrentPassword(password);

      if (res && res.success === true) {
        setStep(2); 
        toast.success("Identity verified.");
      } else {
        toast.error("Invalid password. Please try again.");
      }
    } catch (err) {
      toast.error("Connection or configuration error.");
    } finally {
      setLoading(false);
    }
  };

  // Handle Step 2: Final PIN Save
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) return toast.error("PIN must be at least 4 digits");
    
    setLoading(true);
    try {
      const res = await resetAdminPin(password, newPin);
      if (res.success) {
        toast.success("Admin PIN updated!");
        setOpen(false);
        resetModal();
      } else {
        toast.error(res.error || "Failed to update PIN");
      }
    } catch (error) {
      toast.error("Failed to commit updates to database context.");
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(1);
    setPassword("");
    setNewPin("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) resetModal(); }}>
      <DialogTrigger asChild>
        <button className="flex h-12 w-full items-center gap-4 rounded-xl px-4 text-sm font-bold text-slate-500 hover:bg-slate-900 hover:text-white transition-colors">
          <ShieldCheck size={20} />
          <span>Admin PIN</span>
        </button>
      </DialogTrigger>

      <DialogContent className="bg-slate-900 border-slate-800 text-white rounded-[2rem] p-8 w-[95%] max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">
            {step === 1 ? "Verify Identity" : "New Admin PIN"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={step === 1 ? handleVerifyPassword : handleSavePin} className="space-y-6 pt-4">
          {step === 1 ? (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-12 text-white focus:border-amber-500 outline-none transition-all placeholder:text-slate-800"
                  placeholder="Account Password"
                />
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">6-Digit PIN</label>
              <input 
                type="password"
                maxLength={6}
                required
                autoFocus
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-5 text-center text-3xl font-black tracking-[0.5em] text-amber-500 focus:border-amber-500 outline-none transition-all placeholder:text-slate-900"
                placeholder="******"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-amber-500 text-slate-950 rounded-2xl font-black uppercase italic text-lg shadow-xl shadow-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:bg-slate-800 disabled:text-slate-600"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{step === 1 ? "Verify Identity" : "Save PIN"}</span>
                <ArrowRight size={20} />
              </>
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}