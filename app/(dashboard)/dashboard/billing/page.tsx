// Location: app/(dashboard)/dashboard/billing/page.tsx
"use server"; // 🌟 CRITICAL: Registers the standalone named functions below as valid network endpoints

import { db } from "@/db";
import { 
  orders as ordersTable, 
  stockLogs as stockLogsTable, 
  inventory as inventoryTable, 
  reconciliations as reconciliationsTable 
} from "@/db/schema"; 
import { createReconciliationActions } from "@/lib/actions/reconciliation"; 
import ReconciliationPage from "./ReconciliationPage";

// 1. Module-level engine loader to fetch factory utilities securely
async function getEngine() {
  return await createReconciliationActions({
    db,
    ordersTable,
    stockLogsTable,
    inventoryTable,
    reconciliationsTable,
    dashboardBasePath: "/dashboard"
  });
}

/**
 * 🌟 FIXED: Standalone Named Exports
 * These live at the absolute top-level of the file so the Next.js compiler 
 * can scan them statically and generate secure POST routes flawlessly.
 */
export async function runGetSummary() {
  const engine = await getEngine();
  return await engine.getDailySummary();
}

export async function runSaveReconciliation(payload: {
  revenue: number;
  inventoryExpense: number;
  orderCount: number;
  staffExp: number;
  miscExp: number;
  netEarning: number;
  staffName: string;
}) {
  const engine = await getEngine();
  return await engine.saveReconciliationAction(payload);
}

/**
 * 🌟 DEFAULT EXPORT (THE SERVER PAGE COMPONENT)
 * It now simply passes the pre-registered static function references down as props.
 * There are no more local closures inside it to trip up the compiler!
 */
export default async function BillingPage() {
  return (
    <ReconciliationPage 
      getDailySummaryAction={runGetSummary}
      saveReconciliationAction={runSaveReconciliation}
    />
  );
}