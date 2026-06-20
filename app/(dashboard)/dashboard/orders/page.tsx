// Location: app/(dashboard)/dashboard/orders/page.tsx
import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";
import OrdersHistoryViewLayout from "./OrdersHistoryViewLayout";

export const dynamic = "force-dynamic";

export default async function OrdersHistoryPage() {
  // Fetch dynamic orders including their explicit relational items array mapping cleanly
  const fetchedOrders = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    with: {
      items: true,
    },
  }).catch((err) => {
    console.error("Drizzle Order History Load Failure:", err);
    return [];
  });

  // Serialize parameters safely across the server-to-client component bridge boundary
  const serializedOrders = fetchedOrders.map((order) => ({
    id: String(order.id),
    tokenNumber: order.tokenNumber,
    customerPhone: order.customerPhone || null,
    source: order.source || "POS",
    totalAmount: Number(order.totalAmount) || 0,
    gstAmount: Number(order.gstAmount) || 0,
    netAmount: Number(order.netAmount) || 0,
    status: order.status || "RECEIVED",
    createdAt: order.createdAt ? order.createdAt.toISOString() : new Date().toISOString(),
    items: (order.items || []).map((it) => ({
      id: String(it.id),
      itemName: it.itemName,
      quantity: Number(it.quantity) || 0,
      price: Number(it.price) || 0,
    })),
  }));

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-10 text-white">
      <OrdersHistoryViewLayout orders={serializedOrders} />
    </div>
  );
}