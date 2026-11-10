import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { assertRole } from "@/lib/security";

interface WhiteLabelSettingsConfig {
  db: any;
  usersTable: any;
  dashboardBasePath?: string;
}

export function createSettingsActions({
  db,
  usersTable,
  dashboardBasePath = "/dashboard"
}: WhiteLabelSettingsConfig) {

  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  return {
    /**
     * 1. Update Core Store Profile Settings (Admin Only)
     */
    updateStoreSettings: async (formData: FormData) => {
      try {
        const currentUser = await assertRole(["admin"]);
        const currentUserId = Number(currentUser.id);

        const storeName = (formData.get("storeName") as string)?.trim();
        if (!storeName) {
          return { success: false, error: "Store name is required." };
        }

        await db.update(usersTable)
          .set({ name: storeName, updatedAt: new Date() })
          .where(eq(usersTable.id, currentUserId));

        revalidatePath(`${basePath}/settings`);
        return { success: true };
      } catch (error: any) {
        console.error("Update Store Settings Error: ", error);
        return { success: false, error: error.message || "Unauthorized or database error occurred." };
      }
    },

    /**
     * 2. Toggle Store Operational Status (Admin Only)
     */
    toggleMaintenanceMode: async (_ignoredUserId: string | number, isClosed: boolean) => {
      try {
        const currentUser = await assertRole(["admin"]);
        const currentUserId = Number(currentUser.id);

        await db.update(usersTable)
          .set({ 
            role: isClosed ? "maintenance" : "admin",
            updatedAt: new Date()
          })
          .where(eq(usersTable.id, currentUserId));

        revalidatePath("/", "layout");
        revalidatePath(`${basePath}`, "layout");
        
        return { success: true };
      } catch (error: any) {
        console.error("Toggle Maintenance Mode Error: ", error);
        return { success: false, error: error.message || "Unauthorized: Admin privileges required." };
      }
    }
  };
}
