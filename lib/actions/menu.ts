"use server";

import { db } from "@/db";
import { menuItems, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function addCategory(name: string) {
  try {
    await db.insert(categories).values({ name });
    revalidatePath("/dashboard/menu");
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function addMenuItem(formData: FormData) {
  const name = formData.get("name") as string;
  const price = formData.get("price") as string;
  const costPrice = formData.get("costPrice") as string; // NEW: Capture Cost
  const categoryId = parseInt(formData.get("categoryId") as string);

  try {
    await db.insert(menuItems).values({
      name,
      price: price.toString(),
      costPrice: costPrice ? costPrice.toString() : "0", // NEW: Save Cost
      categoryId,
    });
    
    // Refresh all relevant screens
    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard/revenue"); // NEW: Update Analytics
    return { success: true };
  } catch (e) {
    console.error("Add Item Error:", e);
    return { success: false };
  }
}

export async function updateMenuItem(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const price = formData.get("price") as string;
  const costPrice = formData.get("costPrice") as string; // NEW: Capture Cost

  try {
    await db.update(menuItems)
      .set({
        name,
        price,
        costPrice: costPrice ? costPrice.toString() : "0", // NEW: Update Cost
      })
      .where(eq(menuItems.id, id));

    // Refresh all relevant screens
    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard/revenue"); // NEW: Update Analytics
    return { success: true };
  } catch (error) {
    console.error("Update Error:", error);
    return { success: false };
  }
}

export async function deleteMenuItem(id: number) {
  try {
    await db.delete(menuItems)
      .where(eq(menuItems.id, id));

    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/pos");
    revalidatePath("/dashboard/revenue");
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false };
  }
}