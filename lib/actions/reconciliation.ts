"use server";

import { eq, and, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertRole, assertAuthenticated } from "@/lib/security";

interface WhiteLabelReconciliationConfig {
  db: any;
  ordersTable: any;
  stockLogsTable: any;
  inventoryTable: any;
  reconciliationsTable: any;
  dashboardBasePath?: string;
}

export async function createReconciliationActions({
  db,
  ordersTable,
  stockLogsTable,
  inventoryTable,
  reconciliationsTable,
  dashboardBasePath = "/dashboard"
}: WhiteLabelReconciliationConfig) {

  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  return {
    getDailySummary: async () => {
      try {
        await assertAuthenticated();

        const now = new Date();
        const offset = now.getTimezoneOffset();
        const localToday = new Date(now.getTime() - (offset * 60 * 1000));
        const todayISOString = localToday.toISOString().split('T')[0] + "T00:00:00.000Z";

        const todayOrders = await db.select({
          revenue: sql<string>`sum(${ordersTable.netAmount})`,
          count: sql<number>`count(${ordersTable.id})`
        })
        .from(ordersTable)
        .where(and(
          eq(ordersTable.status, "COMPLETED"),
          gte(ordersTable.createdAt, sql`${todayISOString}::timestamp`)
        ));

        const detailedOrdersList = await db.select({
          id: ordersTable.id,
          tokenNumber: ordersTable.tokenNumber,
          netAmount: ordersTable.netAmount,
          createdAt: ordersTable.createdAt,
          status: ordersTable.status
        })
        .from(ordersTable)
        .where(gte(ordersTable.createdAt, sql`${todayISOString}::timestamp`))
        .orderBy(sql`${ordersTable.createdAt} desc`);

        const activeLogs = await db
          .select({
            quantity: stockLogsTable.quantity,
            unitPrice: inventoryTable.unitPrice
          })
          .from(stockLogsTable)
          .innerJoin(inventoryTable, eq(stockLogsTable.inventoryId, inventoryTable.id))
          .where(and(
            eq(stockLogsTable.type, 'OUT'),
            gte(stockLogsTable.createdAt, sql`${todayISOString}::timestamp`)
          ));

        const cogs = activeLogs.reduce((acc: number, log: any) => {
          return acc + (parseFloat(log.quantity || "0") * parseFloat(log.unitPrice || "0"));
        }, 0);

        return {
          success: true,
          data: {
            revenue: Number(todayOrders[0]?.revenue || 0),
            orderCount: Number(todayOrders[0]?.count || 0),
            inventoryExpense: cogs,
            ordersList: detailedOrdersList 
          }
        };
      } catch (error: any) {
        console.error("Daily Summary Error: ", error);
        return { success: false, error: error.message || "Failed to fetch summary computations." };
      }
    },

    saveReconciliationAction: async (data: {
      revenue: number;
      inventoryExpense: number;
      staffExp: number;
      miscExp: number;
      netEarning: number;
      orderCount: number;
      staffName?: string;
    }) => {
      try {
        const currentUser = await assertRole(["admin", "manager"]);
        const closingStaff = currentUser.name || data.staffName || "Staff";

        await db.insert(reconciliationsTable).values({
          totalRevenue: (data.revenue || 0).toFixed(2),
          inventoryExpense: (data.inventoryExpense || 0).toFixed(2),
          staffExpenses: (data.staffExp || 0).toFixed(2),
          miscExpenses: (data.miscExp || 0).toFixed(2),
          netEarning: (data.netEarning || 0).toFixed(2),
          orderCount: Number(data.orderCount || 0),
          staffName: closingStaff,
          status: "closed",
          createdAt: new Date(),
        });

        revalidatePath(`${basePath}/reconciliation`);
        revalidatePath(`${basePath}/billing`);
        return { success: true };
      } catch (error: any) {
        console.error("Save Reconciliation Error: ", error);
        return { success: false, error: error.message || "Failed to save daily ledger." };
      }
    }
  };
}