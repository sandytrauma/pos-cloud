"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface WhiteLabelMenuConfig {
  db: any;                    // Accepts the tenant's Drizzle instance
  menuItemsTable: any;        // Accepts the menu items table layout from schema
  categoriesTable: any;       // Accepts the categories table layout from schema
  dashboardBasePath?: string; // Optional: Override base path (Defaults to "/dashboard")
}

/**
 * 1. Add Category Action
 * 🌟 FIXED: Flattened into an atomic, top-level Next.js compilable Server Action
 */
export async function addCategoryAction(config: WhiteLabelMenuConfig, name: string) {
  const { db, categoriesTable, dashboardBasePath = "/dashboard" } = config;
  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  try {
    await db.insert(categoriesTable).values({ name });
    
    revalidatePath(`${basePath}/menu`);
    return { success: true };
  } catch (e) {
    console.error("Add Category Error:", e);
    return { success: false, error: "Failed to add new category ledger entry." };
  }
}

/**
 * 2. Add Menu Item Action
 */
export async function addMenuItemAction(config: WhiteLabelMenuConfig, formData: FormData) {
  const { db, menuItemsTable, dashboardBasePath = "/dashboard" } = config;
  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  const name = formData.get("name") as string;
  const price = formData.get("price") as string;
  const costPrice = formData.get("costPrice") as string;
  const categoryId = parseInt(formData.get("categoryId") as string);

  if (!name || isNaN(categoryId)) {
    return { success: false, error: "Invalid item name or structural category link assignment." };
  }

  try {
    await db.insert(menuItemsTable).values({
      name,
      price: price.toString(),
      costPrice: costPrice ? costPrice.toString() : "0",
      categoryId,
    });
    
    revalidatePath(`${basePath}/menu`);
    revalidatePath(`${basePath}/pos`);
    revalidatePath(`${basePath}/revenue`);
    return { success: true };
  } catch (e) {
    console.error("Add Item Error:", e);
    return { success: false, error: "Failed to create brand new menu dish record." };
  }
}

/**
 * 3. Update Menu Item Action
 */
export async function updateMenuItemAction(config: WhiteLabelMenuConfig, formData: FormData) {
  const { db, menuItemsTable, dashboardBasePath = "/dashboard" } = config;
  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const price = formData.get("price") as string;
  const costPrice = formData.get("costPrice") as string;

  if (isNaN(id)) {
    return { success: false, error: "Target operational item ID tracking token missing." };
  }

  try {
    await db.update(menuItemsTable)
      .set({
        name,
        price,
        costPrice: costPrice ? costPrice.toString() : "0",
      })
      .where(eq(menuItemsTable.id, id));

    revalidatePath(`${basePath}/menu`);
    revalidatePath(`${basePath}/pos`);
    revalidatePath(`${basePath}/revenue`);
    return { success: true };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, error: "Failed to update target menu pricing records." };
  }
}

/**
 * 4. Delete Menu Item Action
 */
export async function deleteMenuItemAction(config: WhiteLabelMenuConfig, id: number) {
  const { db, menuItemsTable, dashboardBasePath = "/dashboard" } = config;
  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  try {
    await db.delete(menuItemsTable)
      .where(eq(menuItemsTable.id, id));

    revalidatePath(`${basePath}/menu`);
    revalidatePath(`${basePath}/pos`);
    revalidatePath(`${basePath}/revenue`);
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false, error: "Database rejected menu item drop routine." };
  }
}