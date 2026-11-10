// Location: app/page.tsx
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

import { auth } from "@/lib/auth";
import HomeClient from "@/app/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  const hasActiveSession = !!session?.user;

  // Fetch active dishes dynamically from PostgreSQL
  const rawSpecials = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.isAvailable, true))
    .orderBy(desc(menuItems.createdAt))
    .catch((err) => {
      console.error("Database Core Fetch Error -> Specials:", err);
      return [];
    });

  // Clean serialization across network boundaries
  const serializedSpecials = rawSpecials.map((item) => ({
    id: Number(item.id),
    name: item.name || "Chef's Creation",
    price: Number(item.price) || 0,
    description: item.description || "Crafted with signature fresh ingredients and artisanal spices.",
    image: item.image || null,
  }));

  return (
    <HomeClient 
      hasSession={hasActiveSession}
      specials={serializedSpecials}
      branding={{
        appNamePrefix: "URBAN",
        appNameSuffix: "AMBROSIA",
        tagline: "Gourmet Flavors. Elevated Living.",
        subTagline: "Part of Ethereal Kitchen Cloud",
        parentCompany: "A Brand of Ethereal Inn Hospitality LLP",
        descriptionText: "Experience modern culinary mastery crafted with farm-fresh ingredients, cloud kitchen precision, and hospitality excellence.",
        whatsAppContactNumber: "919876543210",
        physicalAddress: "Urban Ambrosia Culinary Hub, Ethereal Kitchen Cloud, New Delhi, India",
      }}
    />
  );
}