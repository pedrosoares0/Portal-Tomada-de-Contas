"use client";

import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { Folder, FolderOpen, ClipboardList, Clock, CheckCircle2, User } from "lucide-react";
import { motion } from "framer-motion";
import { getCellDisplayValue, PEOPLE } from "@/lib/utils";

interface FolderItem {
  id: string;
  label: string;
}

const folders: FolderItem[] = [
  { id: "all", label: "Geral" },
  { id: "2026", label: "2026" },
  { id: "2025", label: "2025" },
  { id: "2024", label: "2024" },
  { id: "2023", label: "2023" },
  { id: "2022", label: "2022" },
  { id: "2021", label: "2021" },
  { id: "2020-2016", label: "2020 - 2016" }
];

const statusFolders: FolderItem[] = [
  { id: "all", label: "Geral" },
  { id: "pending", label: "Pendentes" },
  { id: "finalized", label: "Finalizados" }
];

export default function YearFolders() {
  const {
    sheetData,
    localEdits,
    searchQuery,
    activeCommissionFilter,
    toggleCommissionFilter,
    activeFilters,
    activeYearFolder,
    setActiveYearFolder,
    activeStatusFolder,
    setActiveStatusFolder
  } = useApp();

  // 1. Rebuild base merged data (without folder filters) to compute counts
  const baseMergedData = useMemo(() => {
    let merged = sheetData.filter(row => {
      const convenio = String(row[0]);
      return !localEdits.deleted.includes(convenio);
    });

    merged = merged.map(row => {
      const convenio = String(row[0]);
      if (localEdits.updated[convenio]) {
        return localEdits.updated[convenio];
      }
      return row;
    });

    return [...merged, ...localEdits.added];
  }, [sheetData, localEdits]);

  // Apply search, column filters, and commission filter
  const coreFilteredData = useMemo(() => {
    const cleanQuery = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    return baseMergedData.filter(row => {
      // Search query filter
      let matchSearch = cleanQuery === "";
      if (!matchSearch) {
        for (let i = 0; i < 13; i++) {
          const cellVal = String(row[i] || "");
          const text = cellVal.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          if (text.includes(cleanQuery)) {
            matchSearch = true;
            break;
          }
        }
      }

      // Column filters
      let matchFilters = true;
      const colIndices = Object.keys(activeFilters).map(Number);
      for (const colIdx of colIndices) {
        const cellVal = getCellDisplayValue(row, colIdx);
        const allowedValues = activeFilters[colIdx];
        if (!allowedValues.includes(cellVal.trim())) {
          matchFilters = false;
          break;
        }
      }

      // Commission filter
      let matchCommission = true;
      if (activeCommissionFilter) {
        const commText = String(row[12] || "").trim();
        const obsText = String(row[11] || "").trim();
        const textToSearch = commText ? commText : obsText;
        const normSearch = textToSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const filterName = activeCommissionFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (filterName.includes("joao")) {
          if (!normSearch.includes("joao") || normSearch.includes("sena")) {
            matchCommission = false;
          }
        } else if (filterName.includes("irail")) {
          if (!normSearch.includes("irail")) {
            matchCommission = false;
          }
        } else if (filterName.includes("pedro")) {
          if (!normSearch.includes("pedro")) {
            matchCommission = false;
          }
        } else if (filterName.includes("pablo")) {
          if (!normSearch.includes("pablo")) {
            matchCommission = false;
          }
        } else {
          if (!normSearch.includes(filterName)) {
            matchCommission = false;
          }
        }
      }

      return matchSearch && matchFilters && matchCommission;
    });
  }, [baseMergedData, searchQuery, activeCommissionFilter, activeFilters]);

  // Compute dataset filtered for year folder calculations (depends on activeStatusFolder)
  const baseFilteredForYears = useMemo(() => {
    return coreFilteredData.filter(row => {
      let matchStatusFolder = true;
      if (activeStatusFolder !== "all") {
        const rowStatus = String(row[9] || "").trim().toLowerCase();
        const isFinalized = rowStatus.includes("finalizado") || rowStatus.includes("concluido");
        if (activeStatusFolder === "pending") {
          matchStatusFolder = !isFinalized;
        } else if (activeStatusFolder === "finalized") {
          matchStatusFolder = isFinalized;
        }
      }
      return matchStatusFolder;
    });
  }, [coreFilteredData, activeStatusFolder]);

  // Compute dataset filtered for status folder calculations (depends on activeYearFolder)
  const baseFilteredForStatus = useMemo(() => {
    return coreFilteredData.filter(row => {
      let matchYearFolder = true;
      if (activeYearFolder !== "all") {
        const rowYear = String(row[8] || "").trim();
        if (activeYearFolder === "2020-2016") {
          const yNum = parseInt(rowYear, 10);
          matchYearFolder = !isNaN(yNum) && yNum >= 2016 && yNum <= 2020;
        } else {
          matchYearFolder = rowYear === activeYearFolder;
        }
      }
      return matchYearFolder;
    });
  }, [coreFilteredData, activeYearFolder]);

  // Compute counts for Year folders
  const yearCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: baseFilteredForYears.length
    };

    folders.forEach(f => {
      if (f.id !== "all") counts[f.id] = 0;
    });

    baseFilteredForYears.forEach(row => {
      const yearStr = String(row[8] || "").trim();
      const yearNum = parseInt(yearStr, 10);

      if (!isNaN(yearNum) && yearNum >= 2016 && yearNum <= 2020) {
        counts["2020-2016"] = (counts["2020-2016"] || 0) + 1;
      }

      if (counts[yearStr] !== undefined) {
        counts[yearStr] += 1;
      }
    });

    return counts;
  }, [baseFilteredForYears]);

  // Compute counts for Status folders
  const statusCounts = useMemo(() => {
    let pendingCount = 0;
    let finalizedCount = 0;

    baseFilteredForStatus.forEach(row => {
      const rowStatus = String(row[9] || "").trim().toLowerCase();
      const isFinalized = rowStatus.includes("finalizado") || rowStatus.includes("concluido");
      if (isFinalized) {
        finalizedCount++;
      } else {
        pendingCount++;
      }
    });

    return {
      all: baseFilteredForStatus.length,
      pending: pendingCount,
      finalized: finalizedCount
    };
  }, [baseFilteredForStatus]);

  return (
    <div className="year-folders-container flex items-center justify-between w-full border-b border-black/[0.04] pt-8 -mt-4 pb-2 mb-1.5 overflow-x-auto custom-scrollbar flex-nowrap gap-4 select-none print:hidden">

      {/* Left side: Year Segmented Control */}
      <div className="flex p-0.5 bg-black/[0.03] border border-black/[0.02] rounded-[10px] items-center gap-0.5 flex-shrink-0 h-9">
        {folders.map(folder => {
          const isActive = activeYearFolder === folder.id;
          const count = yearCounts[folder.id] || 0;
          const Icon = isActive ? FolderOpen : Folder;

          return (
            <button
              key={folder.id}
              onClick={() => setActiveYearFolder(folder.id)}
              className={`relative h-8 px-3.5 rounded-[8px] flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer border-0 bg-transparent transition-colors duration-200 outline-none select-none group ${isActive ? "text-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"
                }`}
            >
              {/* Active Tab Sliding Background */}
              {isActive && (
                <motion.div
                  layoutId="active-folder-bg"
                  className="absolute inset-0 bg-white rounded-[7px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_1px_rgba(0,0,0,0.01)] border border-black/[0.03] -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}

              <Icon
                className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-[#28cd41] stroke-[2.2px]" : "text-[#9ca3af] group-hover:text-[#6b7280] stroke-[1.8px]"
                  }`}
              />

              <span>{folder.label}</span>

              {/* Dynamic item counter */}
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-all duration-200 leading-none ${isActive
                  ? "bg-[#28cd41]/10 text-[#28cd41]"
                  : "bg-black/[0.04] text-[#86868b] group-hover:bg-black/10 group-hover:text-[#1d1d1f]"
                  }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Center: Commission/Relator Avatar Filter */}
      <div className="flex items-center gap-2 flex-shrink-0 bg-black/[0.02] border border-black/[0.02] p-0.5 rounded-[10px] h-9 px-3">
        <User className="w-4 h-4 text-[#86868b] opacity-80" />
        <div className="flex items-center gap-1.5">
          {PEOPLE.map((person) => {
            const isSelected = activeCommissionFilter === person.name;
            return (
              <motion.button
                key={person.name}
                onClick={() => toggleCommissionFilter(person.name)}
                whileHover={{
                  scale: 1.25,
                  y: -6,
                  zIndex: 20
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
                className={`group relative w-8 h-8 flex items-center justify-center p-0.5 rounded-[8px] border bg-white cursor-pointer transition-shadow duration-200 outline-none ${isSelected
                  ? "shadow-md"
                  : "border-black/[0.06] hover:border-black/[0.12] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
                  }`}
                style={{
                  borderColor: isSelected ? person.sideAccentBorder : undefined,
                  backgroundColor: isSelected ? person.sideAccentFrom : undefined
                }}
              >
                <img
                  src={person.avatar}
                  alt={person.name}
                  className="object-contain w-full h-full animate-fade-in"
                />
                {isSelected && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-[7.5px] h-[7.5px] rounded-full border border-white shadow-sm z-10 animate-pulse"
                    style={{ backgroundColor: person.sideAccentDot }}
                  />
                )}
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out origin-bottom bg-[#1F2937] text-white font-semibold text-[10px] px-2 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-50 leading-none">
                  {person.name}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[4px] border-t-[4px] border-x-transparent border-t-[#1F2937]" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Right side: Status Segmented Control */}
      <div className="flex p-0.5 bg-black/[0.03] border border-black/[0.02] rounded-[10px] items-center gap-0.5 flex-shrink-0 h-9">
        {statusFolders.map(folder => {
          const isActive = activeStatusFolder === folder.id;
          const count = statusCounts[folder.id as "all" | "pending" | "finalized"] || 0;
          let Icon = ClipboardList;
          let colorClass = "text-[#86868b]";
          let countBadgeClass = isActive ? "bg-slate-500 text-white" : "bg-black/[0.04] text-[#86868b] group-hover:bg-black/10 group-hover:text-[#1d1d1f]";

          if (folder.id === "pending") {
            Icon = Clock;
            colorClass = isActive ? "text-[#f97316]" : "text-[#9ca3af] group-hover:text-[#f97316]";
            countBadgeClass = isActive ? "bg-[#f97316]/10 text-[#f97316]" : "bg-black/[0.04] text-[#86868b] group-hover:bg-[#f97316]/10 group-hover:text-[#f97316]";
          } else if (folder.id === "finalized") {
            Icon = CheckCircle2;
            colorClass = isActive ? "text-[#28cd41]" : "text-[#9ca3af] group-hover:text-[#28cd41]";
            countBadgeClass = isActive ? "bg-[#28cd41]/10 text-[#28cd41]" : "bg-black/[0.04] text-[#86868b] group-hover:bg-[#28cd41]/10 group-hover:text-[#28cd41]";
          }

          return (
            <button
              key={folder.id}
              onClick={() => setActiveStatusFolder(folder.id)}
              className={`relative h-8 px-3.5 rounded-[8px] flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer border-0 bg-transparent transition-colors duration-200 outline-none select-none group ${isActive ? "text-[#1d1d1f]" : "text-[#86868b] hover:text-[#1d1d1f]"
                }`}
            >
              {/* Active Tab Sliding Background */}
              {isActive && (
                <motion.div
                  layoutId="active-status-bg"
                  className="absolute inset-0 bg-white rounded-[7px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_1px_rgba(0,0,0,0.01)] border border-[#E5E7EB] -z-10"
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                />
              )}

              <Icon
                className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-105 ${colorClass}`}
              />

              <span>{folder.label}</span>

              {/* Dynamic item counter */}
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold transition-all duration-200 leading-none ${countBadgeClass}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
