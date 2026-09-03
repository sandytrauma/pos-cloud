"use server";

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { customerProfiles, mealPlans, subscriptions } from "@/db/schema";
import { revalidatePath } from "next/cache";

export async function createCustomSubscription({
  userId,
  planName,
  price,
  durationDays = 30,
  paymentReference,
}: {
  userId: number;
  planName: string;
  price: number;
  durationDays?: number;
  paymentReference: string;
}) {
  try {
    return await db.transaction(async (tx) => {
      // 1. Create the Custom Meal Plan
      const [newPlan] = await tx.insert(mealPlans).values({
        name: planName,
        price: price.toString(),
        durationDays,
        isCustom: true,
      }).returning();

      // 2. Compute date boundaries
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + durationDays);

      // 3. Record Active Subscription
      await tx.insert(subscriptions).values({
        userId,
        mealPlanId: newPlan.id,
        startDate,
        endDate,
        amountPaid: price.toString(),
        paymentReference,
        status: "ACTIVE",
      });

      // 4. Upgrade User Profile to SUBSCRIBER & Award Loyalty Points
      const earnedPoints = Math.floor(price * 0.1); // 10% back in points
      await tx.insert(customerProfiles).values({
        userId,
        customerType: "SUBSCRIBER",
        loyaltyPoints: earnedPoints,
        isLoyal: true,
      }).onConflictDoUpdate({
        target: customerProfiles.userId,
        set: {
          customerType: "SUBSCRIBER",
          isLoyal: true,
          updatedAt: new Date(),
        },
      });

      revalidatePath("/dashboard/billing");
      return { success: true };
    });
  } catch (error) {
    console.error("Subscription Error:", error);
    return { success: false, error: "Failed to create subscription" };
  }
}