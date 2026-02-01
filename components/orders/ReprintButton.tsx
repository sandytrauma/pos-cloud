// components/orders/ReprintButton.tsx
"use client";

import { Printer } from "lucide-react";
import { formatINR } from "@/lib/utils";

export default function ReprintButton({ order }: { order: any }) {
  const handleReprint = () => {
    const printWindow = window.open('', '_blank', 'width=300,height=600');
    if (!printWindow) return;

    const receiptHtml = `
      <html>
        <head>
          <style>
            @page { size: 80mm 200mm; margin: 0; }
            body { font-family: 'Courier New', monospace; width: 72mm; padding: 10px; font-size: 12px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .flex { display: flex; justify-content: space-between; }
            .hr { border-bottom: 1px dashed #000; margin: 5px 0; }
          </style>
        </head>
        <body>
          <div class="center bold">*** REPRINT ***</div>
          <div class="center bold" style="font-size: 16px;">KITCHEN CLOUD</div>
          <div class="hr"></div>
          <div class="flex"><span>Token:</span> <span class="bold">${order.tokenNumber}</span></div>
          <div class="flex"><span>Source:</span> <span>${order.source}</span></div>
          <div class="hr"></div>
          <div class="center">Items list recorded in DB</div>
          <div class="hr"></div>
          <div class="flex bold"><span>TOTAL:</span> <span>${formatINR(Number(order.totalAmount))}</span></div>
          <div class="center" style="margin-top: 15px;">Original: ${new Date(order.createdAt).toLocaleString()}</div>
        </body>
      </html>
    `;
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <button 
      onClick={handleReprint}
      className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:bg-amber-500 hover:text-slate-950 transition-all"
      title="Reprint Receipt"
    >
      <Printer size={18} />
    </button>
  );
}