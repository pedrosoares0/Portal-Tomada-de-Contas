"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { Search } from "lucide-react";

export default function SpotlightSearch() {
  const { searchQuery, setSearchQuery } = useApp();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={`relative flex-1 w-full max-w-[820px] min-w-[200px] transition-all duration-300 ${
        isFocused ? "scale-[1.01]" : ""
      }`}
    >
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder="Procure por associação, convênio, município, comissão..."
        className={`w-full h-10 pl-11 pr-4 rounded-full text-xs font-semibold bg-[rgba(0,0,0,0.035)] backdrop-blur-md border border-black/[0.04] text-[#1d1d1f] outline-none transition-all duration-200 placeholder-[#86868b]/70 ${
          isFocused
            ? "bg-white! border-[#28cd41]/40 shadow-[0_0_0_3px_rgba(40,205,65,0.12),0_8px_24px_rgba(0,0,0,0.05)]"
            : "hover:bg-[rgba(0,0,0,0.05)] hover:border-black/[0.06]"
        }`}
      />
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        <Search
          className={`w-[15px] h-[15px] transition-colors duration-200 ${
            isFocused ? "text-[#28cd41]" : "text-[#86868b]"
          }`}
        />
      </div>
    </div>
  );
}
