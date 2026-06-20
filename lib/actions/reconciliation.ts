"use server";

import { eq, and, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface WhiteLabelReconciliationConfig {
  db: any;                 // Accepts the tenant's Drizzle context instance
  ordersTable: any;        // Accepts the orders schema table definition
  stockLogsTable: any;     // Accepts the stock logs schema table definition
  inventoryTable: any;     // Accepts the inventory schema table definition
  reconciliationsTable: any; // Accepts the reconciliations schema table definition
  dashboardBasePath?: string; // Optional base directory configuration override
}

/**
 * Generates runtime financial reconciliation actions for white-label distributions.
 */
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
    /**
     * 1. Fetch Daily Financial Balance Sheet & Live Billing Rows
     */
    getDailySummary: async () => {
      // Generates an explicit localized YYYY-MM-DD midnight timestamp string 
      // to prevent the PostgreSQL driver from shifting dates incorrectly across timezones.
      const now = new Date();
      const offset = now.getTimezoneOffset();
      const localToday = new Date(now.getTime() - (offset * 60 * 1000));
      const todayISOString = localToday.toISOString().split('T')[0] + "T00:00:00.000Z";

      try {
        // A. Fetch Revenue Metrics from COMPLETED orders today
        const todayOrders = await db.select({
          revenue: sql<string>`sum(${ordersTable.netAmount})`,
          count: sql<number>`count(${ordersTable.id})`
        })
        .from(ordersTable)
        .where(and(
          eq(ordersTable.status, "COMPLETED"),
          gte(ordersTable.createdAt, sql`${todayISOString}::timestamp`)
        ));

        // B. Fetch the actual item lists to render live order data directly into the Billing view grid
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

        // C. Fetch COGS by joining stock logs directly with inventory items
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
      } catch (error) {
        console.error("Daily Summary Optimization Error: ", error);
        return { success: false, error: "Failed to fetch summary computations." };
      }
    },

    /**
     * 2. Save and Freeze Daily Reconciliation (End of Shift Ledger)
     */
    saveReconciliationAction: async (data: {
      revenue: number;
      inventoryExpense: number;
      staffExp: number;
      miscExp: number;
      netEarning: number;
      orderCount: number;
      staffName: string;
    }) => {
      try {
        await db.insert(reconciliationsTable).values({
          totalRevenue: (data.revenue || 0).toString(),
          inventoryExpense: (data.inventoryExpense || 0).toString(),
          staffExpenses: (data.staffExp || 0).toString(),
          miscExpenses: (data.miscExp || 0).toString(),
          netEarning: (data.netEarning || 0).toString(),
          orderCount: Number(data.orderCount || 0),
          staffName: data.staffName || "UNKNOWN_STAFF",
          status: "closed"
        });

        revalidatePath(`${basePath}/reconciliation`);
        return { success: true };
      } catch (error) {
        console.error("Save Reconciliation Error: ", error);
        return { success: false, error: "Failed to save daily ledger securely." };
      }
    }
  };
}