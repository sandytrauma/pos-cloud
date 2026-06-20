// Location: lib/actions/orderFactory.ts

import { and, eq, lt, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface WhiteLabelOrderConfig {
  db: any;
  ordersTable: any;
  orderItemsTable: any;
  dashboardBasePath?: string;
}

export function createOrderActions({
  db,
  ordersTable,
  orderItemsTable,
  dashboardBasePath = "/dashboard"
}: WhiteLabelOrderConfig) {

  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  const internalArchiveOldOrders = async () => {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await db.update(ordersTable)
        .set({ status: 'archived' }) 
        .where(
          and(
            // 🌟 FIXED: Kept safe native Drizzle operators for date comparison
            lt(ordersTable.createdAt, fortyEightHoursAgo),
            sql`${ordersTable.status} IN ('COMPLETED', 'CANCELLED')`
          )
        );
      return { success: true };
    } catch (error) {
      console.error("Archive Error:", error);
      return { success: false };
    }
  };

  return {
    createPosOrder: async (formData: {
      customerPhone?: string;
      items: { itemName: string; quantity: number; price: number }[];
      gstAmount: number;
      netAmount: number;
    }) => {
      try {
        const total = formData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 🌟 FIXED: Swapped raw SQL template condition for native Drizzle 'gte' operator
        // This forces the PG driver to safely serialize the 'today' Date object instance without breaking.
        const lastOrderResult = await db
          .select({ maxToken: sql<number>`max(cast(substring(${ordersTable.tokenNumber}, 4) as integer))` })
          .from(ordersTable)
          .where(gte(ordersTable.createdAt, today)); 

        const nextTokenInt = (lastOrderResult[0]?.maxToken || 0) + 1;
        const formattedToken = `TK-${nextTokenInt.toString().padStart(3, '0')}`;

        const [newOrder] = await db.insert(ordersTable).values({
          tokenNumber: formattedToken,
          source: "POS",
          totalAmount: total.toFixed(2),
          gstAmount: (formData.gstAmount || 0).toFixed(2),
          netAmount: (formData.netAmount || 0).toFixed(2),
          customerPhone: formData.customerPhone,
          status: "RECEIVED",
        }).returning();

        if (formData.items.length > 0) {
          const itemsToInsert = formData.items.map((item) => ({
            orderId: newOrder.id,
            itemName: item.itemName,
            quantity: item.quantity,
            price: item.price.toFixed(2),
          }));
          await db.insert(orderItemsTable).values(itemsToInsert);
        }

        await internalArchiveOldOrders();

        revalidatePath(`${basePath}`);
        revalidatePath(`${basePath}/orders`);
        return { success: true, orderId: newOrder.id, token: newOrder.tokenNumber };
      } catch (error) {
        console.error("Order Creation Error:", error);
        return { success: false, error: "Failed to create order" };
      }
    },

    updateOrderStatus: async (
      orderId: number, 
      status: "RECEIVED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED" | "archived"
    ) => {
      try {
        await db.update(ordersTable)
          .set({ status, updatedAt: new Date() })
          .where(eq(ordersTable.id, orderId));

        revalidatePath(`${basePath}`);
        revalidatePath(`${basePath}/orders`);
        revalidatePath(`${basePath}/reconciliation`);
        return { success: true };
      } catch (error) {
        console.error("Update Status Error:", error);
        return { success: false, error: "Failed to update order status" };
      }
    },

    archiveOldOrders: internalArchiveOldOrders
  };
}