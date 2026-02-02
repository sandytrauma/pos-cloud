"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useTransition } from "react";

export default function OrderSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }

    startTransition(() => {
      router.replace(`/dashboard/orders?${params.toString()}`);
    });
  }

  return (
    <div className="relative group w-full md:w-80">
      <Search 
        className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
          isPending ? "text-amber-500 animate-pulse" : "text-slate-500 group-focus-within:text-amber-500"
        }`} 
        size={18} 
      />
      <input
        onChange={(e) => handleSearch(e.target.value)}
        placeholder="Search phone or token..."
        defaultValue={defaultValue}
        className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-sm outline-none transition-all focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 text-amber-500 placeholder:text-slate-600 font-medium"
      />
    </div>
  );
}