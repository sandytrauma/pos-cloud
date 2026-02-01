"use server";

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { calculateGstBreakdown } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Create a new In-Store (POS) Order
 */
export async function createPosOrder(formData: {
  customerPhone?: string;
  items: { itemName: string; quantity: number; price: number }[];
}) {
  try {
    const total = formData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const { netAmount, gstAmount } = calculateGstBreakdown(total);

    // 1. Insert Order 
    // Note: We convert numbers to strings for the Decimal type in Drizzle
    const [newOrder] = await db.insert(orders).values({
      tokenNumber: `TK-${Math.floor(100 + Math.random() * 900)}`,
      source: "POS",
      totalAmount: total.toFixed(2),
      gstAmount: gstAmount.toString(),
      netAmount: netAmount.toString(),
      customerPhone: formData.customerPhone,
      status: "RECEIVED",
    }).returning();

    // 2. Insert Items
    if (formData.items.length > 0) {
      const itemsToInsert = formData.items.map((item) => ({
        orderId: newOrder.id,
        itemName: item.itemName,
        quantity: item.quantity,
        price: item.price.toFixed(2),
      }));

      await db.insert(orderItems).values(itemsToInsert);
    }

    // Refresh the Dashboard and KDS
    revalidatePath("/dashboard");
    return { success: true, orderId: newOrder.id, token: newOrder.tokenNumber };
  } catch (error) {
    console.error("Order Creation Error:", error);
    return { success: false, error: "Failed to create order" };
  }
}

/**
 * Update Order Status (e.g., Prepared, Ready)
 */
export async function updateOrderStatus(
  orderId: number, 
  status: "RECEIVED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED"
) {
  try {
    await db.update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Update Status Error:", error);
    return { success: false };
  }
}