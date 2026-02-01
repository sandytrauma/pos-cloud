import SideNav from "@/components/shared/SideNav";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden bg-slate-950">
      {/* Sidebar - Fixed on desktop, bottom bar on mobile */}
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      
      {/* Main Content Area */}
      <div className="flex-grow p-6 md:overflow-y-auto md:p-10">
        {children}
      </div>
    </div>
  );
}