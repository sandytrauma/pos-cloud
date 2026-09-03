import { db } from "@/db";
import { sql, eq } from "drizzle-orm";
import { orders, customerAnalytics, customerProfiles } from "@/db/schema";

export async function refreshCustomerProfile(userId: number) {
  // 1. Calculate aggregated financial metrics
  const [metrics] = await db
    .select({
      visitCount: sql<number>`count(${orders.id})`,
      totalRevenue: sql<string>`coalesce(sum(${orders.netAmount}), 0)`,
      avgTicket: sql<string>`coalesce(avg(${orders.netAmount}), 0)`,
      lastOrderDate: sql<Date>`max(${orders.createdAt})`,
    })
    .from(orders)
    .where(eq(orders.userId, userId));

  const totalSpent = Number(metrics.totalRevenue);
  const totalVisits = Number(metrics.visitCount);

  // 2. Determine VIP status dynamically
  const isVIP = totalSpent >= 15000 || totalVisits >= 20;

  // 3. Upsert Analytics
  await db
    .insert(customerAnalytics)
    .values({
      userId,
      totalVisits,
      totalSpent: totalSpent.toString(),
      averageOrderValue: metrics.avgTicket,
      lastVisit: metrics.lastOrderDate,
    })
    .onConflictDoUpdate({
      target: customerAnalytics.userId,
      set: {
        totalVisits,
        totalSpent: totalSpent.toString(),
        averageOrderValue: metrics.avgTicket,
        lastVisit: metrics.lastOrderDate,
        updatedAt: new Date(),
      },
    });

  // 4. Update Profile Tag
  if (isVIP) {
    await db
      .update(customerProfiles)
      .set({ customerType: "VIP", isLoyal: true })
      .where(eq(customerProfiles.userId, userId));
  }
}