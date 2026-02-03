"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logOut } from "@/lib/actions/auth";
import { 
  LayoutDashboard, Utensils, ReceiptIndianRupee, 
  Settings, LogOut, CookingPot, ClipboardList, Box 
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Dash", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/dashboard/orders", icon: Utensils },
  { name: "Menu", href: "/dashboard/menu", icon: ClipboardList },
  { name: "Inventory", href: "/dashboard/inventory", icon: Box },
  { name: "Revenue", href: "/dashboard/revenue", icon: ReceiptIndianRupee },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-20 w-full flex-row items-center border-t border-slate-800 bg-slate-950 px-2 md:h-full md:w-64 md:flex-col md:border-t-0 md:border-r md:px-4 md:py-8">
      
      {/* Brand Logo - Hidden on mobile to save space */}
      <div className="hidden md:flex mb-10 w-full items-center justify-center rounded-2xl bg-amber-600 p-4 shadow-lg shadow-amber-600/20">
        <div className="text-white font-black flex items-center gap-2 text-xl tracking-tighter italic">
          <CookingPot size={24} /> 
          <span>KITCHEN</span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex w-full flex-row justify-around gap-1 md:flex-col md:justify-start md:gap-2">
        {links.map((link) => {
          const LinkIcon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex flex-col md:flex-row h-14 md:h-12 grow items-center justify-center gap-1 md:gap-4 rounded-xl px-2 transition-all active:scale-95 md:w-full md:justify-start md:px-4",
                isActive 
                  ? "bg-amber-500/10 text-amber-500 md:bg-amber-500 md:text-slate-950" 
                  : "text-slate-500 hover:text-amber-500 md:hover:bg-slate-900"
              )}
            >
              <LinkIcon className="w-6 h-6 md:w-5 md:h-5" />
              <p className="text-[10px] md:text-sm font-black uppercase tracking-tighter md:tracking-normal">
                {link.name}
              </p>
            </Link>
          );
        })}

        {/* Settings - Mobile Only inside the dock */}
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex flex-col md:hidden h-14 grow items-center justify-center gap-1 text-slate-500",
            pathname === "/dashboard/settings" && "text-amber-500"
          )}
        >
          <Settings className="w-6 h-6" />
          <p className="text-[10px] font-black uppercase">Settings</p>
        </Link>
      </nav>

      {/* Bottom Actions - Desktop Only */}
      <div className="hidden md:flex mt-auto w-full flex-col gap-2">
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
          <button className="flex h-12 w-full items-center gap-4 rounded-xl px-4 text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-colors">
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </div>
  );
}