// Location: app/(dashboard)/dashboard/menu/page.tsx
import { db } from "@/db";
import { categories, menuItems } from "@/db/schema";
import { desc } from "drizzle-orm";
import { 
  addCategoryAction, 
  addMenuItemAction, 
  updateMenuItemAction,
  toggleItemAvailabilityAction,
  deleteMenuItemAction
} from "@/lib/actions/menu";
import MenuClientViewLayout from "./MenuClientViewLayout";

export const dynamic = "force-dynamic";

const config = { db, menuItemsTable: menuItems, categoriesTable: categories };

export default async function MenuDashboardPage() {
  const dbCategories = await db.select().from(categories).orderBy(categories.order);
  const dbMenuItems = await db.select().from(menuItems).orderBy(desc(menuItems.createdAt));

  const serializedCategories = dbCategories.map((c) => ({
    id: c.id,
    name: c.name,
    order: c.order,
  }));

  const serializedItems = dbMenuItems.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    name: item.name,
    description: item.description,
    price: Number(item.price),
    costPrice: item.costPrice ? Number(item.costPrice) : 0,
    isAvailable: item.isAvailable !== false,
  }));

  return (
    <div className="w-full text-white">
      <MenuClientViewLayout
        categories={serializedCategories}
        menuItems={serializedItems}
        onAddCategory={handleAddCategoryProxy}
        onAddMenuItem={handleAddMenuItemProxy}
        onUpdateMenuItem={handleUpdateMenuItemProxy}
        onToggleAvailability={handleToggleAvailabilityProxy}
        onDeleteMenuItem={handleDeleteMenuItemProxy}
      />
    </div>
  );
}

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

export async function handleToggleAvailabilityProxy(id: number, isAvailable: boolean) {
  "use server";
  return toggleItemAvailabilityAction(config, id, isAvailable);
}

export async function handleDeleteMenuItemProxy(id: number) {
  "use server";
  return deleteMenuItemAction(config, id);
}