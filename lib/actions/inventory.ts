"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface WhiteLabelInventoryConfig {
  db: any;                  // Accepts the tenant's Drizzle connection instance
  inventoryTable: any;      // Accepts the inventory schema table reference
  stockLogsTable: any;      // Accepts the audit log schema table reference
  dashboardBasePath?: string; // Optional: Overrides path location (Defaults to "/dashboard")
}

/**
 * 1. Update Stock Levels & Log Audit History
 * 🌟 FIXED: Shifted from factory function object closure to an atomic, flat, top-level Server Action
 */
export async function updateStockAction(
  config: WhiteLabelInventoryConfig,
  inventoryId: number, 
  type: 'IN' | 'OUT', 
  formData: FormData
) {
  const { db, inventoryTable, stockLogsTable, dashboardBasePath = "/dashboard" } = config;
  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  const quantityStr = formData.get("quantity") as string;
  const staffName = (formData.get("staffName") as string) || "System";
  const quantity = parseFloat(quantityStr);

  if (isNaN(quantity) || quantity <= 0) {
    return { success: false, error: "Enter a valid positive number" };
  }

  try {
    // FIXED: Removed PgTransaction hard-typing rule to remain multi-dialect flexible inside distributed environments
    await db.transaction(async (tx: any) => {
      const adjustment = type === 'IN' ? quantity : -quantity;

      // Perform precision numeric arithmetic matching the dynamic table layout passed
      await tx
        .update(inventoryTable)
        .set({
          currentStock: sql`${inventoryTable.currentStock} + ${adjustment.toString()}::numeric`,
          updatedAt: new Date(),
        })
        .where(eq(inventoryTable.id, inventoryId));

      // Log the balance change for calculations down the stream
      await tx.insert(stockLogsTable).values({
        inventoryId,
        type,
        quantity: quantity.toString(),
        staffName,
        reason: type === 'IN' ? "Restock" : "Usage",
        createdAt: new Date(),
      });
    });

    revalidatePath(`${basePath}/inventory`);
    return { success: true };
  } catch (error) {
    console.error("Database Update Failed:", error);
    return { success: false, error: "Database rejected the ledger update." };
  }
}

/**
 * 2. Register a Brand New Inventory Stock Item
 * 🌟 FIXED: Flat serialization pass compliant with Turbopack bundler pipelines
 */
export async function createInventoryItem(
  config: WhiteLabelInventoryConfig, 
  formData: FormData
) {
  const { db, inventoryTable, dashboardBasePath = "/dashboard" } = config;
  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  const name = formData.get("name") as string;
  const unit = formData.get("unit") as string;
  const minStock = formData.get("minStock") as string;
  const unitPrice = formData.get("unitPrice") as string;
  const expiryDateStr = formData.get("expiryDate") as string;

  try {
    await db.insert(inventoryTable).values({
      name,
      unit,
      currentStock: "0.00",
      minStockLevel: minStock || "5.00",
      unitPrice: unitPrice || "0.00",
      expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
      updatedAt: new Date(),
    });

    revalidatePath(`${basePath}/inventory`);
    return { success: true };
  } catch (error) {
    console.error("Create Item Error:", error);
    return { success: false, error: "Failed to build ledger index target." };
  }
}

/**
 * 3. Fetch Snapshot & Format Raw Stream Into CSV Payload
 */
export async function getInventoryReportData(config: WhiteLabelInventoryConfig) {
  const { db, inventoryTable } = config;
  try {
    const data = await db.select().from(inventoryTable).orderBy(inventoryTable.name);
    
    const headers = ["Item ID", "Item Name", "Current Stock", "Unit", "Min Level", "Last Updated"];
    const csvRows = [
      headers.join(","),
      ...data.map((item: any) => [
        item.id,
        `"${item.name}"`, 
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