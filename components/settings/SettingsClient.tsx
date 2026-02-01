"use client";

import { useState } from "react";
import { Store, Percent, Printer, ShieldCheck, BellRing } from "lucide-react";
import { updateStoreSettings } from "@/lib/actions/settings";
import { toast } from "sonner"; // Optional: for notifications

export default function SettingsClient({ userId }: { userId: string }) {
  const [activeTab, setActiveTab] = useState("profile");

  const tabs = [
    { id: "profile", label: "Store Profile", icon: <Store size={18}/> },
    { id: "tax", label: "Tax & GST", icon: <Percent size={18}/> },
    { id: "hardware", label: "Printers", icon: <Printer size={18}/> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Tab Navigation */}
      <div className="space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === tab.id 
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10" 
                : "text-slate-500 hover:bg-slate-900 hover:text-amber-500"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Dynamic Content Area */}
      <div className="md:col-span-2">
        <form action={async (formData) => {
          const res = await updateStoreSettings(formData);
          if (res.success) toast.success("Settings Saved!");
        }}>
          <input type="hidden" name="userId" value={userId} />

          {activeTab === "profile" && (
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
              <h2 className="text-amber-500 font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                <Store size={18} /> Store Information
              </h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Kitchen Name</label>
                  <input name="storeName" type="text" defaultValue="Kitchen Cloud" className="settings-input" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">GSTIN</label>
                    <input name="gstin" type="text" defaultValue="09ABCDE..." className="settings-input font-mono text-amber-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                    <input name="phone" type="text" defaultValue="+91..." className="settings-input" />
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeTab === "tax" && (
            <section className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl animate-in fade-in">
              <h2 className="text-amber-500 font-black uppercase tracking-widest text-sm mb-6 flex items-center gap-2">
                <Percent size={18} /> Taxation Rules
              </h2>
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                <span className="text-white font-bold">Standard 5% GST</span>
                <div className="w-12 h-6 bg-amber-500 rounded-full flex items-center px-1"><div className="w-4 h-4 bg-slate-950 rounded-full ml-auto"/></div>
              </div>
            </section>
          )}

          <div className="flex justify-end mt-8">
            <button type="submit" className="amber-button">Save Configuration</button>
          </div>
        </form>
      </div>
    </div>
  );
}