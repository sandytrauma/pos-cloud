// Location: app/HomeClient.tsx
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CookingPot, Utensils, Star, ShieldCheck, MapPin, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: number | string;
  name: string;
  price: string | number;
  description?: string | null;
  image?: string | null;
}

interface WhiteLabelHomeProps {
  hasSession: boolean;
  specials: MenuItem[];
  branding?: {
    appNamePrefix?: string;
    appNameSuffix?: string;
    tagline?: string;
    descriptionText?: string;
    whatsAppContactNumber?: string;
    physicalAddress?: string;
  };
  dashboardBasePath?: string;
  currencySymbol?: string;
}

export default function HomeClient({
  hasSession,
  specials = [],
  branding,
  dashboardBasePath = "/dashboard",
  currencySymbol = "₹"
}: WhiteLabelHomeProps) {
  const [currentYear, setCurrentYear] = useState<string>("2026");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6; 

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  const appPrefix = branding?.appNamePrefix || "ETHEREAL-KITCHEN";
  const appSuffix = branding?.appNameSuffix || "CLOUD";
  const contactNumber = branding?.whatsAppContactNumber || "919876543210";
  const fullAddress = branding?.physicalAddress || "Ethereal KitchenCloud, Matiala Extension Delhi";
  const displayTagline = branding?.tagline || "Freshly Made, Purely Served.";
  const displayDesc = branding?.descriptionText || "We focus 100% of our energy on the premium quality of your ingredients.";

  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  // Sorting Engine: Enforces exact sequence mapping
  const sortedSpecials = [...specials].sort((a, b) => {
    const sequence = ["mojito", "tawa butter roti", "soya chaap gravy", "cold cofee", "chicken breast", "french fries"];
    const nameA = a.name.toLowerCase().replace(/\s+/g, " ");
    const nameB = b.name.toLowerCase().replace(/\s+/g, " ");
    
    const idxA = sequence.findIndex(s => nameA.includes(s) || (s === "cold cofee" && nameA.includes("coffee")));
    const idxB = sequence.findIndex(s => nameB.includes(s) || (s === "cold cofee" && nameB.includes("coffee")));
    
    return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
  });

  const totalPages = Math.ceil(sortedSpecials.length / itemsPerPage) || 1;
  const currentItemsSlice = sortedSpecials.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    document.getElementById("specials")?.scrollIntoView({ behavior: "smooth" });
  };

  /**
   * 🌟 FIXED SPECIFIC IMAGE ROUTING ENGINE
   * Maps Mojito strictly to the targeted clear-glass mocktail layout.
   */
  const getUnsplashFallbackUrl = (itemName: string) => {
    const nameLower = (itemName || "").toLowerCase().trim().replace(/\s+/g, " ");

    // 🍹 1. Mojito - Direct premium clear glass mocktail asset layout match
    if (nameLower.includes("mojito") || nameLower.includes("drink") || nameLower.includes("mocktail")) {
      return "https://images.unsplash.com/photos/clear-drinking-glass-with-pink-liquid-and-lemon-1Di03LTniYE";
    }
    
    // 🫓 2. Tawa Butter Roti
    if (nameLower.includes("roti") || nameLower.includes("flatbread") || nameLower.includes("chapati") || nameLower.includes("tawa")) {
      return "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80";
    }
    
    // 🍲 3. Soya Chaap Gravy
    if (nameLower.includes("chaap") || nameLower.includes("gravy") || nameLower.includes("curry") || nameLower.includes("soya")) {
      return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=600&q=80";
    }
    
    // 🧋 4. Cold Coffee
    if (nameLower.includes("cofee") || nameLower.includes("coffee") || nameLower.includes("cold")) {
      return "https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=600&q=80";
    }
    
    // 🍗 5. Chicken Breast
    if (nameLower.includes("chicken") || nameLower.includes("breast") || nameLower.includes("meat")) {
      return "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=600&q=80";
    }
    
    // 🍟 6. French Fries
    if (nameLower.includes("fries") || nameLower.includes("french") || nameLower.includes("potato")) {
      return "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=600&q=80";
    }

    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80";
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-50 selection:bg-amber-500 selection:text-slate-950 scroll-smooth w-full overflow-x-hidden">
      
      {/* Navigation Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
          <div className="bg-amber-500 p-1.5 rounded-lg text-slate-950 shadow-md shadow-amber-500/10">
            <CookingPot size={20} className="stroke-[2.5]" />
          </div>
          <span className="uppercase text-md font-black tracking-tighter italic">
            {appPrefix}<span className="text-amber-500">{appSuffix}</span>
          </span>
        </div>
        <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">
          <a href="#concept" className="hover:text-amber-500 transition-colors">Concept</a>
          <a href="#specials" className="hover:text-amber-500 transition-colors">Specials</a>
          <a href="#contact" className="hover:text-amber-500 transition-colors">Contact</a>
        </div>
        <Link 
          href={basePath} 
          className="text-[10px] font-black uppercase tracking-widest border border-slate-800 bg-slate-900/40 px-5 py-2.5 rounded-xl hover:bg-slate-900 hover:border-slate-700 transition-all active:scale-95"
        >
          {hasSession ? "Dashboard" : "Staff Login"}
        </Link>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex flex-col items-center justify-center px-4 text-center overflow-hidden group">
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 scale-100 group-hover:scale-105 z-0"
            style={{ 
              backgroundImage: `url('https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1920&q=80')` 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/50 z-10" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08),transparent_60%)] z-10 mix-blend-screen" />

          <div className="max-w-4xl space-y-6 relative z-20 animate-in fade-in slide-in-from-bottom-6 duration-1000 mt-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black tracking-widest uppercase backdrop-blur-sm">
              Gourmet Cloud Kitchen Platform
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight text-white uppercase italic leading-[0.95] tracking-tighter drop-shadow-md">
              {displayTagline}
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-xl mx-auto leading-relaxed font-medium drop-shadow">
              Welcome to <span className="text-white font-bold">{appPrefix}{appSuffix}</span>. {displayDesc}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <a
                href="#specials"
                className="group/btn flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-2xl bg-amber-500 px-8 text-slate-950 font-black uppercase italic text-sm tracking-widest transition-all hover:bg-amber-400 hover:scale-[1.02] active:scale-95 shadow-xl shadow-amber-500/20"
              >
                Explore Menu
                <Utensils size={16} strokeWidth={2.5} className="transition-transform duration-300 group-hover/btn:rotate-12" />
              </a>
            </div>
          </div>
        </section>

        {/* Concept Section */}
        <section id="concept" className="py-20 px-6 bg-slate-900/20 border-y border-slate-900/60 relative z-10">
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            <div className="text-center space-y-3.5 group">
              <div className="mx-auto w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 text-amber-500 group-hover:border-amber-500/20 transition-colors">
                <Star size={24} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Top Ingredients</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto font-medium">Sourced daily from local organic hubs to guarantee fresh flavors in every token pass.</p>
            </div>
            <div className="text-center space-y-3.5 group">
              <div className="mx-auto w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 text-emerald-500 group-hover:border-emerald-500/20 transition-colors">
                <Clock size={24} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Made to Order</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto font-medium">Your order elements hit the flame the precise moment you check out.</p>
            </div>
            <div className="text-center space-y-3.5 group sm:col-span-2 lg:col-span-1">
              <div className="mx-auto w-14 h-14 bg-slate-950 rounded-2xl flex items-center justify-center border border-slate-800 text-blue-500 group-hover:border-blue-500/20 transition-colors">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Hygiene First</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto font-medium">Medical-grade kitchen layouts. Completely transparent processes from preparation to dispatch.</p>
            </div>
          </div>
        </section>

        {/* Specials Display Section */}
        <section id="specials" className="py-24 px-6 max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-14 gap-4">
            <div className="text-left">
              <span className="text-amber-500 font-black uppercase tracking-[0.3em] text-[10px]">Recommended Dishes</span>
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mt-1">Chef&apos;s <span className="text-amber-500">Specials</span></h2>
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-wider border-l border-slate-800 pl-4 py-1 max-w-xs">
              Page {currentPage} of {totalPages} • Total Available Items: {sortedSpecials.length}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentItemsSlice.map((item) => {
              const message = encodeURIComponent(`Hi ${appPrefix}! 🍳 I'd like to order the "${item.name}" priced at ${currencySymbol}${item.price}. Please let me know the next steps!`);
              const whatsappUrl = `https://wa.me/${contactNumber}?text=${message}`;
              const imageUrl = item.image || getUnsplashFallbackUrl(item.name);

              return (
                <div 
                  key={item.id} 
                  className="bg-slate-900 border border-slate-800 rounded-[2.5rem] hover:border-slate-700 transition-all group flex flex-col justify-between shadow-xl relative min-w-0 overflow-hidden"
                >
                  <div 
                    className="h-48 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105 border-b border-slate-800"
                    style={{ backgroundImage: `url('${imageUrl}')` }}
                  />

                  <div className="p-6 md:p-8 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <h4 className="text-lg font-black uppercase italic leading-none group-hover:text-amber-500 transition-colors truncate">
                          {item.name}
                        </h4>
                        <span className="text-lg font-black text-amber-500 italic shrink-0 leading-none">{currencySymbol}{item.price}</span>
                      </div>
                      <p className="text-slate-500 text-xs mb-6 line-clamp-2 leading-relaxed font-medium">
                        {item.description || "A signature dish crafted with our secret spices and fresh local produce."}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="h-[1px] w-full bg-slate-800/40" />
                      <a 
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all active:scale-[0.98] shadow-inner"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Order via WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {sortedSpecials.length === 0 && (
              <div className="col-span-full py-16 text-center border border-dashed border-slate-800 rounded-[2.5rem] text-slate-600 font-black uppercase tracking-widest italic text-xs bg-slate-900/10">
                Menu updating. Contact hub desk directly for live options.
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-12 border-t border-slate-900 pt-8">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors active:scale-95"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => handlePageChange(page)}
                  className={cn(
                    "h-10 w-10 text-[10px] font-black rounded-xl border transition-all active:scale-95",
                    currentPage === page
                      ? "bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-500/10"
                      : "bg-slate-900/40 text-slate-400 border-slate-800 hover:text-white"
                  )}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
                className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors active:scale-95"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Brand Footer */}
      <footer id="contact" className="bg-slate-950 border-t border-slate-900/60 pt-16 pb-8 px-6 md:px-8 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
              <CookingPot className="text-amber-500" size={24} />
              <span className="uppercase text-md font-black tracking-tighter italic">{appPrefix}<span className="text-amber-500">{appSuffix}</span></span>
            </div>
            <p className="text-slate-500 text-xs max-w-sm font-medium leading-relaxed">Gourmet taste, cloud kitchen efficiency.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h5 className="text-white font-black uppercase text-[10px] tracking-widest">Location</h5>
              <div className="flex items-start gap-2 text-slate-400 text-xs leading-relaxed font-medium">
                <MapPin size={12} className="text-amber-500 shrink-0 mt-0.5" />
                <span>{fullAddress}</span>
              </div>
            </div>
            <div className="space-y-3">
              <h5 className="text-white font-black uppercase text-[10px] tracking-widest">Connect</h5>
              <div className="text-slate-400 text-[10px] space-y-1.5 font-black uppercase tracking-wider">
                <p className="hover:text-amber-500 cursor-pointer transition-colors">Instagram</p>
                <p className="hover:text-amber-500 cursor-pointer transition-colors">WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 pt-6 border-t border-slate-900/40 text-center text-slate-600 text-[8px] uppercase tracking-widest font-black">
          © {currentYear} {appPrefix}-{appSuffix} Platform distribution. All Rights Reserved.
        </div>
      </footer>
    </div>
  );
}