
import { getCustomers } from "./actions";
import CustomerDirectory from "./CustomerDirectory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CustomersPage() {
  const result = await getCustomers();
  const initialData = result.success && result.data ? result.data : [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h1 className="text-4xl font-black text-white uppercase tracking-tighter italic leading-none">
            Customer <span className="text-amber-500">Profiles & Plans</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-3">
            Loyalty Subscriptions & Recurring Meal Operations
          </p>
        </div>
      </header>

      <CustomerDirectory initialCustomers={initialData} />
    </div>
  );
}