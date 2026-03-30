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
  const categoryId = parseInt(formData.get("categoryId") as string);

  try {
    await db.insert(menuItems).values({
      name,
      price: price.toString(),
      categoryId,
    });
    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/pos"); // Revalidate POS so new items show up
    return { success: true };
  } catch (e) {
    return { success: false };
  }
}

export async function updateMenuItem(formData: FormData) {
  const id = Number(formData.get("id"));
  const name = formData.get("name") as string;
  const price = formData.get("price") as string;

  try {
    await db.update(menuItems)
      .set({
        name,
        price, // Drizzle handles decimal/string conversion based on your schema
      })
      .where(eq(menuItems.id, id));

    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/pos"); // Revalidate POS to show new prices
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false };
  }
}

export async function deleteMenuItem(id: number) {
  try {
    await db.delete(menuItems)
      .where(eq(menuItems.id, id));

    revalidatePath("/dashboard/menu");
    revalidatePath("/dashboard/pos");
    return { success: true };
  } catch (error) {
    console.error("Delete Error:", error);
    return { success: false };
  }
}