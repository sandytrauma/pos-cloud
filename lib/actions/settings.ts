// Location: lib/actions/settings.ts
"use server"; // 🌟 Strict boundary marker for static compilation analysis

import { db } from "@/db";
import { users } from "@/db/schema";
import { createSettingsActions } from "./settingsFactory";

// 1. Initialize the white-label operations instance synchronously
const settingsInstance = createSettingsActions({
  db,
  usersTable: users,
  dashboardBasePath: "/dashboard"
});

// 2. ✅ STATIC NAMED EXPORTS: Guarantees your page components import real, trackable endpoints
export async function updateStoreSettings(formData: FormData) {
  return settingsInstance.updateStoreSettings(formData);
}

export async function toggleMaintenanceMode(userId: string | number, isClosed: boolean) {
  return settingsInstance.toggleMaintenanceMode(userId, isClosed);
}