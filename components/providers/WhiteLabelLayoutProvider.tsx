"use client";

import React, { useEffect } from "react";

interface WhiteLabelLayoutProviderProps {
  children: React.ReactNode;
  /** Optional theme override to apply localized variables dynamically */
  themeClassName?: string;
  /** Allows tenants running in iframe environments to force light or dark backgrounds cleanly */
  colorScheme?: "dark" | "light" | "auto";
}

/**
 * Global layout system orchestration provider for the white-label POS system bundle.
 * Wraps the dashboard children views to govern structural themes and iframe lockouts.
 */
export default function WhiteLabelLayoutProvider({
  children,
  themeClassName = "",
  colorScheme = "dark",
}: WhiteLabelLayoutProviderProps) {
  
  // 🌟 FIXED: Keep document node roots synchronized with structural canvas expectations
  // This satisfies browser scrollbar aesthetics and prevents white flashing on slower canvas loading instances.
  useEffect(() => {
    const rootElement = document.documentElement;
    
    if (colorScheme === "dark") {
      rootElement.classList.add("dark");
      rootElement.style.colorScheme = "dark";
    } else if (colorScheme === "light") {
      rootElement.classList.remove("dark");
      rootElement.style.colorScheme = "light";
    } else {
      // Auto system match resolution tracking checks
      rootElement.style.colorScheme = "";
    }
  }, [colorScheme]);

  return (
    <div 
      className={`min-h-screen w-full bg-slate-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-slate-950 flex flex-col ${themeClassName} ${colorScheme === "dark" ? "dark" : ""}`}
      style={{ colorScheme: colorScheme === "auto" ? undefined : colorScheme }}
    >
      {/* Background radial gradient mask layout bounds */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(245,158,11,0.02),transparent_50%)] pointer-events-none z-0" />
      
      {/* 🌟 FIXED: Swapped 'h-full' for 'flex-1 flex flex-col' to ensure child components expand natively */}
      <div className="relative z-10 w-full flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}