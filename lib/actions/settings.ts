"use server";

import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updateStoreSettings(formData: FormData) {
  const storeName = formData.get("storeName") as string;
  // Convert the string ID from the form into a Number
  const userId = Number(formData.get("userId")); 

  if (isNaN(userId)) {
    return { success: false, error: "Invalid User ID" };
  }

  try {
    await db.update(users)
      .set({ 
        name: storeName, 
      })
      .where(eq(users.id, userId)); // Now it's number vs number ✅

    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to update settings" };
  }
}

// Do the same for your toggle function
export async function toggleMaintenanceMode(userId: string | number, isClosed: boolean) {
  try {
    await db.update(users)
      .set({ 
        // update your status column here
      })
      .where(eq(users.id, Number(userId))); // Convert to number ✅

    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}