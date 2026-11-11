// Location: app/page.tsx
import { db } from "@/db";
import { menuItems } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import HomeClient from "@/app/HomeClient";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await auth();
  
  // 🌟 FIX: Route authenticated users directly to the operational dashboard
  if (session?.user) {
    redirect("/dashboard");
  }

  // Fetch active dishes dynamically from PostgreSQL for public visitors
  const rawSpecials = await db
    .select()
    .from(menuItems)
    .where(eq(menuItems.isAvailable, true))
    .orderBy(desc(menuItems.createdAt))
    .catch((err) => {
      console.error("Database Core Fetch Error -> Specials:", err);
      return [];
    });

  const serializedSpecials = rawSpecials.map((item) => ({
    id: Number(item.id),
    name: item.name || "Chef's Creation",
    price: Number(item.price) || 0,
    description: item.description || "Crafted with signature fresh ingredients and artisanal spices.",
    image: item.image || null,
  }));

  return (
    <HomeClient 
      hasSession={false}
      specials={serializedSpecials}
      branding={{
        appNamePrefix: "URBAN",
        appNameSuffix: "AMBROSIA",
        tagline: "Gourmet Flavors. Elevated Living.",
        subTagline: "Part of Ethereal Kitchen Cloud",
        parentCompany: "A Brand of Ethereal Inn Hospitality LLP",
        descriptionText: "Experience modern culinary mastery crafted with farm-fresh ingredients, cloud kitchen precision, and hospitality excellence.",
        whatsAppContactNumber: "919654686759",
        physicalAddress: "Urban Ambrosia Culinary Hub, Ethereal Kitchen Cloud, New Delhi, India",
      }}
    />
  );
}