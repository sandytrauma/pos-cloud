"use server";

import { db } from "@/db";
import { menuItems, categories } from "@/db/schema";
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