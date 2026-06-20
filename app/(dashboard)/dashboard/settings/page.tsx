// Location: app/dashboard/settings/page.tsx
import SettingsClient from "@/components/settings/SettingsClient";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

// 1. Import the statically compiled server action entry points
import { updateStoreSettings, toggleMaintenanceMode } from "@/lib/actions/settings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Safe parsing layer for user ID type mapping
  const parsedId = typeof session.user.id === "string" 
    ? parseInt(session.user.id, 10) || session.user.id 
    : session.user.id;

  // Fetch fresh user data with exact structural matching criteria
  const userData = await db.query.users.findFirst({
    where: eq(users.id, parsedId as any),
  });

  // Authorization Guard Panel
  if (!userData || (userData.role !== "admin" && userData.role !== "maintenance")) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-rose-500 font-black text-2xl uppercase italic leading-none">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-3">
          Administrator or Maintenance privileges required.
        </p>
        <a href="/dashboard" className="mt-6 text-amber-500 font-black uppercase text-xs underline hover:text-amber-400 transition-colors">
          Back to Dashboard
        </a>
      </div>
    );
  }

  // Clean hidden Drizzle prototypes & Date formats to safely pass raw properties across the wire
  const serializedUser = JSON.parse(JSON.stringify(userData));

  return (
    <div className="space-y-10 pb-10 max-w-5xl animate-in fade-in duration-500">
      <header className="border-l-4 border-amber-500 pl-6">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic leading-none">
          System <span className="text-amber-500">Settings</span>
        </h1>
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] mt-3">
          Operational Control Panel
        </p>
      </header>

      {/* 2. ✅ FIXED: Explicitly provide the required properties to clear SettingsClientProps error */}
      <SettingsClient 
        user={serializedUser} 
        updateStoreSettings={updateStoreSettings}
        toggleMaintenanceMode={toggleMaintenanceMode}
      />
    </div>
  );
}