"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logOut } from "@/lib/actions/auth";
import SetupPinModal from "@/components/auth/SetupPinModal";
import { 
  LayoutDashboard, Utensils, ReceiptIndianRupee, 
  Settings, LogOut, CookingPot, ClipboardList, Box, 
  Receipt
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Dash", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/dashboard/orders", icon: Utensils },
  { name: "Menu", href: "/dashboard/menu", icon: ClipboardList },
  { name: "Stock", href: "/dashboard/inventory", icon: Box }, // Shortened name for mobile
  { name: "Revenue", href: "/dashboard/revenue", icon: ReceiptIndianRupee },
  { name: "Bills", href: "/dashboard/billing", icon: Receipt }, // Shortened name for mobile
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-16 w-full flex-row items-center border-t border-slate-800 bg-slate-950/80 backdrop-blur-md fixed bottom-0 left-0 z-50 md:relative md:h-full md:w-64 md:flex-col md:border-t-0 md:border-r md:bg-slate-950 md:px-4 md:py-8">
      
      {/* Brand Logo - Desktop Only */}
      <div className="hidden md:flex mb-10 w-full items-center justify-center rounded-2xl bg-amber-600 p-4 shadow-lg shadow-amber-600/20">
        <div className="text-white font-black flex items-center gap-2 text-xl tracking-tighter italic">
          <CookingPot size={24} /> 
          <span>KITCHEN</span>
        </div>
      </div>

      {/* Nav Links Container */}
      {/* Mobile: Horizontal scrollable area | Desktop: Vertical column */}
      <nav className="flex w-full flex-row items-center overflow-x-auto no-scrollbar md:flex-col md:overflow-visible md:justify-start md:gap-2 px-2 md:px-0">
        
        <div className="flex flex-row md:flex-col gap-1 md:gap-2 w-full">
          {links.map((link) => {
            const LinkIcon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex flex-col md:flex-row h-14 md:h-12 min-w-[64px] md:min-w-0 grow items-center justify-center gap-1 md:gap-4 rounded-xl px-2 transition-all active:scale-95 md:w-full md:justify-start",
                  isActive 
                    ? "text-amber-500 md:bg-amber-500 md:text-slate-950" 
                    : "text-slate-500 hover:text-amber-400 md:hover:bg-slate-900"
                )}
              >
                <LinkIcon className="w-5 h-5" />
                <p className="text-[8px] md:text-sm font-black uppercase tracking-tighter md:tracking-normal whitespace-nowrap">
                  {link.name}
                </p>
                {/* Active Indicator for Mobile Bottom Bar */}
                {isActive && <div className="md:hidden absolute bottom-1 w-1 h-1 rounded-full bg-amber-500" />}
              </Link>
            );
          })}

          {/* Settings & Setup (Integrated into the flow for small screens) */}
          <div className="flex flex-row md:hidden items-center border-l border-slate-800 ml-2 pl-2 gap-1">
             <Link
              href="/dashboard/settings"
              className={cn(
                "flex flex-col h-14 min-w-[64px] items-center justify-center gap-1 transition-all active:scale-95",
                pathname === "/dashboard/settings" ? "text-amber-500" : "text-slate-500"
              )}
            >
              <Settings className="w-5 h-5" />
              <p className="text-[8px] font-black uppercase tracking-tighter">Setup</p>
            </Link>

            <div className="flex h-14 min-w-[50px] items-center justify-center scale-75">
                <SetupPinModal />
            </div>

            <form action={logOut}>
              <button 
                type="submit"
                className="flex flex-col h-14 min-w-[60px] items-center justify-center gap-1 text-rose-500 active:scale-95 px-2"
              >
                <LogOut className="w-5 h-5" />
                <p className="text-[8px] font-black uppercase tracking-tighter">Exit</p>
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Bottom Actions - Desktop Only */}
      <div className="hidden md:flex mt-auto w-full flex-col gap-2 pt-4 border-t border-slate-900">
        <div className="w-full">
           <SetupPinModal />
        </div>

        <Link
          href="/dashboard/settings"
          className={cn(
            "flex h-12 w-full items-center gap-4 rounded-xl px-4 text-sm font-bold transition-colors",
            pathname === "/dashboard/settings" ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-900 hover:text-white"
          )}
        >
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        
        <form action={logOut}>
          <button 
            type="submit"
            className="flex h-12 w-full items-center gap-4 rounded-xl px-4 text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}