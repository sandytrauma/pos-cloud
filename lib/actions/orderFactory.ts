// Location: lib/actions/orderFactory.ts

import { and, eq, lt, gte, sql, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertAuthenticated } from "@/lib/security";
import { triggerOrderEvent } from "@/lib/pusher";

interface WhiteLabelOrderConfig {
  db: any;
  ordersTable: any;
  orderItemsTable: any;
  menuItemsTable?: any;
  usersTable?: any;
  customerProfilesTable?: any;
  customerAnalyticsTable?: any;
  dashboardBasePath?: string;
}

export interface PosOrderItem {
  itemName: string;
  quantity: number;
  price?: number;
  notes?: string;
}

export interface PosOrderPayload {
  customerPhone?: string;
  userId?: number | null;
  customerName?: string;
  items: PosOrderItem[];
  subtotal?: number;
  discount?: number;
  gstAmount?: number;
  netAmount?: number;
  loyaltyPointsEarned?: number;
  orderType?: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableNumber?: string;
  paymentMethod?: "CASH" | "UPI" | "CARD";
  amountTendered?: number;
  changeDue?: number;
}

export interface PosReceiptData {
  tokenNumber: string;
  date: string;
  time: string;
  items: { itemName: string; quantity: number; price: number; notes?: string }[];
  subtotal: number;
  discount: number;
  gstAmount: number;
  total: number;
  customerName?: string;
  loyaltyPointsEarned: number;
  orderType?: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  tableNumber?: string;
  paymentMethod?: "CASH" | "UPI" | "CARD";
  amountTendered?: number;
  changeDue?: number;
}

export function createOrderActions({
  db,
  ordersTable,
  orderItemsTable,
  menuItemsTable,
  usersTable,
  customerProfilesTable,
  customerAnalyticsTable,
  dashboardBasePath = "/dashboard"
}: WhiteLabelOrderConfig) {

  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  const internalArchiveOldOrders = async (tx?: any) => {
    try {
      const dbClient = tx || db;
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      await dbClient.update(ordersTable)
        .set({ status: 'archived', updatedAt: new Date() }) 
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
        await assertAuthenticated();

        if (!formData.items || formData.items.length === 0) {
          return { success: false, error: "Cannot create an empty order." };
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

        const result = await db.transaction(async (tx: any) => {
          // 1. Server-Authoritative Price Verification
          let verifiedSubtotal = 0;
          let verifiedItems: { itemName: string; quantity: number; price: number; notes?: string }[] = [];

          if (menuItemsTable) {
            const itemNames = formData.items.map(i => i.itemName);
            const dbDishes = await tx
              .select()
              .from(menuItemsTable)
              .where(inArray(menuItemsTable.name, itemNames));
            
            const priceMap = new Map<string, number>();
            dbDishes.forEach((d: any) => {
              priceMap.set(d.name, parseFloat(d.price || "0"));
            });

            verifiedItems = formData.items.map(item => {
              const verifiedPrice = priceMap.get(item.itemName) ?? (Number(item.price) || 0);
              const qty = Math.max(1, parseInt(item.quantity as any, 10) || 1);
              verifiedSubtotal += verifiedPrice * qty;
              return {
                itemName: item.itemName,
                quantity: qty,
                price: verifiedPrice,
                notes: item.notes?.trim() || undefined,
              };
            });
          } else {
            verifiedItems = formData.items.map(item => {
              const price = Math.max(0, Number(item.price) || 0);
              const qty = Math.max(1, parseInt(item.quantity as any, 10) || 1);
              verifiedSubtotal += price * qty;
              return { 
                itemName: item.itemName, 
                quantity: qty, 
                price,
                notes: item.notes?.trim() || undefined 
              };
            });
          }

          // 2. Resolve Customer Account and Verified Discounts
          let resolvedUserId: number | null = formData.userId ?? null;
          let isSubscriber = false;
          let isVip = false;

          if (formData.customerPhone && usersTable && customerProfilesTable) {
            const cleanPhone = formData.customerPhone.trim();

            const existingProfile = await tx
              .select({
                userId: customerProfilesTable.userId,
                customerType: customerProfilesTable.customerType,
                isLoyal: customerProfilesTable.isLoyal,
              })
              .from(customerProfilesTable)
              .where(eq(customerProfilesTable.phone, cleanPhone))
              .limit(1);

            if (existingProfile.length > 0 && existingProfile[0]?.userId) {
              resolvedUserId = existingProfile[0].userId;
              isSubscriber = existingProfile[0].customerType === "SUBSCRIBER";
              isVip = existingProfile[0].customerType === "VIP" || Boolean(existingProfile[0].isLoyal);
            } else {
              const defaultName = formData.customerName?.trim() || `Customer ${cleanPhone.slice(-4)}`;
              
              const [newUser] = await tx
                .insert(usersTable)
                .values({
                  name: defaultName,
                  role: "customer",
                  createdAt: now,
                  updatedAt: now,
                })
                .returning();

              if (newUser?.id) {
                resolvedUserId = newUser.id;

                await tx.insert(customerProfilesTable).values({
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

          let verifiedDiscount = 0;
          if (isSubscriber) {
            verifiedDiscount = verifiedSubtotal * 0.15;
          } else if (isVip) {
            verifiedDiscount = verifiedSubtotal * 0.10;
          }

          const discountedSubtotal = Math.max(0, verifiedSubtotal - verifiedDiscount);
          const verifiedGstAmount = (discountedSubtotal * 5.00) / 100;
          const verifiedNetAmount = discountedSubtotal + verifiedGstAmount;
          const verifiedLoyaltyPoints = resolvedUserId ? Math.floor(verifiedNetAmount * 0.10) : 0;

          // 3. Concurrency-Safe Daily Token Generation with Table/OrderType indicator
          const lastOrderResult = await tx
            .select({ 
              maxToken: sql<number>`COALESCE(max(cast(substring(${ordersTable.tokenNumber}, 4, 3) as integer)), 0)` 
            })
            .from(ordersTable)
            .where(gte(ordersTable.createdAt, today)); 

          const nextTokenInt = Number(lastOrderResult[0]?.maxToken || 0) + 1;
          const baseToken = `TK-${nextTokenInt.toString().padStart(3, '0')}`;
          
          let tokenTag = "";
          if (formData.tableNumber?.trim()) {
            tokenTag = ` [T-${formData.tableNumber.trim()}]`;
          } else if (formData.orderType === "TAKEAWAY") {
            tokenTag = ` [TAKEAWAY]`;
          } else if (formData.orderType === "DELIVERY") {
            tokenTag = ` [DELIVERY]`;
          }
          const formattedToken = `${baseToken}${tokenTag}`;

          // 4. Create Master Order Record
          const [newOrder] = await tx.insert(ordersTable).values({
            tokenNumber: formattedToken,
            source: "POS",
            userId: resolvedUserId,
            totalAmount: verifiedSubtotal.toFixed(2),
            gstAmount: verifiedGstAmount.toFixed(2),
            netAmount: verifiedNetAmount.toFixed(2),
            customerPhone: formData.customerPhone?.trim() || null,
            status: "RECEIVED",
            createdAt: now,
            updatedAt: now,
          }).returning();

          // 5. Insert Line Items with Kitchen Notes
          const itemsToInsert = verifiedItems.map((item) => ({
            orderId: newOrder.id,
            itemName: item.notes ? `${item.itemName} (${item.notes})` : item.itemName,
            quantity: item.quantity,
            price: item.price.toFixed(2),
          }));
          await tx.insert(orderItemsTable).values(itemsToInsert);

          // 6. Update Customer Analytics & Loyalty Rewards
          if (resolvedUserId && customerAnalyticsTable) {
            const netSpentStr = verifiedNetAmount.toFixed(2);

            await tx
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

          if (resolvedUserId && customerProfilesTable && verifiedLoyaltyPoints > 0) {
            await tx
              .update(customerProfilesTable)
              .set({
                loyaltyPoints: sql`${customerProfilesTable.loyaltyPoints} + ${verifiedLoyaltyPoints}`,
                updatedAt: now,
              })
              .where(eq(customerProfilesTable.userId, resolvedUserId));
          }

          await internalArchiveOldOrders(tx);

          const receipt: PosReceiptData = {
            tokenNumber: formattedToken,
            date: now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
            time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
            items: verifiedItems,
            subtotal: Number(verifiedSubtotal.toFixed(2)),
            discount: Number(verifiedDiscount.toFixed(2)),
            gstAmount: Number(verifiedGstAmount.toFixed(2)),
            total: Number(verifiedNetAmount.toFixed(2)),
            customerName: formData.customerName,
            loyaltyPointsEarned: verifiedLoyaltyPoints,
            orderType: formData.orderType || "DINE_IN",
            tableNumber: formData.tableNumber,
            paymentMethod: formData.paymentMethod || "CASH",
            amountTendered: formData.amountTendered,
            changeDue: formData.changeDue,
          };

          return {
            orderId: newOrder.id,
            token: newOrder.tokenNumber,
            receipt,
            items: verifiedItems,
            total: verifiedNetAmount,
          };
        });

        // 7. Dispatch Real-Time Pusher Event to Kitchen Displays
        await triggerOrderEvent("order:created", {
          id: result.orderId,
          tokenNumber: result.token,
          items: result.items,
          totalAmount: result.total,
          status: "RECEIVED",
          orderType: formData.orderType || "DINE_IN",
          tableNumber: formData.tableNumber,
          createdAt: new Date().toISOString(),
        });

        revalidatePath(`${basePath}`);
        revalidatePath(`${basePath}/orders`);
        revalidatePath(`${basePath}/customers`);
        revalidatePath(`${basePath}/reconciliation`);

        return {
          success: true,
          orderId: result.orderId,
          token: result.token,
          receipt: result.receipt,
        };
      } catch (error: any) {
        console.error("Order Creation Error:", error);
        return { success: false, error: error.message || "Failed to create order." };
      }
    },

    updateOrderStatus: async (
      orderId: number, 
      status: "RECEIVED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED" | "archived"
    ) => {
      try {
        await assertAuthenticated();

        await db.update(ordersTable)
          .set({ status, updatedAt: new Date() })
          .where(eq(ordersTable.id, orderId));

        await triggerOrderEvent("order:status_updated", {
          orderId,
          status,
          updatedAt: new Date().toISOString(),
        });

        revalidatePath(`${basePath}`);
        revalidatePath(`${basePath}/orders`);
        revalidatePath(`${basePath}/customers`);
        revalidatePath(`${basePath}/reconciliation`);
        return { success: true };
      } catch (error: any) {
        console.error("Update Status Error:", error);
        return { success: false, error: error.message || "Failed to update order status" };
      }
    },

    archiveOldOrders: internalArchiveOldOrders
  };
}