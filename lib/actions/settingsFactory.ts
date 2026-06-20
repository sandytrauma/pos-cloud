// Location: lib/actions/settingsFactory.ts
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

interface WhiteLabelSettingsConfig {
  db: any;                         // Accepts the tenant's Drizzle context instance
  usersTable: any;                 // Accepts the users schema table definition
  dashboardBasePath?: string;      // Optional base directory configuration override
}

/**
 * Generates runtime system settings and control actions for white-label distributions.
 * Synchronous initialization guarantees safe top-level named destructuring.
 */
export function createSettingsActions({
  db,
  usersTable,
  dashboardBasePath = "/dashboard"
}: WhiteLabelSettingsConfig) {

  // Clean trailing slash padding to guarantee precise routing keys
  const basePath = dashboardBasePath.endsWith("/") ? dashboardBasePath.slice(0, -1) : dashboardBasePath;

  return {
    /**
     * 1. Update Core Store Profile Settings
     */
    updateStoreSettings: async (formData: FormData) => {
      const storeName = formData.get("storeName") as string;
      const userId = Number(formData.get("userId"));

      if (isNaN(userId)) return { success: false, error: "Invalid User Identification reference" };

      try {
        await db.update(usersTable)
          .set({ name: storeName })
          .where(eq(usersTable.id, userId));

        revalidatePath(`${basePath}/settings`);
        return { success: true };
      } catch (error) {
        console.error("Update Store Settings Error: ", error);
        return { success: false, error: "Database error occurred while parsing profile variables." };
      }
    },

    /**
     * 2. Toggle Store Operational Status (Maintenance / Closed Lockouts)
     */
    toggleMaintenanceMode: async (userId: string | number, isClosed: boolean) => {
      const uid = Number(userId);
      if (isNaN(uid)) return { success: false };

      try {
        await db.update(usersTable)
          .set({ 
            role: isClosed ? "maintenance" : "admin" 
          })
          .where(eq(usersTable.id, uid));

        // Revalidate layout roots securely to trigger system-wide operational updates
        revalidatePath("/", "layout");
        revalidatePath(`${basePath}`, "layout");
        
        return { success: true };
      } catch (error) {
        console.error("Toggle Maintenance Mode Error: ", error);
        return { success: false };
      }
    }
  };
}