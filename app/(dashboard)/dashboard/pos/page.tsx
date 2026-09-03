// Location: app/dashboard/pos/page.tsx
import { db } from "@/db";
import PosClient from "@/components/pos/PosClient";
import { createPosOrder } from "@/lib/actions/orders"; 

export const dynamic = "force-dynamic";

export default async function PosPage() {
  // 1. Fetch menu with nested items included on the server side
  const menuData = await db.query.categories.findMany({
    with: {
      items: true,
    },
    orderBy: (cat, { asc }) => [asc(cat.order)],
  });

  // 2. Clear out hidden Drizzle relational prototypes for Client Component serialization
  const serializedMenu = JSON.parse(JSON.stringify(menuData));

  // 3. Pass the top-level Server Action directly without wrapping it in an inline closure
  return (
    <div className="w-full h-full p-2 md:p-4">
      <PosClient 
        initialMenu={serializedMenu} 
        createPosOrder={createPosOrder}
        currencySymbol="₹"
      />
    </div>
  );
}