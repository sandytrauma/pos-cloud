import SideNav from "@/components/shared/SideNav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row bg-slate-950 overflow-hidden">
      {/* Desktop: Sidebar stays on the left (w-64 or w-72)
          Mobile: Bottom Bar (Navigation is fixed at bottom)
      */}
      <div className="fixed bottom-0 left-0 right-0 z-50 w-full md:relative md:w-64 md:flex-none">
        <SideNav />
      </div>
      
      {/* Main Content Area */}
      <main className="flex-grow overflow-y-auto p-6 pb-24 md:p-10 md:pb-10">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
}