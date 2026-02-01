import SettingsClient from "@/components/settings/SettingsClient";
import { auth } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }
  
  return (
    <div className="space-y-10 pb-10 max-w-5xl">
      <header className="border-l-4 border-amber-500 pl-6">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase">
          System <span className="text-amber-500">Settings</span>
        </h1>
        <p className="text-slate-400 font-medium">Configure your kitchen rules.</p>
      </header>

      <SettingsClient userId={session.user.id} />
    </div>
  );
}