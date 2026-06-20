// Location: app/dashboard/layout.tsx
import SideNav from "@/components/shared/SideNav";
import { logOutAction } from "@/lib/actions/auth"; 

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full flex-col md:flex-row bg-slate-950 overflow-hidden text-slate-100 relative z-10">
      
      {/* 📱 Mobile: Sticky Base Navigation Bar Grid Channel 
          💻 Desktop: Static Sidebar Panel Frame 
      */}
      <div className="fixed bottom-0 left-0 right-0 z-50 w-full md:relative md:bottom-auto md:left-auto md:right-auto md:w-64 md:flex-none border-t border-slate-900 md:border-t-0 md:border-r">
        <SideNav logOutAction={logOutAction} />
      </div>
      
      {/* ⚡ Core Terminal Workspace Canvas Floor
          - pb-24 on mobile prevents workspace cards from slipping under the bottom navbar.
          - pb-10 on desktop reclaims full-screen scrolling estate cleanly.
      */}
      <main className="flex-1 overflow-y-auto p-5 pb-24 sm:p-6 md:p-10 md:pb-10 min-w-0 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="mx-auto max-w-7xl w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </main>
      
    </div>
  );
}