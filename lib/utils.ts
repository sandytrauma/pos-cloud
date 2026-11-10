// Location: lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines Tailwind classes safely with conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats any number or string into proper Indian Rupee currency layout (₹)
 */
export function formatINR(amount: number | string) {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(numericAmount || 0);
}

/**
 * Calculates a clean backward GST breakdown based on a total bill amount.
 */
export function calculateGstBreakdown(
  totalAmount: number | string, 
  dynamicGstRate: number | string = 5
) {
  const total = typeof totalAmount === "string" ? parseFloat(totalAmount) : totalAmount;
  const numericGstPercentage = typeof dynamicGstRate === "string" ? parseFloat(dynamicGstRate) : dynamicGstRate;
  const gstDecimal = (numericGstPercentage || 5) / 100;
  
  const netAmount = total / (1 + gstDecimal);
  const gstAmount = total - netAmount;
  
  return {
    appliedRate: `${numericGstPercentage}%`,
    netAmount: netAmount.toFixed(2),
    gstAmount: gstAmount.toFixed(2),
    cgst: (gstAmount / 2).toFixed(2),
    sgst: (gstAmount / 2).toFixed(2),
  };
}