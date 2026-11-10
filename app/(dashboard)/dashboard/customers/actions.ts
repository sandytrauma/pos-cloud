"use server";

import { db } from "@/db";
import { eq, or, ilike, and, gte, desc, sql, type SQL } from "drizzle-orm";
import { 
  users, 
  customerProfiles, 
  customerAnalytics, 
  subscriptions, 
  mealPlans,
  orders 
} from "@/db/schema";
import { revalidatePath } from "next/cache";

export interface CustomerRow {
  userId: number;
  name: string;
  phone: string | null;
  customerType: "REGULAR" | "SUBSCRIBER" | "VIP";
  loyaltyPoints: number;
  isLoyal: boolean;
  totalSpent: number;
  totalVisits: number;
  activePlanName: string | null;
  subscriptionEndDate: string | null;
  remainingDays: number | null;
}

export type ActionResponse = {
  success: boolean;
  error?: string;
};

/**
 * Fetch all customer profiles with analytics and active subscription status
 */
export async function getCustomers(searchQuery?: string): Promise<{
  success: boolean;
  data?: CustomerRow[];
  error?: string;
}> {
  try {
    const now = new Date();
    const query = searchQuery?.trim();

    const conditions: SQL[] = [];
    if (query) {
      conditions.push(ilike(users.name, `%${query}%`));
      conditions.push(ilike(customerProfiles.phone, `%${query}%`));
    }

    const baseWhere = conditions.length > 0 ? or(...conditions) : undefined;

    // Direct query with explicit typings on select fields
    const rawRows = await db
      .select({
        userId: users.id,
        name: users.name,
        phone: customerProfiles.phone,
        customerType: customerProfiles.customerType,
        loyaltyPoints: customerProfiles.loyaltyPoints,
        isLoyal: customerProfiles.isLoyal,
        analyticsSpent: customerAnalytics.totalSpent,
        analyticsVisits: customerAnalytics.totalVisits,
      })
      .from(users)
      .innerJoin(customerProfiles, eq(users.id, customerProfiles.userId))
      .leftJoin(customerAnalytics, eq(users.id, customerAnalytics.userId))
      .where(baseWhere)
      .orderBy(desc(sql`COALESCE(${customerAnalytics.totalSpent}, 0)`), desc(users.id))
      .limit(50);

    // Fetch active subscriptions in batch
    const activeSubs = await db
      .select({
        userId: subscriptions.userId,
        planName: mealPlans.name,
        endDate: subscriptions.endDate,
      })
      .from(subscriptions)
      .innerJoin(mealPlans, eq(subscriptions.mealPlanId, mealPlans.id))
      .where(and(eq(subscriptions.status, "ACTIVE"), gte(subscriptions.endDate, now)));

    const subMap = new Map<number, { planName: string; endDate: string; remainingDays: number }>();
    
    for (const sub of activeSubs) {
      if (sub.endDate) {
        const parsedEndDate = new Date(sub.endDate);
        const remainingDays = Math.max(
          0,
          Math.ceil((parsedEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        );
        subMap.set(Number(sub.userId), {
          planName: String(sub.planName ?? "Active Meal Plan"),
          endDate: parsedEndDate.toISOString(),
          remainingDays,
        });
      }
    }

    // Explicit type mapping guarantees matching CustomerRow contract
    const formatted: CustomerRow[] = rawRows.map((row) => {
      const active = subMap.get(Number(row.userId));

      return {
        userId: Number(row.userId),
        name: String(row.name ?? (row.phone ? `Customer ${String(row.phone).slice(-4)}` : "Walk-in Guest")),
        phone: row.phone ? String(row.phone) : null,
        customerType: (row.customerType as "REGULAR" | "SUBSCRIBER" | "VIP") ?? "REGULAR",
        loyaltyPoints: Number(row.loyaltyPoints ?? 0),
        isLoyal: Boolean(row.isLoyal),
        totalSpent: Number(row.analyticsSpent ?? 0),
        totalVisits: Number(row.analyticsVisits ?? 0),
        activePlanName: active?.planName ?? null,
        subscriptionEndDate: active?.endDate ?? null,
        remainingDays: active?.remainingDays ?? null,
      };
    });

    return { success: true, data: formatted };
  } catch (error) {
    console.error("Failed to load customers:", error);
    return { success: false, error: "Failed to load customers." };
  }
}

/**
 * Creates or updates custom meal plan subscription and upgrades customer status
 */
export async function assignCustomSubscription(payload: {
  userId: number;
  planName: string;
  price: number;
  durationDays: number;
  paymentReference: string;
  mealsPerDay?: number;
}): Promise<ActionResponse> {
  try {
    return await db.transaction(async (tx) => {
      // 1. Insert custom meal plan
      const [newPlan] = await tx
        .insert(mealPlans)
        .values({
          name: payload.planName,
          price: payload.price.toString(),
          durationDays: payload.durationDays,
          mealsPerDay: payload.mealsPerDay ?? 1,
          isCustom: true,
        })
        .returning();

      // 2. Compute date boundaries
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + payload.durationDays);

      // 3. Create active subscription record
      await tx.insert(subscriptions).values({
        userId: payload.userId,
        mealPlanId: newPlan.id,
        startDate,
        endDate,
        amountPaid: payload.price.toString(),
        paymentReference: payload.paymentReference || `POS-PAY-${Date.now()}`,
        status: "ACTIVE",
      });

      // 4. Update customer status to SUBSCRIBER and award loyalty points
      const earnedPoints = Math.floor(payload.price * 0.1);
      await tx
        .insert(customerProfiles)
        .values({
          userId: payload.userId,
          customerType: "SUBSCRIBER",
          loyaltyPoints: earnedPoints,
          isLoyal: true,
        })
        .onConflictDoUpdate({
          target: customerProfiles.userId,
          set: {
            customerType: "SUBSCRIBER",
            loyaltyPoints: sql`${customerProfiles.loyaltyPoints} + ${earnedPoints}`,
            isLoyal: true,
            updatedAt: new Date(),
          },
        });

      revalidatePath("/dashboard/customers");
      revalidatePath("/dashboard/billing");
      revalidatePath("/dashboard/pos");
      return { success: true };
    });
  } catch (error) {
    console.error("Subscription Assignment Error:", error);
    return { success: false, error: "Failed to activate subscription." };
  }
}