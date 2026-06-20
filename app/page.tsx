// Location: app/page.tsx
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import HomeClient from "./HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Fetch active dishes dynamically from Neon Postgres
  const rawSpecials = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.isAvailable, true))
    .orderBy(desc(menuItems.createdAt))
    .catch((err) => {
      console.error("Database Core Fetch Error -> Specials:", err);
      return [];
    });

  // Serialize records cleanly for the network bridge boundary pass
  const serializedSpecials = rawSpecials.map((item) => ({
    id: Number(item.id),
    name: item.name || "Chef's Creation",
    price: Number(item.price) || 0,
    description: item.description || "Crafted with our signature fresh ingredients and premium spices.",
    image: item.image || null, // Captures custom database image tokens if present
  }));

  const hasActiveSession = false; 

  return (
    <HomeClient 
      hasSession={hasActiveSession}
      specials={serializedSpecials}
      branding={{
        appNamePrefix: "ETHEREAL-KITCHEN",
        appNameSuffix: "CLOUD",
        tagline: "Freshly Made, Purely Served.",
      }}
    />
  );
}