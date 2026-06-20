// Location: app/(dashboard)/dashboard/inventory/page.tsx
import { db } from "@/db";
import { inventory, stockLogs } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import InventoryListLayout from "./InventoryListLayout";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  // 1. Fetch live stock lines from your explicit schema reference
  const rawStockData = await db
    .select()
    .from(inventory)
    .orderBy(desc(inventory.updatedAt))
    .catch(() => []);

  // 2. Serialize parameters safely across the client network gateway boundary
  const serializedStock = rawStockData.map((item) => ({
    id: Number(item.id),
    name: item.name || "Unnamed Item",
    currentStock: Number(item.currentStock) || 0,
    minStockLevel: Number(item.minStockLevel) || 0,
    unitPrice: Number(item.unitPrice) || 0,
    unit: item.unit || "Units",
    expiryDate: item.expiryDate ? item.expiryDate.toISOString() : null,
  }));

  /**
   * 🌟 INLINE SERVER ACTION: Atomic stock volume modifier execution block
   */
  const handleUpdateStockAction = async (
    inventoryId: number, 
    type: "IN" | "OUT", 
    quantity: number, 
    staffName: string
  ) => {
    "use server";
    if (isNaN(quantity) || quantity <= 0) return { success: false, error: "Enter a valid volume" };

    try {
      await db.transaction(async (tx) => {
        const adjustment = type === "IN" ? quantity : -quantity;

        await tx
          .update(inventory)
          .set({
            currentStock: sql`${inventory.currentStock} + ${adjustment.toString()}::numeric`,
            updatedAt: new Date(),
          })
          .where(eq(inventory.id, inventoryId));

        await tx.insert(stockLogs).values({
          inventoryId,
          type,
          quantity: quantity.toString(),
          staffName: staffName || "System",
          reason: type === "IN" ? "Restock" : "Usage",
          createdAt: new Date(),
        });
      });

      revalidatePath("/dashboard/inventory");
      return { success: true };
    } catch (err) {
      console.error("Stock action execution failed:", err);
      return { success: false, error: "Failed to update ledger records." };
    }
  };

  /**
   * 🌟 INLINE SERVER ACTION: Add Brand New Inventory Item
   */
  const handleCreateInventoryItemAction = async (formData: FormData) => {
    "use server";
    const name = formData.get("name") as string;
    const unit = formData.get("unit") as string;
    const minStock = formData.get("minStock") as string;
    const unitPrice = formData.get("unitPrice") as string;
    const expiryDateStr = formData.get("expiryDate") as string;

    if (!name || !unit) return { success: false, error: "Name and Unit fields are required" };

    try {
      await db.insert(inventory).values({
        name,
        unit,
        currentStock: "0.00",
        minStockLevel: minStock || "5.00",
        unitPrice: unitPrice || "0.00",
        expiryDate: expiryDateStr ? new Date(expiryDateStr) : null,
        updatedAt: new Date(),
      });

      revalidatePath("/dashboard/inventory");
      return { success: true };
    } catch (error) {
      console.error("Create Item Error:", error);
      return { success: false, error: "Failed to build ledger index target." };
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-10 text-white">
      <InventoryListLayout 
        stock={serializedStock} 
        onUpdateStock={handleUpdateStockAction}
        onCreateItem={handleCreateInventoryItemAction}
      />
    </div>
  );
}