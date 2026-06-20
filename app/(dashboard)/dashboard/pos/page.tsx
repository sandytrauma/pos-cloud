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

  // 2. Clear out hidden Drizzle relational prototypes to pass safe native arrays
  const serializedMenu = JSON.parse(JSON.stringify(menuData));

  /**
   * 3. ✅ SERVER ACTION ADAPTER: Handles asynchronous ordering securely
   * 🌟 FIXED: Computes missing financial parameters directly inside the scope 
   * to satisfy the strict schema type expectations required by createPosOrder.
   */
  const adaptedCreatePosOrder = async (formData: {
    items: Array<{
      itemName: string;
      quantity: number;
      price: number;
    }>;
  }) => {
    "use server";

    // A. Calculate base subtotal directly from incoming items array elements
    const subtotal = formData.items.reduce(
      (sum, item) => sum + (Number(item.price || 0) * Number(item.quantity || 0)), 
      0
    );

    // B. Compute the matching standard 5% tax and final total metrics
    const gstAmount = (subtotal * 5) / 100;
    const netAmount = subtotal + gstAmount;

    // C. Dispatch directly to the master action with all expected structural properties satisfied
    const result = await createPosOrder({
      customerPhone: undefined,
      items: formData.items.map((item) => ({
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price,
      })),
      gstAmount: gstAmount, // Dynamic float calculation passed cleanly
      netAmount: netAmount, // Dynamic float calculation passed cleanly
    });

    return {
      success: !!result.success,
      token: result.token || undefined,
      error: result.error || undefined,
    };
  };

  return (
    <PosClient 
      initialMenu={serializedMenu} 
      createPosOrder={adaptedCreatePosOrder}
    />
  );
}