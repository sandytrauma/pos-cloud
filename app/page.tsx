import { auth } from "@/lib/auth";
import { db } from "@/db"; // Import your DB
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  CookingPot, ArrowRight, Zap, ShieldCheck, 
  BarChart3, Utensils, Star, MapPin, Clock 
} from "lucide-react";

export default async function Home() {
  const session = await auth();

  // We remove the auto-redirect so you can actually view the landing page.
  // Staff can still click "Staff Login" to enter the dashboard.

  // Fetch live specials from your menuItems table
  const specials = await db.query.menuItems.findMany({
    limit: 3,
  });

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50 selection:bg-amber-500 selection:text-slate-950 scroll-smooth">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-6 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="bg-amber-500 p-1.5 rounded-lg text-slate-950">
            <CookingPot size={24} />
          </div>
          <span>KITCHEN<span className="text-amber-500">CLOUD</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-xs font-black uppercase tracking-[0.2em] text-slate-500">
            <a href="#concept" className="hover:text-amber-500 transition-colors">Concept</a>
            <a href="#specials" className="hover:text-amber-500 transition-colors">Specials</a>
            <a href="#contact" className="hover:text-amber-500 transition-colors">Contact</a>
        </div>
        <Link 
          href="/dashboard" 
          className="text-xs font-black uppercase tracking-widest border border-slate-800 px-4 py-2 rounded-xl hover:bg-slate-900 transition-all"
        >
          {session ? "Dashboard" : "Staff Login"}
        </Link>
      </nav>

      <main className="flex-1 pt-32">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center px-6 text-center py-20">
            <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase">
                Gourmet Cloud Kitchen
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tight text-white uppercase italic leading-[0.85]">
                Freshly Made <br /> 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">
                Purely Served.
                </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed font-medium">
                Welcome to <span className="text-white">KitchenCloud</span>. We skip the fancy dining room 
                to focus 100% of our energy on the quality of your ingredients.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
                <a
                href="#specials"
                className="group flex h-16 w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-amber-500 px-10 text-slate-950 font-black uppercase italic text-xl transition-all hover:bg-amber-400 hover:scale-105 active:scale-95 shadow-xl shadow-amber-500/20"
                >
                Explore Menu
                <Utensils size={20} />
                </a>
            </div>
            </div>
        </section>

        {/* Concept Section */}
        <section id="concept" className="py-32 px-6 bg-slate-900/30 border-y border-slate-900">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-slate-950 rounded-3xl flex items-center justify-center border border-slate-800 text-amber-500">
                        <Star size={32} />
                    </div>
                    <h3 className="text-xl font-black uppercase italic">Top Ingredients</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">Sourced daily from local organic farms to ensure peak flavor in every bite.</p>
                </div>
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-slate-950 rounded-3xl flex items-center justify-center border border-slate-800 text-emerald-500">
                        <Clock size={32} />
                    </div>
                    <h3 className="text-xl font-black uppercase italic">Made to Order</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">No heat lamps here. Your order only hits the pan the moment you punch it in.</p>
                </div>
                <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-slate-950 rounded-3xl flex items-center justify-center border border-slate-800 text-blue-500">
                        <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-xl font-black uppercase italic">Hygiene First</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">Medical-grade kitchen standards. Transparent processes from start to finish.</p>
                </div>
            </div>
        </section>

        {/* Live Specials Section */}
        <section id="specials" className="py-32 px-6 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-4">
                <div className="text-left">
                    <span className="text-amber-500 font-black uppercase tracking-[0.3em] text-xs">Recommended Dishes</span>
                    <h2 className="text-5xl font-black uppercase italic tracking-tighter mt-2">Chef&apos;s <span className="text-amber-500">Specials</span></h2>
                </div>
                <p className="text-slate-500 text-sm font-medium border-l border-slate-800 pl-4">Real-time availability from our live kitchen.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
  {specials.map((item) => {
    // Generate the WhatsApp link
    const phoneNumber = "919876543210"; // REPLACE WITH YOUR REAL NUMBER
    const message = encodeURIComponent(`Hi KitchenCloud! 🍳 I'd like to order the "${item.name}" priced at ₹${item.price}. Please let me know the next steps!`);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

    return (
      <div 
        key={item.id} 
        className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] hover:border-amber-500 transition-all group flex flex-col justify-between"
      >
        <div>
          <div className="flex justify-between items-start mb-8">
            <h4 className="text-2xl font-black uppercase italic leading-tight group-hover:text-amber-500 transition-colors">
              {item.name}
            </h4>
            <span className="text-xl font-black text-amber-500 italic">₹{item.price}</span>
          </div>
          <p className="text-slate-500 text-sm mb-8 line-clamp-3">
            {item.description || "A signature dish crafted with our secret spices and fresh local produce."}
          </p>
        </div>

        <div className="space-y-6">
          <div className="h-[1px] w-full bg-slate-800" />
          <a 
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-4 bg-slate-950 border border-slate-800 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all active:scale-95"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Order via WhatsApp
          </a>
        </div>
      </div>
    );
  })}
</div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-slate-950 border-t border-slate-900 pt-20 pb-10 px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20">
            <div className="space-y-6">
                <div className="flex items-center gap-2 font-bold text-3xl tracking-tighter">
                    <CookingPot className="text-amber-500" size={32} />
                    <span>KITCHEN<span className="text-amber-500">CLOUD</span></span>
                </div>
                <p className="text-slate-500 max-w-sm">The digital heart of modern food delivery. Gourmet taste, cloud kitchen efficiency.</p>
            </div>
            <div className="grid grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h5 className="text-white font-black uppercase text-xs tracking-widest">Location</h5>
                    <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <MapPin size={16} className="text-amber-500" />
                        <span>Food Hub, Sector 5<br/>Nangloi, Delhi</span>
                    </div>
                </div>
                <div className="space-y-4">
                    <h5 className="text-white font-black uppercase text-xs tracking-widest">Connect</h5>
                    <div className="text-slate-400 text-sm space-y-1">
                        <p>Instagram</p>
                        <p>WhatsApp</p>
                    </div>
                </div>
            </div>
        </div>
        <div className="mt-20 pt-8 border-t border-slate-900 text-center text-slate-600 text-[10px] uppercase tracking-widest">
            © 2026 KitchenCloud Technologies Private Limited.
        </div>
      </footer>
    </div>
  );
}