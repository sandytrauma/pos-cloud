import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export function formatINR(amount: number | string) {
  const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(numericAmount || 0);
}

export function calculateGstBreakdown(totalAmount: number | string) {
  const total = typeof totalAmount === "string" ? parseFloat(totalAmount) : totalAmount;
  const gstRate = 0.05; // 5%
  
  const netAmount = total / (1 + gstRate);
  const gstAmount = total - netAmount;
  
  return {
    netAmount: netAmount.toFixed(2),
    gstAmount: gstAmount.toFixed(2),
    cgst: (gstAmount / 2).toFixed(2),
    sgst: (gstAmount / 2).toFixed(2),
  };
}