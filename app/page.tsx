import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CookingPot, ArrowRight, Zap, ShieldCheck, BarChart3 } from "lucide-react";

export default async function Home() {
  const session = await auth();

  // If already logged in, send them straight to the live orders
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50 selection:bg-amber-500 selection:text-slate-950">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-slate-900">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="bg-amber-500 p-1.5 rounded-lg text-slate-950">
            <CookingPot size={24} />
          </div>
          <span>KITCHEN<span className="text-amber-500">CLOUD</span></span>
        </div>
        <Link 
          href="/login" 
          className="text-sm font-medium hover:text-amber-500 transition-colors"
        >
          Staff Login
        </Link>
      </nav>

      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        {/* Hero Section */}
        <div className="max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase">
            Built for 2026 Kitchens
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white">
            Smart Order Management <br /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
              For Modern Takeaways.
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
            Synchronize Zomato, Swiggy, and POS orders into one sleek kitchen display. 
            Automated GST reporting and INR invoicing built-in.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Link
              href="/login"
              className="group flex h-14 w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-amber-500 px-8 text-slate-950 font-bold transition-all hover:bg-amber-400 hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/20"
            >
              Access Dashboard
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="text-slate-500 text-sm font-medium">
              Requires Admin Authorization
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 max-w-5xl w-full">
          <FeatureCard 
            icon={<Zap className="text-amber-500" />} 
            title="Live Tokenization" 
            desc="Instant queue management for live customers and online orders."
          />
          <FeatureCard 
            icon={<ShieldCheck className="text-emerald-500" />} 
            title="GST Compliance" 
            desc="Precise 5% and 18% GST deductions calculated in INR automatically."
          />
          <FeatureCard 
            icon={<BarChart3 className="text-blue-500" />} 
            title="Aggregator Sync" 
            desc="Native support for Swiggy and Zomato order webhooks."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-slate-600 text-xs border-t border-slate-900">
        © 2026 KitchenCloud Technologies Private Limited. All Rights Reserved.
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-left hover:border-slate-700 transition-colors">
      <div className="mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}