"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/security";

interface WhiteLabelMenuConfig {
  db: any;
  menuItemsTable: any;
  categoriesTable: any;
  dashboardBasePath?: string;
}

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

    if (!name || isNaN(categoryId) || isNaN(price) || price < 0) {
      return { success: false, error: "Valid item name, positive price, and category are required." };
    }

    await db.insert(menuItemsTable).values({
      name,
      price: price.toFixed(2),
      costPrice: costPrice.toFixed(2),
      categoryId,
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

    if (isNaN(id) || !name || isNaN(price) || price < 0) {
      return { success: false, error: "Valid item ID, name, and non-negative price are required." };
    }

    await db.update(menuItemsTable)
      .set({
        name,
        price: price.toFixed(2),
        costPrice: costPrice.toFixed(2),
      })
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
