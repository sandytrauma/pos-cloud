// Location: lib/actions/orders.ts
"use server"; // 🌟 Keep this file strictly assigned to Next.js network routes

import { db } from "@/db";
import { orders, orderItems } from "@/db/schema";
import { createOrderActions } from "./orderFactory";

// 1. Initialize the engine inside an isolated instance
// 🌟 FIXED: Removed the inline calculation closure parameter to match your flat core factory design pattern
const actionsInstance = createOrderActions({
  db,
  ordersTable: orders,
  orderItemsTable: orderItems,
  dashboardBasePath: "/dashboard"
});

// 2. 🌟 STATIC NAMED EXPORTS: This guarantees the compiler maps your imports correctly!
export async function createPosOrder(formData: {
  customerPhone?: string;
  items: { itemName: string; quantity: number; price: number }[];
  gstAmount: number; // 🌟 FIXED: Accepts flat parameters computed safely before the network boundary pass
  netAmount: number;
}) {
  return actionsInstance.createPosOrder(formData);
}

/**
 * 🌟 FIXED: Isolated into a pure calculation utility function.
 * This completely removes the non-serializable closure error that was breaking your child UI views!
 */
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

// 🌟 FIXED: Safely hooks up the archival cleanup utility mapping 
export async function completeOrderAction() {
  return actionsInstance.archiveOldOrders();
}