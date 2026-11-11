// Location: lib/actions/menu.ts
"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/security";

interface WhiteLabelMenuConfig {
  db: any;                    // Accepts the tenant's Drizzle instance
  menuItemsTable: any;        // Accepts the menu items table layout from schema
  categoriesTable: any;       // Accepts the categories table layout from schema
  dashboardBasePath?: string; // Optional: Override base path (Defaults to "/dashboard")
}

/**
 * 1. Add Category Action (Admin / Manager Only)
 */
export async function addCategoryAction(config: WhiteLabelMenuConfig, name: string) {
  try {
    await assertRole(["admin", "manager"]);
    const cleanName = name?.trim();
    if (!cleanName) return { success: false, error: "Category name is required." };

    const { db, categoriesTable, dashboardBasePath = "/dashboard" } = config;
    const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

    await db.insert(categoriesTable).values({ name: cleanName });
    
    revalidatePath(`${basePath}/menu`);
    return { success: true };
  } catch (e: any) {
    console.error("Add Category Error:", e);
    return { success: false, error: e.message || "Failed to add category." };
  }
}

/**
 * 2. Add Menu Item Action (Admin / Manager Only)
 */
export async function addMenuItemAction(config: WhiteLabelMenuConfig, formData: FormData) {
  try {
    await assertRole(["admin", "manager"]);

    const { db, menuItemsTable, dashboardBasePath = "/dashboard" } = config;
    const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

    const name = (formData.get("name") as string)?.trim();
    const price = parseFloat(formData.get("price") as string);
    const costPriceStr = formData.get("costPrice") as string;
    const costPrice = costPriceStr ? parseFloat(costPriceStr) : 0;
    const categoryId = parseInt(formData.get("categoryId") as string, 10);
    const description = (formData.get("description") as string)?.trim() || null;

    if (!name || isNaN(categoryId) || isNaN(price) || price < 0) {
      return { success: false, error: "Valid item name, positive price, and category are required." };
    }

    await db.insert(menuItemsTable).values({
      name,
      description,
      price: price.toFixed(2),
      costPrice: costPrice.toFixed(2),
      categoryId,
      isAvailable: true,
      createdAt: new Date(),
    });
    
    revalidatePath(`${basePath}/menu`);
    revalidatePath(`${basePath}/pos`);
    revalidatePath(`${basePath}/revenue`);
    return { success: true };
  } catch (e: any) {
    console.error("Add Item Error:", e);
    return { success: false, error: e.message || "Failed to create menu dish." };
  }
}

/**
 * 3. Update Menu Item Action (Admin / Manager Only)
 */
export async function updateMenuItemAction(config: WhiteLabelMenuConfig, formData: FormData) {
  try {
    await assertRole(["admin", "manager"]);

    const { db, menuItemsTable, dashboardBasePath = "/dashboard" } = config;
    const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

    const id = Number(formData.get("id"));
    const name = (formData.get("name") as string)?.trim();
    const price = parseFloat(formData.get("price") as string);
    const costPriceStr = formData.get("costPrice") as string;
    const costPrice = costPriceStr ? parseFloat(costPriceStr) : 0;
    const categoryId = formData.get("categoryId") ? parseInt(formData.get("categoryId") as string, 10) : undefined;
    const description = (formData.get("description") as string)?.trim() || undefined;

    if (isNaN(id) || !name || isNaN(price) || price < 0) {
      return { success: false, error: "Valid item ID, name, and non-negative price are required." };
    }

    const updatePayload: any = {
      name,
      price: price.toFixed(2),
      costPrice: costPrice.toFixed(2),
    };
    if (categoryId !== undefined && !isNaN(categoryId)) updatePayload.categoryId = categoryId;
    if (description !== undefined) updatePayload.description = description;

    await db.update(menuItemsTable)
      .set(updatePayload)
      .where(eq(menuItemsTable.id, id));

    revalidatePath(`${basePath}/menu`);
    revalidatePath(`${basePath}/pos`);
    revalidatePath(`${basePath}/revenue`);
    return { success: true };
  } catch (error: any) {
    console.error("Update Error:", error);
    return { success: false, error: error.message || "Failed to update menu pricing records." };
  }
}

/**
 * 4. Toggle Availability / 86 Item Action (Admin / Manager / Staff)
 */
export async function toggleItemAvailabilityAction(config: WhiteLabelMenuConfig, id: number, isAvailable: boolean) {
  try {
    await assertRole(["admin", "manager", "staff"]);
    const { db, menuItemsTable, dashboardBasePath = "/dashboard" } = config;
    const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

    if (isNaN(id)) return { success: false, error: "Invalid item ID." };

    await db.update(menuItemsTable)
      .set({ isAvailable })
      .where(eq(menuItemsTable.id, id));

    revalidatePath(`${basePath}/menu`);
    revalidatePath(`${basePath}/pos`);
    return { success: true };
  } catch (error: any) {
    console.error("Toggle Availability Error:", error);
    return { success: false, error: error.message || "Failed to toggle dish availability." };
  }
}

/**
 * 5. Delete Menu Item Action (Admin Only)
 */
export async function deleteMenuItemAction(config: WhiteLabelMenuConfig, id: number) {
  try {
    await assertRole(["admin"]);

    const { db, menuItemsTable, dashboardBasePath = "/dashboard" } = config;
    const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

    if (isNaN(id)) return { success: false, error: "Invalid item ID." };

    await db.delete(menuItemsTable)
      .where(eq(menuItemsTable.id, id));

    revalidatePath(`${basePath}/menu`);
    revalidatePath(`${basePath}/pos`);
    revalidatePath(`${basePath}/revenue`);
    return { success: true };
  } catch (error: any) {
    console.error("Delete Error:", error);
    return { success: false, error: error.message || "Failed to delete menu item." };
  }
}