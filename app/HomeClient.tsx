// Location: app/HomeClient.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Utensils, MapPin, Clock, ArrowRight, Building2, 
  Cloud, HeartHandshake, PhoneCall, Award, Flame, 
  ShoppingBag, CheckCircle2, ChevronDown, Sparkles,
  Compass, Eye, Play, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import CulinaryCanvas from "@/components/three/CulinaryCanvas";

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
    subTagline?: string;
    parentCompany?: string;
    descriptionText?: string;
    whatsAppContactNumber?: string;
    physicalAddress?: string;
  };
  dashboardBasePath?: string;
  currencySymbol?: string;
}

/**
 * 🌟 3D ROTATING TIMELINE DISH ROW
 * As the user scrolls, each dish actively rotates around the central golden timeline spine:
 * - Entering from below: Rotates into 3D perspective around the spine
 * - At viewport center: Swings completely forward into full glassy white spotlight illumination
 * - Scrolling past: Gracefully revolves away into the background
 */
function RotatingTimelineDish({ 
  dish, 
  meta, 
  imageUrl, 
  currencySymbol, 
  orderWhatsappUrl, 
  index, 
  isEven 
}: {
  dish: MenuItem;
  meta: any;
  imageUrl: string;
  currencySymbol: string;
  orderWhatsappUrl: string;
  index: number;
  isEven: boolean;
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [scrollDelta, setScrollDelta] = useState(0);
  const [mouseTilt, setMouseTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let ticking = false;

    const calculateScrollDelta = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (rowRef.current) {
            const rect = rowRef.current.getBoundingClientRect();
            const viewportCenter = window.innerHeight * 0.5;
            const itemCenter = rect.top + rect.height * 0.5;
            const rawDelta = (itemCenter - viewportCenter) / (window.innerHeight * 0.65);
            setScrollDelta(Math.max(-1.2, Math.min(1.2, rawDelta)));
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", calculateScrollDelta, { passive: true });
    window.addEventListener("resize", calculateScrollDelta, { passive: true });
    calculateScrollDelta();

    return () => {
      window.removeEventListener("scroll", calculateScrollDelta);
      window.removeEventListener("resize", calculateScrollDelta);
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setMouseTilt({
      x: (y / (rect.height / 2)) * -6,
      y: (x / (rect.width / 2)) * 6,
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMouseTilt({ x: 0, y: 0 });
  };

  const absDelta = Math.abs(scrollDelta);
  const isCentered = absDelta < 0.35;
  const focusIntensity = Math.max(0, 1 - absDelta);

  const leftRotateY = scrollDelta * 26 + (isHovered ? mouseTilt.y : 0);
  const rightRotateY = -scrollDelta * 26 + (isHovered ? mouseTilt.y : 0);
  const rotateX = scrollDelta * -8 + (isHovered ? mouseTilt.x : 0);
  const zDepth = focusIntensity * 60 - 30;
  const scale = 0.94 + focusIntensity * 0.08;
  const opacity = 0.45 + focusIntensity * 0.55;

  return (
    <div 
      ref={rowRef}
      className={cn(
        "flex flex-col md:flex-row items-center gap-8 md:gap-14 relative group perspective-[1400px] transition-opacity duration-300",
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      )}
      style={{ opacity }}
    >
      {/* 3D Photography Card (Rotates around central timeline spine) */}
      <div 
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          transformOrigin: isEven ? "right center" : "left center",
          transform: `perspective(1200px) rotateY(${isEven ? leftRotateY : rightRotateY}deg) rotateX(${rotateX}deg) translateZ(${zDepth}px) scale(${scale})`,
          transition: isHovered ? "transform 0.1s ease-out" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={cn(
          "w-full md:w-1/2 relative rounded-[2.5rem] overflow-hidden border bg-slate-950/75 backdrop-blur-2xl transition-all duration-500 cursor-pointer",
          isCentered 
            ? "border-white/50 shadow-[0_0_45px_rgba(255,255,255,0.22),0_25px_60px_rgba(0,0,0,0.85)]" 
            : "border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.7)] hover:border-white/40"
        )}
      >
        {/* Smooth Glassy White Translucent Spotlight Glow */}
        {isCentered && (
          <div 
            className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full pointer-events-none z-20 blur-2xl transition-opacity duration-500"
            style={{
              background: "radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.15) 45%, rgba(255, 255, 255, 0.02) 75%, transparent 90%)",
            }}
          />
        )}

        {/* Crisp Food Photography */}
        <div 
          className="h-72 sm:h-92 w-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url('${imageUrl}')` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070b16] via-[#070b16]/30 to-transparent pointer-events-none" />

        {/* Course Stage Tag */}
        <div className="absolute top-5 left-5 bg-slate-950/90 backdrop-blur-xl border border-white/20 text-amber-400 text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xl z-20">
          {meta.stage}
        </div>

        {/* Highlight Tag */}
        <div className="absolute top-5 right-5 bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full backdrop-blur-xl z-20">
          ★ {meta.highlightTag}
        </div>

        {/* Price Callout */}
        <div className="absolute bottom-5 right-5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-2xl italic tracking-tight px-5 py-2 rounded-2xl shadow-2xl z-20">
          {currencySymbol}{dish.price}
        </div>

        {/* Dietary Tag */}
        <div className="absolute bottom-5 left-5 text-[10px] font-bold uppercase tracking-wider text-slate-200 bg-slate-950/90 px-4 py-1.5 rounded-xl backdrop-blur-xl border border-white/10 z-20">
          {meta.diet}
        </div>
      </div>

      {/* Center Node on Timeline Spine */}
      <div 
        style={{
          transform: `scale(${1 + focusIntensity * 0.35})`,
          transition: "transform 0.3s ease-out",
        }}
        className={cn(
          "hidden md:flex w-14 h-14 rounded-full items-center justify-center font-black text-sm italic shrink-0 z-30 transition-all duration-300",
          isCentered
            ? "bg-white text-slate-950 border-2 border-white shadow-[0_0_35px_rgba(255,255,255,0.85)]"
            : "bg-[#070b16] border-2 border-white/40 text-slate-200 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
        )}
      >
        0{index + 1}
      </div>

      {/* Editorial Content Card */}
      <div 
        style={{
          transformOrigin: isEven ? "left center" : "right center",
          transform: `perspective(1200px) rotateY(${isEven ? rightRotateY : leftRotateY}deg) rotateX(${rotateX}deg) translateZ(${zDepth}px) scale(${scale})`,
          transition: isHovered ? "transform 0.1s ease-out" : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        className={cn(
          "w-full md:w-1/2 space-y-5 text-left relative p-7 sm:p-9 rounded-[2.5rem] bg-slate-950/75 backdrop-blur-2xl border transition-all duration-500",
          isEven ? "md:ml-2" : "md:mr-2",
          isCentered 
            ? "border-white/45 shadow-[0_0_40px_rgba(255,255,255,0.18),0_20px_50px_rgba(0,0,0,0.85)]" 
            : "border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.6)] hover:border-white/35"
        )}
      >
        <div className="space-y-2.5 relative z-10">
          <div className="inline-flex items-center gap-2 text-amber-400 text-[10.5px] font-bold uppercase tracking-[0.25em]">
            <Clock size={13} className="text-amber-400" />
            <span>Est. Prep: {meta.prep}</span>
            <span className="text-white/30">•</span>
            <span className="italic text-amber-300/90 font-medium lowercase">({meta.ticker})</span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black uppercase italic tracking-tight text-white leading-tight">
            {dish.name}
          </h3>

          <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
            {dish.description || "Crafted to perfection with hand-selected ingredients, artisanal marinades, and proprietary whole spice blends."}
          </p>
        </div>

        {/* Tasting Profile Note */}
        <div className="p-4 rounded-2xl bg-black/40 border border-white/[0.08] space-y-1 relative z-10">
          <span className="text-[9.5px] font-bold uppercase tracking-widest text-slate-400 block">
            Tasting Profile & Alchemy
          </span>
          <p className="text-xs text-amber-300 font-medium italic leading-relaxed">
            &ldquo;{meta.notes}&rdquo;
          </p>
        </div>

        {/* 1-Tap WhatsApp Order CTA */}
        <div className="pt-2 relative z-10">
          <a
            href={orderWhatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase italic text-xs tracking-wider transition-all shadow-xl shadow-amber-500/25 group/btn active:scale-95"
          >
            <ShoppingBag size={16} />
            <span>Order {dish.name} • {currencySymbol}{dish.price}</span>
            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function HomeClient({
  hasSession,
  specials = [],
  branding,
  dashboardBasePath = "/dashboard",
  currencySymbol = "₹"
}: WhiteLabelHomeProps) {
  const [currentYear, setCurrentYear] = useState<string>("2026");
  const [activeTickerIdx, setActiveTickerIdx] = useState(0);

  const tickerPhrases = [
    "Fire-Charred Clay Hearth Cooking",
    "24-Hour Slow-Simmered Cashew Velvets",
    "Artisanal Whole Spices, Zero Commercial Pastes",
    "Sub-30m Direct Temperature-Regulated Dispatch"
  ];

  useEffect(() => {
    setCurrentYear(new Date().getFullYear().toString());
    const interval = setInterval(() => {
      setActiveTickerIdx((prev) => (prev + 1) % tickerPhrases.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [tickerPhrases.length]);

  const appPrefix = branding?.appNamePrefix || "URBAN";
  const appSuffix = branding?.appNameSuffix || "AMBROSIA";
  const subTagline = branding?.subTagline || "Part of Ethereal Kitchen Cloud";
  const parentCompany = branding?.parentCompany || "A Brand of Ethereal Inn Hospitality LLP";
  const contactNumber = branding?.whatsAppContactNumber || "919876543210";
  const fullAddress = branding?.physicalAddress || "Urban Ambrosia Culinary Hub, Ethereal Kitchen Cloud, New Delhi";
  const displayTagline = branding?.tagline || "Gourmet Flavors. Elevated Living.";
  const displayDesc = branding?.descriptionText || "An avant-garde cloud gastronomy experience crafted with farm-to-table provenance, thermal precision, and hospitality lineage.";

  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  const getUnsplashFallbackUrl = (itemName: string) => {
    const nameLower = (itemName || "").toLowerCase().trim();

    if (nameLower.includes("mojito") || nameLower.includes("mocktail") || nameLower.includes("drink")) {
      return "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?auto=format&fit=crop&w=1200&q=85";
    }
    if (nameLower.includes("roti") || nameLower.includes("bread") || nameLower.includes("naan")) {
      return "https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=1200&q=85";
    }
    if (nameLower.includes("chaap") || nameLower.includes("gravy") || nameLower.includes("curry") || nameLower.includes("paneer")) {
      return "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1200&q=85";
    }
    if (nameLower.includes("coffee") || nameLower.includes("cold") || nameLower.includes("latte")) {
      return "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=1200&q=85";
    }
    if (nameLower.includes("chicken") || nameLower.includes("tikka") || nameLower.includes("meat")) {
      return "https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?auto=format&fit=crop&w=1200&q=85";
    }
    if (nameLower.includes("fries") || nameLower.includes("snack") || nameLower.includes("potato")) {
      return "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=1200&q=85";
    }
    if (nameLower.includes("biryani") || nameLower.includes("rice")) {
      return "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1200&q=85";
    }
    if (nameLower.includes("burger") || nameLower.includes("sandwich")) {
      return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=85";
    }

    return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85";
  };

  const getDishMeta = (itemName: string, index: number) => {
    const nameLower = itemName.toLowerCase();
    if (nameLower.includes("mojito")) {
      return { 
        stage: "Course 01 • The Aperitif", 
        prep: "5 mins", 
        ticker: "Botanical lime & crushed spearmint mist",
        notes: "Muddled fresh garden mint, cold-pressed Persian lime reduction, chilled sparkling botanical soda", 
        diet: "Zero Alcohol • Vegan",
        highlightTag: "Palate Awakening"
      };
    }
    if (nameLower.includes("chaap") || nameLower.includes("soya")) {
      return { 
        stage: "Course 02 • Hearth Gravy", 
        prep: "18 mins", 
        ticker: "Charred shallots & roasted cashew cream",
        notes: "Protein medallions slow-braised in roasted cashew velvet, caramel shallots, and fragrant saffron cardamom", 
        diet: "Chef's Signature • High Protein",
        highlightTag: "Chef Recommendation"
      };
    }
    if (nameLower.includes("chicken")) {
      return { 
        stage: "Course 03 • Charcoal Roast", 
        prep: "22 mins", 
        ticker: "Live hickory coals & 18-spice crust",
        notes: "Sous-vide tender cuts finished over hickory embers with 18-spice stone-ground Kashmiri marinade", 
        diet: "Keto Friendly • Lean Cut",
        highlightTag: "Coal Embers"
      };
    }
    if (nameLower.includes("roti")) {
      return { 
        stage: "Course 04 • The Clay Oven", 
        prep: "6 mins", 
        ticker: "Ancient whole wheat & cultured butter glaze",
        notes: "Stone-ground ancient whole wheat blistered over tandoor fire and glazed with cultured butter", 
        diet: "Vegetarian • Heritage Grain",
        highlightTag: "Blistered Fresh"
      };
    }
    if (nameLower.includes("coffee")) {
      return { 
        stage: "Course 05 • The Digestif", 
        prep: "7 mins", 
        ticker: "18-hr Chikmagalur single-origin extraction",
        notes: "18-hour cold brew extraction aerated with sweet organic cream and micro-foam", 
        diet: "Artisanal Brew",
        highlightTag: "Slow Extraction"
      };
    }
    return { 
      stage: `Course 0${index + 1} • Signature Selection`, 
      prep: "15 mins", 
      ticker: "Cold-pressed mustard oil & micro-batched spices",
      notes: "Handcrafted with cold-pressed oils, micro-batched whole spices, and verifiable farm provenance", 
      diet: "Daily Artisanal",
      highlightTag: "Seasonal Special"
    };
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#070b16] text-slate-100 selection:bg-amber-500 selection:text-slate-950 scroll-smooth w-full overflow-x-hidden font-sans">
      
      {/* 1. Visible Sharp Artisanal Dining Backdrop (50% Opacity) */}
      <div 
        className="fixed inset-0 bg-cover bg-center pointer-events-none z-0 opacity-50 scale-100"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1543353071-873f17a7a088?auto=format&fit=crop&w=2000&q=85')`,
        }}
      />

      {/* Atmospheric Contrast Layer */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#070b16]/75 via-[#070b16]/82 to-[#070b16]/92 pointer-events-none z-0" />

      {/* 2. Atmospheric Volumetric Spotlight Canvas */}
      <CulinaryCanvas itemCount={specials.length} />

      {/* 3. Top Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-14 py-4.5 border-b border-white/[0.1] bg-[#070b16]/80 backdrop-blur-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-amber-200 p-[1.5px] shadow-lg shadow-amber-500/25">
            <div className="w-full h-full bg-[#070b16] rounded-[14px] flex items-center justify-center text-amber-400 font-serif font-black text-lg">
              UA
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-[-0.04em] uppercase italic text-white leading-none">
              {appPrefix} <span className="text-amber-400">{appSuffix}</span>
            </span>
           
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-10 text-[10.5px] font-bold uppercase tracking-[0.28em] text-slate-300">
          <a href="#philosophy" className="hover:text-amber-400 transition-colors">Philosophy</a>
          <a href="#timeline" className="hover:text-amber-400 transition-colors flex items-center gap-1.5 text-amber-300">
            <Flame size={13} className="text-amber-400 animate-pulse" />
            <span>Culinary Timeline</span>
          </a>
          <a href="#lineage" className="hover:text-amber-400 transition-colors">Lineage</a>
          <a href="#contact" className="hover:text-amber-400 transition-colors">Concierge</a>
        </div>

        <Link 
          href={basePath} 
          className="text-[10px] font-bold uppercase tracking-[0.18em] border border-white/20 bg-white/[0.06] hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 px-5 py-2.5 rounded-2xl transition-all shadow-md flex items-center gap-2 backdrop-blur-md"
        >
          <span>{hasSession ? "Open Terminal" : "Staff Portal"}</span>
          <ArrowRight size={13} />
        </Link>
      </nav>

      <main className="flex-1 relative z-10">
        
        {/* Hero Section */}
        <section className="relative min-h-[96vh] flex flex-col items-center justify-center px-6 pt-32 pb-20 text-center overflow-hidden">
          
          <div className="max-w-4xl mx-auto space-y-7 relative z-10">
            
            {/* Heritage Badge */}
            <div className="inline-flex flex-wrap items-center justify-center gap-2.5 px-5 py-2 rounded-full bg-slate-900/85 border border-white/15 text-[10px] font-bold tracking-[0.25em] uppercase text-slate-200 shadow-xl backdrop-blur-2xl">
             
              <span className="text-white/30">•</span>
              <span className="flex items-center gap-1.5 text-slate-300">
                <Building2 size={13} /> {parentCompany}
              </span>
            </div>

        
            <div className="h-6 flex items-center justify-center overflow-hidden">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.38em] text-amber-400 italic transition-all duration-700 transform">
                ✨ {tickerPhrases[activeTickerIdx]}
              </p>
            </div>

            <h1 className="text-6xl sm:text-8xl md:text-9xl font-black tracking-[-0.05em] text-white uppercase italic leading-[0.9] drop-shadow-2xl">
              URBAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500">AMBROSIA</span>
            </h1>

            <p className="text-lg sm:text-2xl font-bold italic text-amber-100/90 tracking-tight max-w-2xl mx-auto drop-shadow leading-snug">
              &ldquo;{displayTagline}&rdquo;
            </p>

            <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed font-normal">
              {displayDesc}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
              <a
                href="#timeline"
                className="w-full sm:w-auto h-15 px-10 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase italic text-xs tracking-[0.2em] transition-all shadow-xl shadow-amber-500/30 flex items-center justify-center gap-3"
              >
                <Compass size={17} />
                <span>Explore Tasting Timeline</span>
              </a>

              <a
                href={`https://wa.me/${contactNumber}?text=${encodeURIComponent("Hello Urban Ambrosia, I would like to place an immediate order from your gourmet menu.")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto h-15 px-8 rounded-2xl bg-white/[0.08] hover:bg-white/[0.15] border border-white/20 text-white font-bold uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2.5 shadow-xl backdrop-blur-xl"
              >
                <PhoneCall size={16} className="text-emerald-400" />
                <span>Order via WhatsApp</span>
              </a>
            </div>

            {/* Quality Benchmarks */}
            <div className="pt-14 grid grid-cols-2 md:grid-cols-4 gap-6 border-t border-white/[0.1] mt-14">
              <div className="space-y-1 text-center">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono leading-none">100%</span>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Cold-Pressed Oils</p>
              </div>
              <div className="space-y-1 text-center">
                <span className="text-2xl sm:text-3xl font-black text-white font-mono leading-none">24-Hr</span>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Slow Reductions</p>
              </div>
              <div className="space-y-1 text-center">
                <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono leading-none">Sub-30m</span>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Thermal Dispatch</p>
              </div>
              <div className="space-y-1 text-center">
                <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono leading-none">Pure</span>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Zero Artificial Essence</p>
              </div>
            </div>

          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-amber-500/60">
            <ChevronDown size={22} />
          </div>
        </section>

        {/* Philosophy Section */}
        <section id="philosophy" className="py-28 px-6 md:px-14 border-y border-white/[0.1] relative">
          
          <div className="max-w-6xl mx-auto space-y-16 relative z-10">
            
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/[0.08] border border-amber-500/35 text-amber-400 text-[10px] font-bold uppercase tracking-[0.28em] backdrop-blur-2xl">
                The Culinary Philosophy
              </span>
              <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-[-0.04em] text-white">
                The Alchemy of Flavor
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed font-normal">
                Urban Ambrosia is an exploration of sensory balance, where ancient charcoal tandoori traditions meet modern thermal precision.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 md:p-10 bg-slate-950/65 backdrop-blur-2xl border border-white/15 rounded-[2.5rem] space-y-5 hover:border-amber-400/50 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                <div className="w-14 h-14 rounded-2xl bg-[#070b16] border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
                  <Flame size={24} />
                </div>
                <h3 className="text-xl font-black uppercase italic text-white tracking-tight">
                  Fire & Smoke
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                  We use aged wood charcoal and clay ovens to achieve deep caramelization, infusing dishes with aromatic complexity without artificial liquid smokes.
                </p>
              </div>

              <div className="p-8 md:p-10 bg-slate-950/65 backdrop-blur-2xl border border-white/15 rounded-[2.5rem] space-y-5 hover:border-amber-400/50 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                <div className="w-14 h-14 rounded-2xl bg-[#070b16] border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
                  <Cloud size={24} />
                </div>
                <h3 className="text-xl font-black uppercase italic text-white tracking-tight">
                  Ethereal Cloud Precision
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                  Powered by Ethereal Kitchen Cloud. Every dish is cooked in micro-batches with real-time temperature monitoring for pristine doorstep arrival.
                </p>
              </div>

              <div className="p-8 md:p-10 bg-slate-950/65 backdrop-blur-2xl border border-white/15 rounded-[2.5rem] space-y-5 hover:border-amber-400/50 transition-all shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
                <div className="w-14 h-14 rounded-2xl bg-[#070b16] border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl">
                  <HeartHandshake size={24} />
                </div>
                <h3 className="text-xl font-black uppercase italic text-white tracking-tight">
                  Hospitality Lineage
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
                  A brand of Ethereal Inn Hospitality LLP. We uphold institutional food safety standards, tamper-evident seals, and hospital-grade kitchen hygiene.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ========================================================
            VERTICAL CULINARY TIMELINE (3D MENU ROTATING AROUND AXIS)
           ======================================================== */}
        <section id="timeline" className="py-32 px-6 md:px-12 max-w-6xl mx-auto space-y-24 relative perspective-[1400px]">
          
          <div className="text-center space-y-4 max-w-2xl mx-auto relative z-10">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-amber-500/35 text-amber-400 text-[10px] font-bold uppercase tracking-[0.28em] backdrop-blur-2xl">
              <Flame size={13} className="text-amber-400" /> The Tasting Sequence
            </span>
            <h2 className="text-4xl sm:text-6xl font-black uppercase italic tracking-[-0.04em] text-white">
              The Culinary Timeline
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed font-normal">
              Scroll down as each course dynamically revolves into view around the central golden spine, sweeping forward into full active spotlight illumination.
            </p>
          </div>

          <div className="relative">
            
            {/* Golden Vertical Timeline Spine */}
            <div className="hidden md:block absolute left-1/2 top-6 bottom-6 w-[2px] -translate-x-1/2 bg-gradient-to-b from-white/40 via-amber-400/70 to-white/20 z-0 shadow-[0_0_20px_rgba(255,255,255,0.3)]" />

            {/* 3D Revolving Menu Rows */}
            <div className="space-y-32 relative z-10">
              {specials.map((dish, index) => {
                const meta = getDishMeta(dish.name, index);
                const imageUrl = dish.image || getUnsplashFallbackUrl(dish.name);
                const isEven = index % 2 === 0;
                const orderWhatsappUrl = `https://wa.me/${contactNumber}?text=${encodeURIComponent(`Hello Urban Ambrosia, I would like to order "${dish.name}" (${currencySymbol}${dish.price}) from your tasting timeline.`)}`;

                return (
                  <RotatingTimelineDish
                    key={dish.id}
                    dish={dish}
                    meta={meta}
                    imageUrl={imageUrl}
                    currencySymbol={currencySymbol}
                    orderWhatsappUrl={orderWhatsappUrl}
                    index={index}
                    isEven={isEven}
                  />
                );
              })}

              {specials.length === 0 && (
                <div className="py-24 text-center border-2 border-dashed border-white/15 rounded-3xl text-slate-400 font-bold uppercase text-xs tracking-widest bg-white/[0.03] backdrop-blur-md">
                  Timeline currently curating seasonal entries. Inquire directly via concierge.
                </div>
              )}
            </div>

          </div>
        </section>

        {/* ========================================================
            HOSPITALITY LINEAGE & INSTITUTIONAL STEWARDSHIP
           ======================================================== */}
        <section id="lineage" className="py-28 px-6 md:px-14 border-t border-white/[0.1] relative">
          
          <div className="max-w-5xl mx-auto bg-slate-950/75 backdrop-blur-2xl border border-white/20 rounded-[3rem] p-8 md:p-14 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10 relative overflow-hidden">
            
            <div className="space-y-4 text-center md:text-left relative z-10">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/[0.08] border border-amber-500/35 text-amber-400 text-[10px] font-bold uppercase tracking-widest">
                <Award size={13} /> Institutional Stewardship
              </div>

              <h3 className="text-3xl md:text-4xl font-black text-white uppercase italic tracking-tight">
                Ethereal Inn Hospitality LLP
              </h3>

              <p className="text-slate-300 text-sm max-w-xl leading-relaxed font-normal">
                Urban Ambrosia operates under the institutional governance of <strong>Ethereal Inn Hospitality LLP</strong>. Powered by the scalable architecture of <strong>Ethereal Kitchen Cloud</strong>, we blend culinary artistry with enterprise cloud logistics.
              </p>

              <div className="flex flex-wrap gap-4 pt-2 justify-center md:justify-start text-[10px] font-bold uppercase tracking-wider text-slate-300">
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-amber-400"/> FSSAI Certified Kitchens</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-amber-400"/> Tamper-Evident Seals</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 size={13} className="text-amber-400"/> Temperature Monitored Delivery</span>
              </div>
            </div>

            <div className="shrink-0 relative z-10">
              <Link
                href={basePath}
                className="px-8 py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase italic text-xs tracking-widest rounded-2xl shadow-xl shadow-amber-500/25 transition-all flex items-center gap-2"
              >
                <span>Access Terminal OS</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>

      </main>

      {/* ========================================================
          STEADY FLOATING CONCIERGE BAR
         ======================================================== */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl">
        <div className="bg-[#070b16]/90 border border-white/20 rounded-2xl p-3 px-5 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 truncate">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="truncate">
              <p className="text-xs font-black uppercase italic text-white tracking-tight truncate">Live Kitchen Active</p>
              <p className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider">Freshly prepared to order</p>
            </div>
          </div>

          <a
            href={`https://wa.me/${contactNumber}?text=${encodeURIComponent("Hello Urban Ambrosia, I am browsing your tasting timeline and would like to order.")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase italic text-[10.5px] tracking-wider rounded-xl shadow-lg shrink-0 flex items-center gap-1.5 transition-all"
          >
            <PhoneCall size={13} />
            <span>Order Hotline</span>
          </a>
        </div>
      </div>

      {/* ========================================================
          EDITORIAL FOOTER
         ======================================================== */}
      <footer id="contact" className="bg-[#070b16]/95 border-t border-white/[0.1] pt-20 pb-28 px-6 md:px-14 relative z-10">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 font-bold text-xl tracking-tighter">
              <span className="text-amber-400 font-serif font-black">UA</span>
              <span className="uppercase font-black tracking-tighter italic text-white">
                {appPrefix} <span className="text-amber-400">{appSuffix}</span>
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal max-w-sm">
              Artisanal cloud gastronomy redefining fresh curation, ancient hearth cooking, and luxury home dining across Delhi NCR.
            </p>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider space-y-1">
              <p>Network: <span className="text-amber-300 font-bold">Ethereal Kitchen Cloud</span></p>
              <p>Stewardship: <span className="text-amber-300 font-bold">Ethereal Inn Hospitality LLP</span></p>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-white font-bold uppercase text-[10.5px] tracking-[0.25em]">Central Culinary Hub</h5>
            <div className="flex items-start gap-2.5 text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
              <MapPin size={16} className="text-amber-400 shrink-0 mt-0.5" />
              <span>{fullAddress}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-mono pt-2">
              <Clock size={13} className="text-amber-400" />
              <span>Gastronomy Hours: 11:00 AM – 11:30 PM (Daily)</span>
            </div>
          </div>

          <div className="space-y-3">
            <h5 className="text-white font-bold uppercase text-[10.5px] tracking-[0.25em]">Direct Concierge Desk</h5>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-normal">
              Inquire about customized meal subscription plans, event catering, or corporate orders.
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/${contactNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>WhatsApp Hotline ({contactNumber})</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </div>

        </div>

        <div className="mt-20 pt-8 border-t border-white/[0.1] flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-slate-500 text-[9.5px] uppercase tracking-widest font-bold">
          <p>© {currentYear} Urban Ambrosia. All rights reserved.</p>
          <p>A Signature Brand of Ethereal Inn Hospitality LLP • Ethereal Kitchen Cloud</p>
        </div>
      </footer>

    </div>
  );
}