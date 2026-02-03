import { db } from "@/db";
import PosClient from "@/components/pos/PosClient";

export const dynamic = "force-dynamic";

export default async function PosPage() {
  // Fetch menu with items included
  const menuData = await db.query.categories.findMany({
    with: {
      items: true,
    },
    orderBy: (cat, { asc }) => [asc(cat.order)],
  });

  return <PosClient initialMenu={menuData} />;
}