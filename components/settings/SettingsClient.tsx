"use client";

import { useState, useTransition } from "react";
import { Store, ShieldAlert, Save, Loader2, Power } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SettingsClientProps {
  /** The current user session payload tracking authentication roles and IDs */
  user: {
    id: string | number;
    name?: string | null;
    role?: string | null;
  };
  /** Injected server action callback to handle core store profile adjustments */
  updateStoreSettings: (formData: FormData) => Promise<{ success: boolean; error?: string }>;
  /** Injected server action callback to handle operational lockout/maintenance status flags */
  toggleMaintenanceMode: (userId: string | number, isClosed: boolean) => Promise<{ success: boolean; error?: string }>;
}

export default function SettingsClient({ 
  user, 
  updateStoreSettings, 
  toggleMaintenanceMode 
}: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isPending, startTransition] = useTransition();
  
  // Logic: If role is matching 'maintenance', the operational flow is frozen
  const isClosed = user.role === "maintenance";

  const tabs = [
    { id: "profile", label: "Store Profile", icon: <Store size={18}/> },
    { id: "ops", label: "Operations", icon: <ShieldAlert size={18}/> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
      {/* Sidebar Navigation */}
      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95",
              activeTab === tab.id 
                ? "bg-amber-500 text-slate-950 shadow-xl shadow-amber-500/20" 
                : "text-slate-500 hover:bg-slate-900 hover:text-amber-500"
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content Work Panels */}
      <div className="md:col-span-2 space-y-6">
        {activeTab === "profile" && (
          <form action={async (formData) => {
            startTransition(async () => {
              try {
                const res = await updateStoreSettings(formData);
                if (res.success) {
                  toast.success("Store Profile Updated successfully");
                } else {
                  toast.error(res.error || "Failed to commit profile updates.");
                }
              } catch (error) {
                toast.error("An operational error occurred while saving profile changes.");
              }
            });
          }}>
            <input type="hidden" name="userId" value={user.id} />
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6 relative overflow-hidden">
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-[80px]" />
              
              <h2 className="text-amber-500 font-black uppercase tracking-widest text-[10px] mb-4 relative z-10">Branding</h2>
              <div className="space-y-2 relative z-10">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Store Name</label>
                <input 
                  name="storeName" 
                  type="text"
                  required
                  defaultValue={user.name || ""} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-amber-500 outline-none font-bold transition-all placeholder:text-slate-800" 
                />
              </div>
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full flex items-center justify-center gap-3 bg-amber-500 text-slate-950 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 relative z-10 shadow-lg shadow-amber-500/10"
              >
                {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </form>
        )}

        {activeTab === "ops" && (
          <div className="space-y-6 animate-in fade-in">
            <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-rose-500/5 rounded-full blur-[80px]" />
              
              <h2 className="text-rose-500 font-black uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2 relative z-10">
                <Power size={16} /> Danger Zone
              </h2>
              
              <div className={cn(
                "p-6 rounded-3xl border flex justify-between items-center transition-all relative z-10",
                isClosed ? "bg-rose-500/10 border-rose-500/30" : "bg-slate-950 border-slate-800"
              )}>
                <div>
                  <p className="text-white font-black italic uppercase text-lg tracking-tighter">
                    {isClosed ? "Maintenance Mode Active" : "Kitchen is Live"}
                  </p>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">
                    {isClosed ? "POS and ordering terminals are locked." : "Accepting production orders normally."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    startTransition(async () => {
                      try {
                        const res = await toggleMaintenanceMode(user.id, !isClosed);
                        if (res.success) {
                          toast.info(isClosed ? "Operational Store Re-opened" : "Store Locked for Maintenance Updates");
                        } else {
                          toast.error(res.error || "Failed to switch operational flags.");
                        }
                      } catch (error) {
                        toast.error("System error communicating operational toggle.");
                      }
                    });
                  }}
                  disabled={isPending}
                  className={cn(
                    "w-16 h-8 rounded-full flex items-center px-1 transition-all active:scale-95 disabled:opacity-50 cursor-pointer",
                    isClosed ? "bg-rose-500" : "bg-emerald-500"
                  )}
                  aria-label="Toggle structural system maintenance lockout mode"
                >
                  <div className={cn(
                    "w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300 flex items-center justify-center",
                    isClosed ? "translate-x-0" : "translate-x-8"
                  )}>
                    {isPending && <Loader2 className="animate-spin text-slate-400" size={12} />}
                  </div>
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}