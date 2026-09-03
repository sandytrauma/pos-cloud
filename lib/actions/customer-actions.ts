"use server";

import { db } from "@/db";
import { eq, or, ilike, and, gte, type SQL } from "drizzle-orm";
import { 
  users, 
  customerProfiles, 
  customerAnalytics, 
  subscriptions, 
  mealPlans 
} from "@/db/schema";

export interface CustomerProfileData {
  userId: number;
  name: string;
  phone: string | null;
  customerType: "REGULAR" | "SUBSCRIBER" | "VIP";
  loyaltyPoints: number;
  isLoyal: boolean;
  totalSpent: number;
  totalVisits: number;
  favoriteCategories: string[];
  activeSubscription?: {
    planName: string;
    endDate: string; // Serialized ISO string prevents Server-to-Client hydration crashes
    remainingDays: number;
  };
}

export async function lookupCustomer(query: string): Promise<{
  success: boolean;
  data?: CustomerProfileData;
  error?: string;
}> {
  if (!query || query.trim().length < 3) {
    return { success: false, error: "Enter at least 3 characters to search." };
  }

  try {
    const trimmed = query.trim();

    // 1. Build search conditions safely without injecting 'undefined' into Drizzle's OR clause
    const searchConditions: SQL[] = [ilike(users.name, `%${trimmed}%`)];
    if (customerProfiles.phone) {
      searchConditions.push(ilike(customerProfiles.phone, `%${trimmed}%`));
    }

    const [userRecord] = await db
      .select({
        id: users.id,
        name: users.name,
        phone: customerProfiles.phone,
        customerType: customerProfiles.customerType,
        loyaltyPoints: customerProfiles.loyaltyPoints,
        isLoyal: customerProfiles.isLoyal,
        totalSpent: customerAnalytics.totalSpent,
        totalVisits: customerAnalytics.totalVisits,
        favoriteCategories: customerAnalytics.favoriteCategories,
      })
      .from(users)
      .leftJoin(customerProfiles, eq(users.id, customerProfiles.userId))
      .leftJoin(customerAnalytics, eq(users.id, customerAnalytics.userId))
      .where(or(...searchConditions))
      .limit(1);

    if (!userRecord) {
      return { success: false, error: "Customer not found." };
    }

    // 2. Check for active subscription
    const now = new Date();
    const [activeSub] = await db
      .select({
        planName: mealPlans.name,
        endDate: subscriptions.endDate,
      })
      .from(subscriptions)
      .innerJoin(mealPlans, eq(subscriptions.mealPlanId, mealPlans.id))
      .where(
        and(
          eq(subscriptions.userId, userRecord.id),
          eq(subscriptions.status, "ACTIVE"),
          gte(subscriptions.endDate, now)
        )
      )
      .limit(1);

    let subscriptionData: CustomerProfileData["activeSubscription"] = undefined;

    if (activeSub && activeSub.endDate) {
      const parsedEndDate = new Date(activeSub.endDate);
      const diffTime = parsedEndDate.getTime() - now.getTime();
      const remainingDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      subscriptionData = {
        planName: activeSub.planName ?? "Active Meal Plan",
        endDate: parsedEndDate.toISOString(), // Safe ISO string format
        remainingDays: Math.max(0, remainingDays),
      };
    }

    return {
      success: true,
      data: {
        userId: userRecord.id,
        name: userRecord.name ?? "Unnamed Customer",
        phone: userRecord.phone ?? null,
        customerType: (userRecord.customerType as "REGULAR" | "SUBSCRIBER" | "VIP") ?? "REGULAR",
        loyaltyPoints: userRecord.loyaltyPoints ?? 0,
        isLoyal: Boolean(userRecord.isLoyal),
        totalSpent: Number(userRecord.totalSpent ?? 0),
        totalVisits: Number(userRecord.totalVisits ?? 0),
        favoriteCategories: Array.isArray(userRecord.favoriteCategories)
          ? (userRecord.favoriteCategories as string[])
          : [],
        activeSubscription: subscriptionData,
      },
    };
  } catch (error) {
    console.error("Lookup error:", error);
    return { success: false, error: "Internal server error querying customer." };
  }
}