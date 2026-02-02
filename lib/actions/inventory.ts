"use server";

import { db } from "@/db";
import { inventory, stockLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateStockAction(
  inventoryId: number, 
  type: 'IN' | 'OUT', 
  formData: FormData
) {
  const quantityStr = formData.get("quantity") as string;
  const staffName = formData.get("staffName") as string;
  const quantity = parseFloat(quantityStr);

  if (isNaN(quantity) || quantity <= 0) {
    return { success: false, error: "Invalid quantity" };
  }

  try {
    // We use a transaction to ensure both updates happen or neither happens
    await db.transaction(async (tx) => {
      // 1. Calculate the adjustment
      // If type is 'OUT', we subtract by making the number negative
      const adjustment = type === 'IN' ? quantity : -quantity;

      // 2. Update the main inventory table
      await tx
        .update(inventory)
        .set({
          currentStock: sql`${inventory.currentStock} + ${adjustment}`,
          updatedAt: new Date(),
        })
        .where(eq(inventory.id, inventoryId));

      // 3. Create the audit log
      await tx.insert(stockLogs).values({
        inventoryId,
        type,
        quantity: quantity.toString(),
        staffName,
        reason: type === 'IN' ? "Restock / Supply" : "Kitchen Usage / Wastage",
      });
    });

    // 4. Refresh the page data
    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, error: "Failed to update ledger" };
  }
}

/**
 * Action to create a brand new inventory item
 */
export async function createInventoryItem(formData: FormData) {
  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const minStock = formData.get("minStock") as string;

  try {
    await db.insert(inventory).values({
      name,
      unit,
      currentStock: "0.00",
      minStockLevel: minStock || "5.00",
    });

    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to create item" };
  }
}