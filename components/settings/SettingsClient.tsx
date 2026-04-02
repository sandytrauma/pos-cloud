"use client";

import { useState, useTransition } from "react";
import { Store, Percent, ShieldAlert, Save, Loader2, Power } from "lucide-react";
import { updateStoreSettings, toggleMaintenanceMode } from "@/lib/actions/settings";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function SettingsClient({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState("profile");
  const [isPending, startTransition] = useTransition();
  
  // Logic: If role is 'maintenance', store is closed
  const isClosed = user.role === "maintenance";

  const tabs = [
    { id: "profile", label: "Store Profile", icon: <Store size={18}/> },
    { id: "ops", label: "Operations", icon: <ShieldAlert size={18}/> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Sidebar */}
      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all",
              activeTab === tab.id 
                ? "bg-amber-500 text-slate-950 shadow-xl shadow-amber-500/20" 
                : "text-slate-500 hover:bg-slate-900 hover:text-amber-500"
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="md:col-span-2 space-y-6">
        {activeTab === "profile" && (
          <form action={async (formData) => {
            startTransition(async () => {
              const res = await updateStoreSettings(formData);
              if (res.success) toast.success("Store Profile Updated");
            });
          }}>
            <input type="hidden" name="userId" value={user.id} />
            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl space-y-6">
              <h2 className="text-amber-500 font-black uppercase tracking-widest text-[10px] mb-4">Branding</h2>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Store Name</label>
                <input 
                  name="storeName" 
                  defaultValue={user.name || ""} 
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:ring-2 focus:ring-amber-500/50 outline-none font-bold" 
                />
              </div>
              <button 
                type="submit" 
                disabled={isPending}
                className="w-full flex items-center justify-center gap-3 bg-amber-500 text-slate-950 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 transition-all"
              >
                {isPending ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Save Changes
              </button>
            </div>
          </form>
        )}

        {activeTab === "ops" && (
          <div className="space-y-6 animate-in fade-in">
            <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
              <h2 className="text-rose-500 font-black uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2">
                <Power size={16} /> Danger Zone
              </h2>
              
              <div className={cn(
                "p-6 rounded-3xl border flex justify-between items-center transition-all",
                isClosed ? "bg-rose-500/10 border-rose-500/30" : "bg-slate-950 border-slate-800"
              )}>
                <div>
                  <p className="text-white font-black italic uppercase text-lg tracking-tighter">
                    {isClosed ? "Maintenance Mode Active" : "Kitchen is Live"}
                  </p>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                    {isClosed ? "POS and ordering are locked." : "Accepting orders normally."}
                  </p>
                </div>

                <button
                  onClick={() => {
                    startTransition(async () => {
                      const res = await toggleMaintenanceMode(user.id, !isClosed);
                      if (res.success) toast.info(isClosed ? "Store Opened" : "Store Closed for Maintenance");
                    });
                  }}
                  disabled={isPending}
                  className={cn(
                    "w-16 h-8 rounded-full flex items-center px-1 transition-all",
                    isClosed ? "bg-rose-500" : "bg-emerald-500"
                  )}
                >
                  <div className={cn(
                    "w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-300",
                    isClosed ? "translate-x-0" : "translate-x-8"
                  )} />
                </button>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}