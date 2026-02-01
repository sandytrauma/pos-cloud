import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats numbers into INR Currency (₹)
 */
export const formatINR = (amount: number | string) => {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
};

/**
 * Calculates GST components for Inclusive pricing (5%)
 */
export const calculateGstBreakdown = (totalAmount: number) => {
  const gstRate = 0.05; 
  const netAmount = totalAmount / (1 + gstRate);
  const gstAmount = totalAmount - netAmount;

  return {
    netAmount: netAmount.toFixed(2),
    gstAmount: gstAmount.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
  };
};