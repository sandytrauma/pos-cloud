// Location: app/(dashboard)/dashboard/menu/page.tsx
import { db } from "@/db";
import { categories, menuItems } from "@/db/schema";
import { desc } from "drizzle-orm";
import { addCategoryAction, addMenuItemAction, updateMenuItemAction } from "@/lib/actions/menu";
import MenuClientViewLayout from "./MenuClientViewLayout";

export const dynamic = "force-dynamic";

// Drizzle config mapping object payload
const config = { db, menuItemsTable: menuItems, categoriesTable: categories };

export default async function MenuDashboardPage() {
  const dbCategories = await db.select().from(categories).orderBy(categories.order);
  const dbMenuItems = await db.select().from(menuItems).orderBy(desc(menuItems.createdAt));

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-10 text-white">
      {/* 🌟 FIXED: Hand down flat, top-level static functional references to break recursion */}
      <MenuClientViewLayout
        categories={dbCategories}
        menuItems={dbMenuItems}
        onAddCategory={handleAddCategoryProxy}
        onAddMenuItem={handleAddMenuItemProxy}
        onUpdateMenuItem={handleUpdateMenuItemProxy}
      />
    </div>
  );
}

/**
 * ============================================================================
 * 🌟 FIXED: STANDALONE TOP-LEVEL SERVER ACTIONS (OUTSIDE MAIN COMPONENT STREAM)
 * These compile cleanly into isolated RPC endpoints without stack bloating.
 * ============================================================================
 */

export async function handleAddCategoryProxy(name: string) {
  "use server";
  return addCategoryAction(config, name);
}

export async function handleAddMenuItemProxy(formData: FormData) {
  "use server";
  return addMenuItemAction(config, formData);
}

export async function handleUpdateMenuItemProxy(formData: FormData) {
  "use server";
  return updateMenuItemAction(config, formData);
}