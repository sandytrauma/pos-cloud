"use client";

import { Printer } from "lucide-react";
import { formatINR } from "@/lib/utils";

interface ReprintButtonProps {
  /** The full historical order payload mapping context */
  order: {
    id: number;
    tokenNumber: string;
    source: string | null;
    status: string;
    totalAmount: string | number;
    createdAt: string | Date;
    items?: { itemName: string; quantity: number; price: string | number }[];
  };
  /** Optional branding string for custom merchant header displays (Defaults to "KITCHEN CLOUD") */
  brandName?: string;
}

export default function ReprintButton({ order, brandName = "KITCHEN CLOUD" }: ReprintButtonProps) {
  const handleReprint = () => {
    const itemsToPrint = order.items || [];

    const itemsHtml = itemsToPrint.length > 0 
      ? itemsToPrint.map((item: any) => `
          <div class="flex" style="margin-bottom: 4px;">
            <span style="flex: 1; padding-right: 4px;">${item.itemName} x${item.quantity}</span>
            <span style="min-width: 65px; text-align: right;">${formatINR(Number(item.price) * item.quantity)}</span>
          </div>
        `).join('')
      : '<div class="center" style="color: red; font-weight: bold;">! NO ITEMS DATA !</div>';

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Order Receipt Block Reprint</title>
          <style>
            @page { size: 80mm 200mm; margin: 0; }
            body { font-family: 'Courier New', monospace; width: 72mm; padding: 10px; font-size: 12px; color: #000; background-color: #fff; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .flex { display: flex; justify-content: space-between; align-items: flex-start; }
            .hr { border-bottom: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="center bold">*** REPRINT ***</div>
          <div class="center bold" style="font-size: 18px; margin-top: 4px; text-transform: uppercase;">${brandName}</div>
          <div class="hr"></div>
          
          <div class="flex"><span>Token:</span> <span class="bold">#${order.tokenNumber}</span></div>
          <div class="flex"><span>Source:</span> <span>${order.source || "POS"}</span></div>
          <div class="flex"><span>Status:</span> <span>${order.status}</span></div>
          
          <div class="hr"></div>
          <div class="bold" style="font-size: 10px; margin-bottom: 5px; text-decoration: underline;">ORDER ITEMS</div>
          
          <div class="items-container">
            ${itemsHtml}
          </div>
          
          <div class="hr"></div>
          <div class="flex bold" style="font-size: 14px;">
            <span>TOTAL:</span> 
            <span>${formatINR(Number(order.totalAmount))}</span>
          </div>
          
          <div class="hr"></div>
          <div class="center" style="font-size: 10px; margin-top: 10px;">
            Order Date: ${new Date(order.createdAt).toLocaleString()}
          </div>
          <div class="center bold" style="margin-top: 5px; font-size: 10px;">
            --- THANK YOU ---
          </div>
        </body>
      </html>
    `;

    // Open an isolated system window thread task block for the receipt payload
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      
      // Delay helps mobile tablets and slower physical thermal printers render styles correctly
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
  };

  return (
    <button 
      type="button"
      onClick={handleReprint} 
      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-sm active:scale-90"
      title="Reprint Bill Receipt"
    >
      <Printer size={18} />
    </button>
  );
}