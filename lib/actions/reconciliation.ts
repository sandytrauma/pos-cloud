"use server";

import { db } from "@/db";
import { orders, stockLogs, inventory, reconciliations } from "@/db/schema";
import { eq, and, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getDailySummary() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    // 1. Fetch Revenue from COMPLETED orders today
    const todayOrders = await db.select({
      revenue: sql<string>`sum(${orders.netAmount})`,
      count: sql<number>`count(${orders.id})`
    })
    .from(orders)
    .where(and(
      eq(orders.status, "COMPLETED"),
      gte(orders.createdAt, today)
    ));

    // 2. Fetch Cost of Goods Sold (COGS) from Stock OUT logs
    const logs = await db.select().from(stockLogs)
      .where(and(
        eq(stockLogs.type, 'OUT'),
        gte(stockLogs.createdAt, today)
      ));

    let cogs = 0;
    for (const log of logs) {
      if (log.inventoryId) {
        const item = await db.query.inventory.findFirst({
          where: eq(inventory.id, log.inventoryId)
        });
        if (item) {
          cogs += (Number(log.quantity) * Number(item.unitPrice || 0));
        }
      }
    }

    return {
      success: true,
      revenue: Number(todayOrders[0]?.revenue || 0),
      orderCount: todayOrders[0]?.count || 0,
      inventoryExpense: cogs
    };
  } catch (error) {
    return { success: false, error: "Failed to fetch summary" };
  }
}

export async function saveReconciliationAction(data: {
  revenue: number;
  inventoryExpense: number;
  staffExp: number;
  miscExp: number;
  netEarning: number;
  orderCount: number;
  staffName: string;
}) {
  try {
    await db.insert(reconciliations).values({
      totalRevenue: data.revenue.toString(),
      inventoryExpense: data.inventoryExpense.toString(),
      staffExpenses: data.staffExp.toString(),
      miscExpenses: data.miscExp.toString(),
      netEarning: data.netEarning.toString(),
      orderCount: data.orderCount,
      staffName: data.staffName,
      status: "closed"
    });

    revalidatePath("/dashboard/reconciliation");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { success: false, error: "Failed to save daily ledger" };
  }
}