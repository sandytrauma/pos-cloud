// Location: lib/actions/orderFactory.ts

import { and, eq, lt, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface WhiteLabelOrderConfig {
  db: any;
  ordersTable: any;
  orderItemsTable: any;
  usersTable?: any;
  customerProfilesTable?: any;
  customerAnalyticsTable?: any;
  dashboardBasePath?: string;
}

export interface PosOrderPayload {
  customerPhone?: string;
  userId?: number | null;
  customerName?: string;
  items: { itemName: string; quantity: number; price: number }[];
  subtotal: number;
  discount?: number;
  gstAmount: number;
  netAmount: number;
  loyaltyPointsEarned?: number;
}

export interface PosReceiptData {
  tokenNumber: string;
  date: string;
  time: string;
  items: { itemName: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  gstAmount: number;
  total: number;
  customerName?: string;
  loyaltyPointsEarned: number;
}

export function createOrderActions({
  db,
  ordersTable,
  orderItemsTable,
  usersTable,
  customerProfilesTable,
  customerAnalyticsTable,
  dashboardBasePath = "/dashboard"
}: WhiteLabelOrderConfig) {

  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  const internalArchiveOldOrders = async () => {
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await db.update(ordersTable)
        .set({ status: 'archived' }) 
        .where(
          and(
            lt(ordersTable.createdAt, fortyEightHoursAgo),
            sql`${ordersTable.status} IN ('COMPLETED', 'CANCELLED')`
          )
        );
      return { success: true };
    } catch (error) {
      console.error("Archive Error:", error);
      return { success: false };
    }
  };

  return {
    createPosOrder: async (formData: PosOrderPayload) => {
      try {
        const now = new Date();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastOrderResult = await db
          .select({ maxToken: sql<number>`max(cast(substring(${ordersTable.tokenNumber}, 4) as integer))` })
          .from(ordersTable)
          .where(gte(ordersTable.createdAt, today)); 

        const nextTokenInt = (lastOrderResult[0]?.maxToken || 0) + 1;
        const formattedToken = `TK-${nextTokenInt.toString().padStart(3, '0')}`;

        // 1. Resolve or Auto-Provision Customer Account
        let resolvedUserId: number | null = formData.userId ?? null;

        if (!resolvedUserId && formData.customerPhone && usersTable && customerProfilesTable) {
          const cleanPhone = formData.customerPhone.trim();

          const existingProfile = await db
            .select({ userId: customerProfilesTable.userId })
            .from(customerProfilesTable)
            .where(eq(customerProfilesTable.phone, cleanPhone))
            .limit(1);

          if (existingProfile.length > 0 && existingProfile[0]?.userId) {
            resolvedUserId = existingProfile[0].userId;
          } else {
            const defaultName = formData.customerName?.trim() || `Customer ${cleanPhone.slice(-4)}`;
            
            const [newUser] = await db
              .insert(usersTable)
              .values({
                name: defaultName,
                createdAt: now,
                updatedAt: now,
              })
              .returning();

            if (newUser?.id) {
              resolvedUserId = newUser.id;

              await db.insert(customerProfilesTable).values({
                userId: resolvedUserId,
                phone: cleanPhone,
                customerType: "REGULAR",
                loyaltyPoints: 0,
                isLoyal: false,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }

        // 2. Create Master Order Record with Resolved Customer Foreign Key
        const [newOrder] = await db.insert(ordersTable).values({
          tokenNumber: formattedToken,
          source: "POS",
          userId: resolvedUserId,
          totalAmount: (formData.subtotal || 0).toFixed(2),
          gstAmount: (formData.gstAmount || 0).toFixed(2),
          netAmount: (formData.netAmount || 0).toFixed(2),
          customerPhone: formData.customerPhone?.trim() || null,
          status: "RECEIVED",
          createdAt: now,
          updatedAt: now,
        }).returning();

        // 3. Insert Line Items
        if (formData.items.length > 0) {
          const itemsToInsert = formData.items.map((item) => ({
            orderId: newOrder.id,
            itemName: item.itemName,
            quantity: item.quantity,
            price: Number(item.price || 0).toFixed(2),
          }));
          await db.insert(orderItemsTable).values(itemsToInsert);
        }

        // 4. Update Customer Analytics & Loyalty Rewards
        if (resolvedUserId && customerAnalyticsTable) {
          const netSpentStr = (formData.netAmount || 0).toFixed(2);

          await db
            .insert(customerAnalyticsTable)
            .values({
              userId: resolvedUserId,
              totalVisits: 1,
              totalSpent: netSpentStr,
              averageOrderValue: netSpentStr,
              lastVisit: now,
              firstVisit: now,
              updatedAt: now,
            })
            .onConflictDoUpdate({
              target: customerAnalyticsTable.userId,
              set: {
                totalVisits: sql`${customerAnalyticsTable.totalVisits} + 1`,
                totalSpent: sql`${customerAnalyticsTable.totalSpent} + ${netSpentStr}`,
                lastVisit: now,
                updatedAt: now,
              },
            });
        }

        if (resolvedUserId && customerProfilesTable && (formData.loyaltyPointsEarned || 0) > 0) {
          await db
            .update(customerProfilesTable)
            .set({
              loyaltyPoints: sql`${customerProfilesTable.loyaltyPoints} + ${formData.loyaltyPointsEarned}`,
              updatedAt: now,
            })
            .where(eq(customerProfilesTable.userId, resolvedUserId));
        }

        await internalArchiveOldOrders();

        revalidatePath(`${basePath}`);
        revalidatePath(`${basePath}/orders`);
        revalidatePath(`${basePath}/customers`);
        revalidatePath(`${basePath}/reconciliation`);

        const receipt: PosReceiptData = {
          tokenNumber: formattedToken,
          date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
          time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
          items: formData.items,
          subtotal: formData.subtotal,
          discount: formData.discount ?? 0,
          gstAmount: formData.gstAmount,
          total: formData.netAmount,
          customerName: formData.customerName,
          loyaltyPointsEarned: formData.loyaltyPointsEarned ?? 0,
        };

        return {
          success: true,
          orderId: newOrder.id,
          token: newOrder.tokenNumber,
          receipt,
        };
      } catch (error) {
        console.error("Order Creation Error:", error);
        return { success: false, error: "Failed to create order" };
      }
    },

    updateOrderStatus: async (
      orderId: number, 
      status: "RECEIVED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED" | "archived"
    ) => {
      try {
        await db.update(ordersTable)
          .set({ status, updatedAt: new Date() })
          .where(eq(ordersTable.id, orderId));

        revalidatePath(`${basePath}`);
        revalidatePath(`${basePath}/orders`);
        revalidatePath(`${basePath}/customers`);
        revalidatePath(`${basePath}/reconciliation`);
        return { success: true };
      } catch (error) {
        console.error("Update Status Error:", error);
        return { success: false, error: "Failed to update order status" };
      }
    },

    archiveOldOrders: internalArchiveOldOrders
  };
}