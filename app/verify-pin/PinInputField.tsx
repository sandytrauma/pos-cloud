// Location: app/verify-pin/PinInputField.tsx
"use client"; 

import { useState, useRef, useTransition, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PinInputFieldProps {
  verifyAction: (pin: string) => Promise<{ success: boolean; error?: string }>;
}

export default function PinInputField({ verifyAction }: PinInputFieldProps) {
  const [pin, setPin] = useState<string[]>(new Array(6).fill(""));
  const [isPending, startTransition] = useTransition();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current = inputRefs.current.slice(0, 6);
  }, []);

  const handleChange = (value: string, index: number) => {
    const cleanValue = value.replace(/\D/g, "");
    if (!cleanValue && value !== "") return;
    
    const newPin = [...pin];
    newPin[index] = cleanValue.substring(cleanValue.length - 1);
    setPin(newPin);

    if (cleanValue && index < 5) {
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!pin[index] && index > 0) {
        const newPin = [...pin];
        newPin[index - 1] = "";
        setPin(newPin);
        inputRefs.current[index - 1]?.focus();
      } else {
        const newPin = [...pin];
        newPin[index] = "";
        setPin(newPin);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (!/^\d{6}$/.test(pastedData)) return;

    const digits = pastedData.split("");
    setPin(digits);
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const joinedPin = pin.join("");
    
    if (joinedPin.length < 6) {
      toast.error("Please fill out all 6 digits completely.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await verifyAction(joinedPin);
        
        if (res?.success) {
          toast.success("Identity Confirmed. Access Granted.");
          window.location.href = "/dashboard";
        } else {
          toast.error(res?.error || "Invalid Admin Access PIN");
          setPin(new Array(6).fill(""));
          setTimeout(() => {
            if (inputRefs.current && inputRefs.current[0]) {
              inputRefs.current[0].focus();
            }
          }, 50);
        }
      } catch (error) {
        toast.error("Network communication failure validating terminal token.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="flex justify-center items-center gap-2.5" onPaste={handlePaste}>
        {pin.map((digit, index) => (
          <input
            key={index}
            type="text"
            pattern="\d*"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            disabled={isPending}
            ref={(el) => { inputRefs.current[index] = el; }}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            autoComplete="one-time-code"
            autoCapitalize="off"
            spellCheck="false"
            className="w-12 h-14 bg-slate-950 border border-slate-800 rounded-xl text-center text-xl font-black text-amber-500 focus:border-amber-500 outline-none transition-all disabled:opacity-30 selection:bg-transparent"
            autoFocus={index === 0}
            required
          />
        ))}
      </div>
      
      <button 
        type="submit"
        disabled={isPending}
        className="w-full py-4 bg-amber-500 text-slate-950 rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-amber-500/10 active:scale-[0.98] hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="animate-spin" size={14} strokeWidth={3} />
            <span>Authorizing...</span>
          </>
        ) : (
          <span>Authorize Access</span>
        )}
      </button>
    </form>
  );
}