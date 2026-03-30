"use client";

import { Printer } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function ReprintButton({ order }: { order: any }) {
  const handleReprint = () => {
    // 1. Matches your 'ordersRelations' (items)
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
      <html>
        <head>
          <style>
            @page { size: 80mm 200mm; margin: 0; }
            body { font-family: 'Courier New', monospace; width: 72mm; padding: 10px; font-size: 12px; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .flex { display: flex; justify-content: space-between; align-items: flex-start; }
            .hr { border-bottom: 1px dashed #000; margin: 8px 0; }
          </style>
        </head>
        <body>
          <div class="center bold">*** REPRINT ***</div>
          <div class="center bold" style="font-size: 18px; margin-top: 4px;">KITCHEN CLOUD</div>
          <div class="hr"></div>
          
          <div class="flex"><span>Token:</span> <span class="bold">#${order.tokenNumber}</span></div>
          <div class="flex"><span>Source:</span> <span>${order.source}</span></div>
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

    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (printWindow) {
      printWindow.document.write(receiptHtml);
      printWindow.document.close();
      // Delay helps mobile tablets and slower printers render CSS correctly
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 300);
    }
  };

  return (
    <button 
      onClick={handleReprint} 
      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-amber-500 hover:text-slate-950 transition-all shadow-sm"
      title="Reprint Bill"
    >
      <Printer size={18} />
    </button>
  );
}