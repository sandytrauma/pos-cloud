"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateStoreSettings(formData: FormData) {
  const storeName = formData.get("storeName") as string;
  const userId = Number(formData.get("userId"));

  if (isNaN(userId)) return { success: false, error: "Invalid User" };

  try {
    await db.update(users)
      .set({ name: storeName })
      .where(eq(users.id, userId));

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Database error" };
  }
}

export async function toggleMaintenanceMode(userId: string | number, isClosed: boolean) {
  const uid = Number(userId);
  if (isNaN(uid)) return { success: false };

  try {
    await db.update(users)
      .set({ 
        // Logic: Using role as a status flag to avoid schema changes
        role: isClosed ? "maintenance" : "admin" 
      })
      .where(eq(users.id, uid));

    revalidatePath("/", "layout");
    revalidatePath("/dashboard", "layout");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}