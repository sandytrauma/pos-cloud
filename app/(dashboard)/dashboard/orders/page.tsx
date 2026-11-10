import { db } from "@/db";
import { orders } from "@/db/schema";
import { desc } from "drizzle-orm";
import OrdersHistoryViewLayout from "./OrdersHistoryViewLayout";

export const dynamic = "force-dynamic";

interface OrdersHistoryPageProps {
  searchParams?: Promise<{
    page?: string;
    limit?: string;
  }>;
}

export default async function OrdersHistoryPage({ searchParams }: OrdersHistoryPageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const page = Math.max(1, parseInt(resolvedParams.page || "1", 10));
  const limit = Math.min(100, Math.max(10, parseInt(resolvedParams.limit || "50", 10)));
  const offset = (page - 1) * limit;

  const fetchedOrders = await db.query.orders.findMany({
    orderBy: [desc(orders.createdAt)],
    limit,
    offset,
    with: {
      items: true,
    },
  }).catch((err) => {
    console.error("Drizzle Order History Load Failure:", err);
    return [];
  });

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