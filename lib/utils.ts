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
 * Optimized for white-label scaling with dynamic rate adjustments.
 * * @param totalAmount - Gross amount paid by the customer
 * @param dynamicGstRate - Percentage value (e.g., pass 5 for 5%, 18 for 18%). Defaults to 5.
 */
export function calculateGstBreakdown(
  totalAmount: number | string, 
  dynamicGstRate: number | string = 5
) {
  const total = typeof totalAmount === "string" ? parseFloat(totalAmount) : totalAmount;
  
  // 1. Convert rate into decimal safely (handles string inputs like "5" or "18.00")
  const numericGstPercentage = typeof dynamicGstRate === "string" ? parseFloat(dynamicGstRate) : dynamicGstRate;
  const gstDecimal = (numericGstPercentage || 5) / 100; // e.g., 5 / 100 = 0.05
  
  // 2. Backward Tax Calculations
  const netAmount = total / (1 + gstDecimal);
  const gstAmount = total - netAmount;
  
  return {
    appliedRate: `${numericGstPercentage}%`,
    netAmount: netAmount.toFixed(2),
    gstAmount: gstAmount.toFixed(2),
    cgst: (gstAmount / 2).toFixed(2), // Central GST Split
    sgst: (gstAmount / 2).toFixed(2), // State GST Split
  };
}