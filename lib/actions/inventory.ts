"use server";

import { db } from "@/db";
import { inventory, stockLogs } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Updates stock levels and creates an audit log in a single transaction.
 */
export async function updateStockAction(
  inventoryId: number, 
  type: 'IN' | 'OUT', 
  formData: FormData
) {
  const quantityStr = formData.get("quantity") as string;
  const staffName = (formData.get("staffName") as string) || "System";
  const quantity = parseFloat(quantityStr);

  // Validation
  if (isNaN(quantity) || quantity <= 0) {
    return { success: false, error: "Enter a valid positive number" };
  }

  try {
    await db.transaction(async (tx) => {
      // 1. Calculate adjustment
      const adjustment = type === 'IN' ? quantity : -quantity;

      // 2. THE CRITICAL FIX: 
      // We cast the adjustment to ::numeric explicitly so Postgres accepts the math.
      // We also ensure currentStock is treated correctly.
      await tx
        .update(inventory)
        .set({
          currentStock: sql`${inventory.currentStock} + ${adjustment.toString()}::numeric`,
          updatedAt: new Date(),
        })
        .where(eq(inventory.id, inventoryId));

      // 3. Create the Audit Log
      await tx.insert(stockLogs).values({
        inventoryId,
        type,
        quantity: quantity.toString(), // Store as string for Decimal columns
        staffName,
        reason: type === 'IN' ? "Restock" : "Usage",
        createdAt: new Date(),
      });
    });

    // 4. Force Next.js to drop the cache and fetch new numbers
    revalidatePath("/dashboard/inventory");
    
    return { success: true };
  } catch (error) {
    console.error("Database Update Failed:", error);
    return { success: false, error: "Database rejected the update." };
  }
}

/**
 * Creates a brand new inventory item
 */
export async function createInventoryItem(formData: FormData) {
  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const minStock = formData.get("minStock") as string;
  const unitPrice = formData.get("unitPrice") as string;
  const expiryDateStr = formData.get("expiryDate") as string;

  try {
    await db.insert(inventory).values({
      name,
      unit,
      currentStock: "0.00",
      minStockLevel: minStock || "5.00",
      unitPrice: unitPrice || "0.00",
      // Convert HTML date string to Date object or null
      expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
      updatedAt: new Date(),
    });

    revalidatePath("/dashboard/inventory");
    return { success: true };
  } catch (error) {
    console.error("Create Item Error:", error);
    return { success: false, error: "Failed to create item in database" };
  }
}

/**
 * Fetches all inventory data and formats it for a CSV download.
 */
export async function getInventoryReportData() {
  try {
    const data = await db.select().from(inventory).orderBy(inventory.name);
    
    // Define CSV Structure
    const headers = ["Item ID", "Item Name", "Current Stock", "Unit", "Min Level", "Last Updated"];
    const csvRows = [
      headers.join(","), // Header row
      ...data.map(item => [
        item.id,
        `"${item.name}"`, // Wrap in quotes to handle names with commas
        item.currentStock,
        item.unit,
        item.minStockLevel,
        item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : "N/A"
      ].join(","))
    ];

    return { 
      success: true, 
      data: csvRows.join("\n") 
    };
  } catch (error) {
    console.error("Report Generation Error:", error);
    return { success: false, error: "Failed to generate report" };
  }
}