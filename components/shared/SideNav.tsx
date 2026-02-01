"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logOut } from "@/lib/actions/auth";
import { 
  LayoutDashboard, 
  Utensils, 
  ReceiptIndianRupee, 
  Settings, 
  LogOut,
  CookingPot
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Live Orders", href: "/dashboard/orders", icon: Utensils },
  { name: "Revenue & GST", href: "/dashboard/revenue", icon: ReceiptIndianRupee },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function SideNav() {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col px-3 py-4 md:px-4 bg-slate-950 border-r border-slate-800">
      {/* Brand Logo */}
      <Link 
        className="mb-6 flex h-16 items-center justify-center rounded-2xl bg-amber-600 p-4 transition-transform active:scale-95" 
        href="/dashboard"
      >
        <div className="text-white font-black flex items-center gap-2 text-xl tracking-tighter">
          <CookingPot size={28} /> 
          <span className="hidden md:block">KITCHEN</span>
        </div>
      </Link>

      {/* Navigation Links */}
      <div className="flex grow flex-row justify-between space-x-2 md:flex-col md:space-x-0 md:space-y-2">
        {links.map((link) => {
          const LinkIcon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.name}
              href={link.href}
              className={cn(
                "flex h-[48px] grow items-center justify-center gap-3 rounded-xl p-3 text-sm font-bold transition-all md:flex-none md:justify-start",
                isActive 
                  ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10" 
                  : "text-slate-500 hover:bg-slate-900 hover:text-amber-500"
              )}
            >
              <LinkIcon className="w-5" />
              <p className="hidden md:block">{link.name}</p>
            </Link>
          );
        })}
        
        {/* Spacer for Desktop */}
        <div className="hidden h-auto w-full grow md:block"></div>

        {/* Logout Action */}
        <form action={logOut}>
          <button className="flex h-[48px] w-full grow items-center justify-center gap-3 rounded-xl bg-slate-900/50 p-3 text-sm font-bold text-rose-500 hover:bg-rose-500/10 transition-colors md:flex-none md:justify-start">
            <LogOut className="w-5" />
            <div className="hidden md:block">Sign Out</div>
          </button>
        </form>
      </div>
    </div>
  );
}