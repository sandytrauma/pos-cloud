"use server";

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { calculateGstBreakdown } from "@/lib/utils";
import { and, eq, lt, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Create a new In-Store (POS) Order with Sequential Tokenization
 */
export async function createPosOrder(formData: {
  customerPhone?: string;
  items: { itemName: string; quantity: number; price: number }[];
}) {
  try {
    // 1. Calculate Totals
    const total = formData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const { netAmount, gstAmount } = calculateGstBreakdown(total);

    // 2. Get Sequential Token Number for Today
    // This finds the max token for today and adds 1. Resets to 1 automatically at midnight.
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastOrderResult = await db
      .select({ maxToken: sql<number>`max(cast(substring(token_number, 4) as integer))` })
      .from(orders)
      .where(sql`created_at >= ${today.toISOString()}`);

    const nextTokenInt = (lastOrderResult[0]?.maxToken || 0) + 1;
    const formattedToken = `TK-${nextTokenInt.toString().padStart(3, '0')}`;

    // 3. Insert Order 
    const [newOrder] = await db.insert(orders).values({
      tokenNumber: formattedToken,
      source: "POS",
      totalAmount: total.toFixed(2),
      gstAmount: gstAmount.toString(),
      netAmount: netAmount.toString(),
      customerPhone: formData.customerPhone,
      status: "RECEIVED",
    }).returning();

    // 4. Insert Items
    if (formData.items.length > 0) {
      const itemsToInsert = formData.items.map((item) => ({
        orderId: newOrder.id,
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price.toFixed(2),
      }));

      await db.insert(orderItems).values(itemsToInsert);
    }

    // Trigger an archive check every time an order is placed (Optional but keeps DB clean)
    await archiveOldOrders();

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    return { success: true, orderId: newOrder.id, token: newOrder.tokenNumber };
  } catch (error) {
    console.error("Order Creation Error:", error);
    return { success: false, error: "Failed to create order" };
  }
}

/**
 * Update Order Status
 */
export async function updateOrderStatus(
  orderId: number, 
  status: "RECEIVED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED" | "archived"
) {
  try {
    await db.update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/orders");
    return { success: true };
  } catch (error) {
    console.error("Update Status Error:", error);
    return { success: false };
  }
}

/**
 * Lifecycle Management: Archive orders older than 48 hours
 * Only archives COMPLETED or CANCELLED orders.
 */
export async function archiveOldOrders() {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    await db.update(orders)
      .set({ status: 'archived' }) 
      .where(
        and(
          lt(orders.createdAt, fortyEightHoursAgo),
          sql`status IN ('COMPLETED', 'CANCELLED')`
        )
      );
      
    return { success: true };
  } catch (error) {
    console.error("Archive Error:", error);
    return { success: false };
  }
}