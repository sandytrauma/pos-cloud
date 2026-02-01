"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateStoreSettings(formData: FormData) {
  const storeName = formData.get("storeName") as string;
  const gstin = formData.get("gstin") as string;
  const phone = formData.get("phone") as string;
  const userId = formData.get("userId") as string;

  try {
    // Assuming you store settings per user/admin for now
    await db.update(users)
      .set({ 
        // If your users table has these fields, update them here
        // If you have a separate 'settings' table, update that instead
        name: storeName, 
      })
      .where(eq(users.id, userId));

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to update settings" };
  }
}