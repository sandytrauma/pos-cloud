// Location: lib/actions/orders.ts
"use server";

import { db } from "@/db";
import { 
  orders, 
  orderItems, 
  users, 
  customerProfiles, 
  customerAnalytics 
} from "@/db/schema";
import { 
  createOrderActions, 
  type PosOrderPayload, 
  type PosReceiptData 
} from "./orderFactory";



// 1. Initialize the engine inside an isolated instance
const actionsInstance = createOrderActions({
  db,
  ordersTable: orders,
  orderItemsTable: orderItems,
  usersTable: users,
  customerProfilesTable: customerProfiles,
  customerAnalyticsTable: customerAnalytics,
  dashboardBasePath: "/dashboard",
});

// 2. Pure Server Action functions only
export async function createPosOrder(formData: PosOrderPayload): Promise<{
  success: boolean;
  orderId?: number;
  token?: string;
  receipt?: PosReceiptData;
  error?: string;
}> {
  return actionsInstance.createPosOrder(formData);
}

export async function calculateGstBreakdown(subtotal: number, rate: number = 5) {
  const gstAmount = (subtotal * rate) / 100;
  const netAmount = subtotal + gstAmount;
  return { netAmount, gstAmount };
}

export async function updateOrderStatus(
  orderId: number, 
  status: "RECEIVED" | "PREPARING" | "READY" | "COMPLETED" | "CANCELLED" | "archived"
) {
  return actionsInstance.updateOrderStatus(orderId, status);
}

export async function completeOrderAction() {
  return actionsInstance.archiveOldOrders();
}