"use server";

import { eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertRole, assertAuthenticated } from "@/lib/security";

interface WhiteLabelInventoryConfig {
  db: any;
  inventoryTable: any;
  stockLogsTable: any;
  dashboardBasePath?: string;
}

export async function updateStockAction(
  config: WhiteLabelInventoryConfig,
  inventoryId: number, 
  type: 'IN' | 'OUT', 
  formData: FormData
) {
  try {
    const user = await assertAuthenticated();
    const { db, inventoryTable, stockLogsTable, dashboardBasePath = "/dashboard" } = config;
    const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

    const quantityStr = formData.get("quantity") as string;
    const staffName = (formData.get("staffName") as string) || user.name || "Staff";
    const quantity = parseFloat(quantityStr);

    if (isNaN(quantity) || quantity <= 0) {
      return { success: false, error: "Enter a valid positive number" };
    }

    await db.transaction(async (tx: any) => {
      const adjustment = type === 'IN' ? quantity : -quantity;

      await tx
        .update(inventoryTable)
        .set({
          currentStock: sql`${inventoryTable.currentStock} + ${adjustment.toString()}::numeric`,
          updatedAt: new Date(),
        })
        .where(eq(inventoryTable.id, inventoryId));

      await tx.insert(stockLogsTable).values({
        inventoryId,
        type,
        quantity: quantity.toFixed(2),
        staffName,
        reason: type === 'IN' ? "Restock" : "Manual Usage Adjustment",
        createdAt: new Date(),
      });
    });

    revalidatePath(`${basePath}/inventory`);
    return { success: true };
  } catch (error: any) {
    console.error("Database Update Failed:", error);
    return { success: false, error: error.message || "Database rejected the ledger update." };
  }
}

export async function createInventoryItem(
  config: WhiteLabelInventoryConfig, 
  formData: FormData
) {
  try {
    await assertRole(["admin", "manager"]);

    const { db, inventoryTable, dashboardBasePath = "/dashboard" } = config;
    const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

    const name = (formData.get("name") as string)?.trim();
    const unit = (formData.get("unit") as string)?.trim();
    const minStock = parseFloat(formData.get("minStock") as string) || 5.00;
    const unitPrice = parseFloat(formData.get("unitPrice") as string) || 0.00;
    const expiryDateStr = formData.get("expiryDate") as string;

    if (!name || !unit) {
      return { success: false, error: "Name and unit are required fields." };
    }

    await db.insert(inventoryTable).values({
      name,
      unit,
      currentStock: "0.00",
      minStockLevel: minStock.toFixed(2),
      unitPrice: unitPrice.toFixed(2),
      expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
      updatedAt: new Date(),
    });

    revalidatePath(`${basePath}/inventory`);
    return { success: true };
  } catch (error: any) {
    console.error("Create Item Error:", error);
    return { success: false, error: error.message || "Failed to create inventory item." };
  }
}

export async function getInventoryReportData(config: WhiteLabelInventoryConfig) {
  try {
    await assertAuthenticated();
    const { db, inventoryTable } = config;

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
  } catch (error: any) {
    console.error("Report Generation Error:", error);
    return { success: false, error: error.message || "Failed to generate report" };
  }
}