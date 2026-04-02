import SettingsClient from "@/components/settings/SettingsClient";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Fetch fresh data to ensure we have the latest name/role
  const user = await db.query.users.findFirst({
    where: eq(users.id, Number(session.user.id)),
  });

  // Authorization Guard
  if (!user || (user.role !== "admin" && user.role !== "maintenance")) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center">
        <h2 className="text-rose-500 font-black text-2xl uppercase italic">Access Restricted</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Administrator privileges required.</p>
        <a href="/dashboard" className="mt-6 text-amber-500 font-black uppercase text-xs underline">Back to Dashboard</a>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10 max-w-5xl">
      <header className="border-l-4 border-amber-500 pl-6">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
          System <span className="text-amber-500">Settings</span>
        </h1>
        <p className="text-slate-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">
          Operational Control Panel
        </p>
      </header>

      <SettingsClient user={user} />
    </div>
  );
}