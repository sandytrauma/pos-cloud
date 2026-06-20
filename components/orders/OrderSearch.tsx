"use client";

import { Search, Calendar, X } from "lucide-react"; 
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface OrderSearchProps {
  /** Initial text query values provided by server side data fetching models */
  defaultValue?: string;
  /** Initial start calendar execution parameter string */
  from?: string;
  /** Initial boundary end filter snapshot parameters string */
  to?: string;
  /** Optional white-label callback override to bypass or extend direct Next.js router hooks */
  onSearchChange?: (type: 'query' | 'from' | 'to', value: string) => void;
  /** Optional white-label callback override to clear active client states manually */
  onClear?: () => void;
}

export default function OrderSearch({ 
  defaultValue = "", 
  from = "", 
  to = "",
  onSearchChange,
  onClear
}: OrderSearchProps) {
  // Gracefully fallback to standard navigation engines if custom overrides are omitted
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Handle parameter mutations safely
  const handleSearch = useDebouncedCallback((term: string, type: 'query' | 'from' | 'to') => {
    if (onSearchChange) {
      onSearchChange(type, term);
      return;
    }

    // Direct Next.js router fallback execution pipeline
    if (searchParams) {
      const params = new URLSearchParams(searchParams.toString());
      if (term) {
        params.set(type, term);
      } else {
        params.delete(type);
      }
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, 300);

  const clearFilters = () => {
    if (onClear) {
      onClear();
      return;
    }
    router.replace(pathname);
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto relative z-10">
      {/* Text Search */}
      <div className="relative w-full md:w-64">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Search Phone or Token..."
          defaultValue={defaultValue}
          onChange={(e) => handleSearch(e.target.value, 'query')}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-white text-sm focus:border-amber-500 outline-none transition-all placeholder:text-slate-600"
        />
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        {/* Date From */}
        <div className="relative flex-1 md:w-40">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
          <input
            type="date"
            defaultValue={from}
            onChange={(e) => handleSearch(e.target.value, 'from')}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-10 pr-3 text-white text-[10px] focus:border-amber-500 outline-none transition-all uppercase font-bold [color-scheme:dark]"
          />
        </div>

        {/* Date To */}
        <div className="relative flex-1 md:w-40">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" size={14} />
          <input
            type="date"
            defaultValue={to}
            onChange={(e) => handleSearch(e.target.value, 'to')}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl py-3 pl-10 pr-3 text-white text-[10px] focus:border-amber-500 outline-none transition-all uppercase font-bold [color-scheme:dark]"
          />
        </div>

        {/* Clear Button - helpful for 7" screens to reset quickly */}
        {(defaultValue || from || to) && (
          <button 
            type="button"
            onClick={clearFilters}
            className="p-3 bg-slate-800 text-slate-400 rounded-2xl hover:text-white transition-colors active:scale-90"
            title="Clear all filters"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}