"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useApp } from "@/context/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Search,
  CheckCircle,
  Clock,
  Building,
  Calendar,
  MapPin,
  FileSpreadsheet,
  Layers,
  ChevronRight,
  ClipboardList,
  User
} from "lucide-react";
import { getCommissionAvatars, formatDateToDDMMYYYY, parseDate, PEOPLE } from "@/lib/utils";

// Explicit folders requested by the user
const FOLDERS = [
  { id: "2026", label: "2026" },
  { id: "2025", label: "2025" },
  { id: "2024", label: "2024" },
  { id: "2023", label: "2023" },
  { id: "2022", label: "2022" },
  { id: "2021", label: "2021" },
  { id: "2020-2016", label: "20-16" }
];

const COLOR_THEMES: Record<string, {
  bg: string;
  bgGradient: string;
  cardGradient: string;
  shadow: string;
  textMuted: string;
  border: string;
  inactiveBg: string;
  inactiveText: string;
  startColor: string;
  endColor: string;
}> = {
  "2026": {
    bg: "bg-[#059669]",
    bgGradient: "from-[#10B981] to-[#059669]",
    cardGradient: "from-[#34D399] to-[#10B981]",
    shadow: "shadow-[0_10px_24px_rgba(5,150,105,0.22)]",
    textMuted: "text-[#D1FAE5]/95",
    border: "border-[#10B981]/15",
    inactiveBg: "bg-[#059669]/5",
    inactiveText: "text-[#059669]",
    startColor: "#10B981",
    endColor: "#059669"
  },
  "2025": {
    bg: "bg-[#1D4ED8]",
    bgGradient: "from-[#3B82F6] to-[#1D4ED8]",
    cardGradient: "from-[#60A5FA] to-[#3B82F6]",
    shadow: "shadow-[0_10px_24px_rgba(29,78,216,0.22)]",
    textMuted: "text-[#DBEAFE]/95",
    border: "border-[#3B82F6]/15",
    inactiveBg: "bg-[#1D4ED8]/5",
    inactiveText: "text-[#1D4ED8]",
    startColor: "#3B82F6",
    endColor: "#1D4ED8"
  },
  "2024": {
    bg: "bg-[#6D28D9]",
    bgGradient: "from-[#8B5CF6] to-[#6D28D9]",
    cardGradient: "from-[#A78BFA] to-[#8B5CF6]",
    shadow: "shadow-[0_10px_24px_rgba(109,40,217,0.22)]",
    textMuted: "text-[#F5F3FF]/95",
    border: "border-[#8B5CF6]/15",
    inactiveBg: "bg-[#6D28D9]/5",
    inactiveText: "text-[#6D28D9]",
    startColor: "#8B5CF6",
    endColor: "#6D28D9"
  },
  "2023": {
    bg: "bg-[#BE185D]",
    bgGradient: "from-[#EC4899] to-[#BE185D]",
    cardGradient: "from-[#F472B6] to-[#EC4899]",
    shadow: "shadow-[0_10px_24px_rgba(190,24,93,0.22)]",
    textMuted: "text-[#FCE7F3]/95",
    border: "border-[#EC4899]/15",
    inactiveBg: "bg-[#BE185D]/5",
    inactiveText: "text-[#BE185D]",
    startColor: "#EC4899",
    endColor: "#BE185D"
  },
  "2022": {
    bg: "bg-[#D97706]",
    bgGradient: "from-[#F59E0B] to-[#D97706]",
    cardGradient: "from-[#FBBF24] to-[#F59E0B]",
    shadow: "shadow-[0_10px_24px_rgba(217,119,6,0.22)]",
    textMuted: "text-[#FEF3C7]/95",
    border: "border-[#F59E0B]/15",
    inactiveBg: "bg-[#D97706]/5",
    inactiveText: "text-[#D97706]",
    startColor: "#F59E0B",
    endColor: "#D97706"
  },
  "2021": {
    bg: "bg-[#0891B2]",
    bgGradient: "from-[#06B6D4] to-[#0891B2]",
    cardGradient: "from-[#22D3EE] to-[#06B6D4]",
    shadow: "shadow-[0_10px_24px_rgba(8,145,178,0.22)]",
    textMuted: "text-[#CFFAFE]/95",
    border: "border-[#06B6D4]/15",
    inactiveBg: "bg-[#0891B2]/5",
    inactiveText: "text-[#0891B2]",
    startColor: "#06B6D4",
    endColor: "#0891B2"
  },
  "2020-2016": {
    bg: "bg-[#374151]",
    bgGradient: "from-[#6B7280] to-[#374151]",
    cardGradient: "from-[#9CA3AF] to-[#6B7280]",
    shadow: "shadow-[0_10px_24px_rgba(55,65,81,0.22)]",
    textMuted: "text-[#F3F4F6]/95",
    border: "border-[#6B7280]/15",
    inactiveBg: "bg-[#374151]/5",
    inactiveText: "text-[#374151]",
    startColor: "#6B7280",
    endColor: "#374151"
  }
};

// Helper to resolve the correct folder ID for a Portaria row based on Data Tomada
const resolveYearFolder = (dataTomada: string, rowYear: string): string => {
  const dt = String(dataTomada || "").trim();
  let extractedYear = "";

  // 1. Try to parse year from Data Tomada (index 7)
  if (dt) {
    const parsed = parseDate(dt);
    if (parsed && !isNaN(parsed.getTime())) {
      const yr = parsed.getFullYear();
      if (yr >= 2016 && yr <= 2026) {
        extractedYear = String(yr);
      }
    }
  }

  // 2. Fallback to row year (index 8) if Data Tomada parsing doesn't resolve to 2016-2026
  if (!extractedYear) {
    const ry = String(rowYear || "").trim();
    const ryNum = parseInt(ry, 10);
    if (!isNaN(ryNum) && ryNum >= 2016 && ryNum <= 2026) {
      extractedYear = String(ryNum);
    }
  }

  // 3. Map to folders list
  if (extractedYear) {
    const yrVal = parseInt(extractedYear, 10);
    if (yrVal >= 2016 && yrVal <= 2020) {
      return "2020-2016";
    }
    if (yrVal >= 2021 && yrVal <= 2026) {
      return String(yrVal);
    }
  }

  // Fallback to "20-16" folder (id: "2020-2016")
  return "2020-2016";
};

// Compute days since Data Tomada
const computeDaysSinceTomada = (dataTomadaStr: string): number | null => {
  const date = parseDate(dataTomadaStr);
  if (!date) return null;
  const diffTime = Date.now() - date.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Compute deadline details (180 days tracking)
const getDeadlineStats = (dataTomadaStr: string) => {
  const elapsed = computeDaysSinceTomada(dataTomadaStr);
  if (elapsed === null) return null;

  const remaining = 180 - elapsed;
  const isOverdue = elapsed > 180;

  let colorClass = "bg-emerald-50/80 border-emerald-500/10 text-emerald-800";
  let progressColor = "bg-emerald-500";
  let title = "Prazo Regular";

  if (isOverdue) {
    colorClass = "bg-red-50/90 border-red-500/15 text-red-800 animate-pulse";
    progressColor = "bg-red-600";
    title = "Prazo Excedido!";
  } else if (elapsed > 150) {
    colorClass = "bg-red-50/80 border-red-400/20 text-red-800";
    progressColor = "bg-red-500";
    title = "Prazo Crítico!";
  } else if (elapsed > 90) {
    colorClass = "bg-amber-50/80 border-amber-400/20 text-[#A16207]";
    progressColor = "bg-amber-500";
    title = "Prazo de Alerta";
  }

  return {
    elapsed,
    remaining,
    isOverdue,
    colorClass,
    progressColor,
    title,
    percent: Math.min(100, Math.max(0, (elapsed / 180) * 100))
  };
};

export default function PortariasView() {
  const { sheetData, localEdits, updateRecord, isLoading, activeCommissionFilter, toggleCommissionFilter } = useApp();

  // Local state
  const [mounted, setMounted] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [localSearch, setLocalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "finalized">("all");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Rebuild merged dataset
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

  // Keep all rows of the sheet
  const portariaRows = baseMergedData;

  // Group Portarias by Year Folder ID (explicitly mapped)
  const portariasByYear = useMemo(() => {
    const groups: Record<string, any[][]> = {
      "2026": [],
      "2025": [],
      "2024": [],
      "2023": [],
      "2022": [],
      "2021": [],
      "2020-2016": []
    };

    portariaRows.forEach(row => {
      const folderId = resolveYearFolder(row[7], row[8]);
      if (groups[folderId]) {
        groups[folderId].push(row);
      } else {
        groups["2020-2016"].push(row);
      }
    });

    // Sort by code descending
    Object.keys(groups).forEach(id => {
      groups[id].sort((a, b) => {
        const codeA = String(a[10] || "");
        const codeB = String(b[10] || "");
        return codeB.localeCompare(codeA, undefined, { numeric: true });
      });
    });

    return groups;
  }, [portariaRows]);

  // Track selected year changes
  const prevYearRef = useRef(selectedYear);
  useEffect(() => {
    if (prevYearRef.current !== selectedYear) {
      prevYearRef.current = selectedYear;
    }
  }, [selectedYear]);

  // Auto-redirect if selected folder has no items on initial load
  const initialRedirectDone = useRef(false);
  useEffect(() => {
    if (isLoading) return;
    if (initialRedirectDone.current) return;

    const currentLength = (portariasByYear[selectedYear] || []).length;
    if (selectedYear && currentLength === 0) {
      const foldersWithItems = FOLDERS.filter(f => (portariasByYear[f.id] || []).length > 0);
      if (foldersWithItems.length > 0) {
        setSelectedYear(foldersWithItems[0].id);
        initialRedirectDone.current = true;
      }
    } else if (currentLength > 0) {
      initialRedirectDone.current = true;
    }
  }, [isLoading, portariasByYear, selectedYear]);

  // Extract all unique relatores (avatars) for the selected folder
  const availableRelatores = useMemo(() => {
    const rows = portariasByYear[selectedYear] || [];
    const relMap = new Map<string, { name: string; img: string }>();

    rows.forEach(row => {
      const avatars = getCommissionAvatars(row[11] || row[12]);
      avatars.forEach(av => {
        if (av.name && !relMap.has(av.name)) {
          relMap.set(av.name, av);
        }
      });
    });

    return Array.from(relMap.values());
  }, [portariasByYear, selectedYear]);

  // Filtered rows for active year
  const filteredRows = useMemo(() => {
    const rows = portariasByYear[selectedYear] || [];
    const query = localSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    return rows.filter(row => {
      // 1. Status Filter
      if (statusFilter !== "all") {
        const status = String(row[9] || "").trim().toLowerCase();
        const isFinalized = status.includes("finalizado") || status.includes("concluido");
        if (statusFilter === "pending" && isFinalized) return false;
        if (statusFilter === "finalized" && !isFinalized) return false;
      }

      // 2. Search Query (matches convenio, municipio, associacao/entidade, objeto, portaria)
      if (query !== "") {
        const convenioVal = String(row[0] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const municipioVal = String(row[2] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const entidadeVal = String(row[3] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const objetoVal = String(row[4] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const portariaVal = String(row[10] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const matchesQuery = convenioVal.includes(query) ||
          municipioVal.includes(query) ||
          entidadeVal.includes(query) ||
          objetoVal.includes(query) ||
          portariaVal.includes(query);
        if (!matchesQuery) return false;
      }

      // 3. Relator Filter
      if (activeCommissionFilter) {
        const avatars = getCommissionAvatars(row[11] || row[12]);
        const filterName = activeCommissionFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const hasMatch = avatars.some(av => {
          const avName = av.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return avName.includes(filterName) || filterName.includes(avName);
        });
        if (!hasMatch) return false;
      }

      return true;
    });
  }, [portariasByYear, selectedYear, localSearch, statusFilter, activeCommissionFilter]);

  // Dynamic counts for tabs
  const tabCounts = useMemo(() => {
    const rows = portariasByYear[selectedYear] || [];
    const query = localSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    let geral = 0;
    let pending = 0;
    let finalized = 0;

    rows.forEach(row => {
      // Apply search query (matches convenio, municipio, associacao/entidade, objeto, portaria)
      if (query !== "") {
        const convenioVal = String(row[0] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const municipioVal = String(row[2] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const entidadeVal = String(row[3] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const objetoVal = String(row[4] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const portariaVal = String(row[10] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const matchesQuery = convenioVal.includes(query) ||
          municipioVal.includes(query) ||
          entidadeVal.includes(query) ||
          objetoVal.includes(query) ||
          portariaVal.includes(query);
        if (!matchesQuery) return;
      }

      // Apply relator filter
      if (activeCommissionFilter) {
        const avatars = getCommissionAvatars(row[11] || row[12]);
        const filterName = activeCommissionFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const hasMatch = avatars.some(av => {
          const avName = av.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          return avName.includes(filterName) || filterName.includes(avName);
        });
        if (!hasMatch) return;
      }

      geral++;
      const status = String(row[9] || "").trim().toLowerCase();
      const isFinalized = status.includes("finalizado") || status.includes("concluido");
      if (isFinalized) {
        finalized++;
      } else {
        pending++;
      }
    });

    return { geral, pending, finalized };
  }, [portariasByYear, selectedYear, localSearch, activeCommissionFilter]);

  // Details row object
  const selectedRow = useMemo(() => {
    if (!selectedRowKey) return null;
    return baseMergedData.find(r => String(r[0]) === selectedRowKey) || null;
  }, [baseMergedData, selectedRowKey]);

  // Detail edits dispatcher
  const handleDetailChange = (colIdx: number, val: string) => {
    if (!selectedRow) return;
    const updated = [...selectedRow];
    updated[colIdx] = val;

    if (colIdx === 11) {
      const parsedAvatars = getCommissionAvatars(val);
      const newCommission = parsedAvatars.map(a => a.name).join(", ");
      updated[12] = newCommission;
    }

    updateRecord(selectedRow[0], updated);
  };

  // Pre-calculate statistics
  const folderStats = useMemo(() => {
    const stats: Record<string, { total: number; finalized: number; pending: number }> = {};
    const query = localSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    Object.entries(portariasByYear).forEach(([id, rows]) => {
      const filtered = rows.filter(row => {
        // 1. Search Query (matches convenio, municipio, associacao/entidade, objeto, portaria)
        if (query !== "") {
          const convenioVal = String(row[0] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const municipioVal = String(row[2] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const entidadeVal = String(row[3] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const objetoVal = String(row[4] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const portariaVal = String(row[10] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

          const matchesQuery = convenioVal.includes(query) ||
            municipioVal.includes(query) ||
            entidadeVal.includes(query) ||
            objetoVal.includes(query) ||
            portariaVal.includes(query);
          if (!matchesQuery) return false;
        }

        // 2. Relator Filter
        if (activeCommissionFilter) {
          const avatars = getCommissionAvatars(row[11] || row[12]);
          const filterName = activeCommissionFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          const hasMatch = avatars.some(av => {
            const avName = av.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            return avName.includes(filterName) || filterName.includes(avName);
          });
          if (!hasMatch) return false;
        }

        return true;
      });

      let finalized = 0;
      let pending = 0;
      filtered.forEach(r => {
        const status = String(r[9] || "").trim().toLowerCase();
        if (status.includes("finalizado") || status.includes("concluido")) {
          finalized++;
        } else {
          pending++;
        }
      });
      stats[id] = { total: filtered.length, finalized, pending };
    });
    return stats;
  }, [portariasByYear, localSearch, activeCommissionFilter]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto custom-scrollbar p-1">
      {mounted && typeof document !== "undefined" && document.getElementById("topbar-actions-slot") && createPortal(
        <div className="flex items-center gap-2 flex-shrink-0 animate-in fade-in duration-200">

          {/* Search bar input */}
          <div className="relative w-48 sm:w-60">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar convênio, município, associação..."
              className="w-full h-8 pl-8 pr-3 rounded-lg text-[11px] font-semibold bg-black/[0.035] border border-black/[0.04] text-[#1d1d1f] outline-none transition-all duration-200 focus:bg-white focus:border-[#28CD41]/40 focus:ring-3 focus:ring-[#28CD41]/5 placeholder-[#86868b]/70"
            />
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868b]" />
          </div>

          {/* Capsule Relatores Filter */}
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
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-200 ease-out origin-top bg-[#1F2937] text-white font-semibold text-[10px] px-2 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-50 leading-none">
                      {person.name}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-x-[4px] border-b-[4px] border-x-transparent border-b-[#1F2937]" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Capsule Status segment control */}
          <div className="flex items-center gap-0.5 p-0.5 bg-[#F5F6F8]/80 border border-[#E9EAEB] rounded-lg overflow-x-auto h-8">
            {(["all", "pending", "finalized"] as const).map((filter) => {
              const active = statusFilter === filter;
              const label = filter === "all" ? "Geral" : filter === "pending" ? "Pendentes" : "Finalizados";
              const count = filter === "all" ? tabCounts.geral : filter === "pending" ? tabCounts.pending : tabCounts.finalized;
              const Icon = filter === "all" ? ClipboardList : filter === "pending" ? Clock : CheckCircle;

              return (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`h-6 px-2.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all duration-200 outline-none select-none border cursor-pointer ${active
                    ? "bg-white border-black/[0.03] shadow-[0_1.5px_4px_rgba(0,0,0,0.04)] text-[#1d1d1f]"
                    : "bg-transparent border-transparent text-[#86868b] hover:text-[#1d1d1f]"
                    }`}
                >
                  <Icon className={`w-3 h-3 ${active ? "text-[#28CD41]" : "text-[#86868b]"}`} />
                  <span>{label}</span>
                  <span className={`text-[8px] px-1 py-0.5 rounded-full font-black ml-0.5 transition-colors ${active ? "bg-slate-500 text-white" : "bg-black/[0.04] text-[#86868b]"
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
        document.getElementById("topbar-actions-slot")!
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-4 border-t-[#28CD41] border-black/[0.05] animate-spin" />
          <span className="text-xs font-semibold text-[#86868b]">Sincronizando registros da nuvem...</span>
        </div>
      ) : (
        <div className="flex flex-col flex-1 min-h-0">

          {/* Premium 3D Paper Folders Grid (Estilo Referência) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4 pb-6 border-b border-black/[0.04] overflow-visible">
            {FOLDERS.map((folder) => {
              const isActive = selectedYear === folder.id;
              const stats = folderStats[folder.id] || { total: 0, finalized: 0, pending: 0 };
              const theme = COLOR_THEMES[folder.id] || COLOR_THEMES["2020-2016"];

              return (
                <div
                  key={folder.id}
                  onClick={() => {
                    setSelectedYear(folder.id);
                    setSelectedRowKey(null);
                  }}
                  className="relative w-full h-[135px] group cursor-pointer overflow-visible pt-4"
                >
                  {/* Layer 1: Folder Back Cover & Tab */}
                  <div
                    className={`absolute top-0 left-0.5 h-4.5 w-[42%] rounded-t-xl transition-all duration-300 z-0 ${isActive ? "" : "bg-[#D1D2D6]"
                      }`}
                    style={{
                      backgroundColor: isActive ? theme.endColor : undefined
                    }}
                  />
                  <div
                    className={`absolute inset-0 mt-4 rounded-3xl transition-all duration-300 z-0 ${isActive ? "" : "bg-[#D1D2D6]"
                      }`}
                    style={{
                      backgroundColor: isActive ? theme.endColor : undefined
                    }}
                  />

                  {/* Layer 2: White Paper Sheet inside the Folder (Slides up on hover) */}
                  <div
                    className="absolute top-2 left-2.5 right-2.5 h-[76px] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-black/[0.03] transition-all duration-300 ease-out z-10 p-2 overflow-hidden flex flex-col gap-1 select-none transform group-hover:-translate-y-4.5 group-hover:rotate-[-1deg]"
                  >
                    {/* Mock text lines on paper document */}
                    <div className="flex flex-col gap-1 opacity-[0.35]">
                      <div className={`w-8 h-1 rounded-full ${isActive ? "bg-[#28CD41]/20" : "bg-slate-300"}`} />
                      <div className="w-full h-0.5 bg-slate-200 rounded-full" />
                      <div className="w-5/6 h-0.5 bg-slate-200 rounded-full" />
                      <div className="w-4/5 h-0.5 bg-slate-200 rounded-full" />
                    </div>
                  </div>

                  {/* Layer 3: Folder Front Pocket with Sloped Curve & Glassmorphism */}
                  <div className={`absolute bottom-0 left-0 right-0 h-[98px] z-20 overflow-hidden rounded-b-3xl transition-all duration-300 border-b border-x ${isActive ? "border-white/10" : "border-black/[0.04]"
                    }`}>
                    {/* SVG background with sloped wave curve (starts high left, dips right) */}
                    <svg
                      className="absolute inset-0 w-full h-full transition-all duration-300 drop-shadow-[0_-2px_6px_rgba(0,0,0,0.015)]"
                      viewBox="0 0 100 98"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id={`pocket-grad-${folder.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor={isActive ? theme.startColor : "#F3F4F6"} stopOpacity={isActive ? 0.75 : 0.55} />
                          <stop offset="100%" stopColor={isActive ? theme.endColor : "#E5E7EB"} stopOpacity={isActive ? 0.85 : 0.75} />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,12 C40,12 50,2 100,2 L100,98 L0,98 Z"
                        fill={`url(#pocket-grad-${folder.id})`}
                        stroke="transparent"
                      />
                    </svg>

                    {/* Pocket Content text with backdrop blur */}
                    <div className={`absolute inset-0 p-3.5 pt-6.5 flex flex-col justify-between select-none z-30 backdrop-blur-[6px] rounded-b-3xl ${isActive ? "text-white" : "text-[#1d1d1f]"
                      }`}>
                      <div className="flex flex-col leading-snug">
                        <span className={`text-[12.5px] font-black tracking-tight transition-colors duration-300 ${isActive ? "text-white" : "text-[#1d1d1f]"}`}>
                          {folder.label === "20-16" ? "Anos 20-16" : `Ano ${folder.label}`}
                        </span>
                        <span className={`text-[9.5px] font-bold mt-1 transition-colors duration-300 ${isActive ? "text-white/80" : "text-[#86868b]"}`}>
                          {stats.total} {stats.total === 1 ? "Tomada" : "Tomadas"}
                        </span>
                      </div>

                      {/* Bottom breakdown */}
                      <div className={`flex justify-between items-center border-t pt-2 select-none text-[8px] font-extrabold transition-colors duration-300 ${isActive ? "border-white/12 text-white/85" : "border-black/[0.04] text-slate-500"
                        }`}>
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1 h-1 rounded-full ${isActive ? "bg-white" : "bg-emerald-500"}`} />
                          {stats.finalized} concl.
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className={`w-1 h-1 rounded-full ${isActive ? "bg-white/60 animate-pulse" : "bg-orange-500"}`} />
                          {stats.pending} pend.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Master-Detail Split View Pane */}
          <div className="flex flex-col lg:flex-row flex-1 min-h-[480px] mt-6 gap-6 items-stretch">
            <div className="flex-[3] flex flex-col bg-white border border-black/[0.04] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] p-4 min-w-0">
              <div className="pb-3 border-b border-black/[0.03] mb-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#28CD41]" />
                  <h3 className="text-xs font-black text-[#1d1d1f] tracking-tight">
                    Tomadas ({FOLDERS.find(f => f.id === selectedYear)?.label || selectedYear}) — {filteredRows.length} tomadas
                  </h3>
                </div>

              </div>

              {/* Grid or List of Portaria Rows */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[500px]">
                {filteredRows.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-20 text-[#86868b]">
                    <ClipboardList className="w-8 h-8 opacity-30 mb-2" />
                    <span className="text-xs font-semibold">Nenhum registro localizado nesta pasta.</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {filteredRows.map((row, idx) => {
                      const isSelected = selectedRowKey === row[0];
                      const code = String(row[10] || "").trim();
                      const status = String(row[9] || "").trim().toLowerCase();
                      const isFinalized = status.includes("finalizado") || status.includes("concluido");
                      const avatars = getCommissionAvatars(row[11] || row[12]);
                      const hasPortaria = code !== "";

                      return (
                        <motion.div
                          key={`${row[0]}-${idx}`}
                          onClick={() => setSelectedRowKey(row[0])}
                          whileHover={{ x: 3 }}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-150 ${isSelected
                            ? "bg-[#28CD41]/5 border-[#28CD41]/15 shadow-[0_2px_8px_rgba(40,205,65,0.03)]"
                            : "bg-transparent border-transparent hover:bg-black/[0.012] hover:border-black/[0.03]"
                            }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center border border-black/[0.02] bg-slate-50 text-[#86868b]">
                              <FileText className="w-4 h-4" />
                              <span
                                className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white shadow-sm ${isFinalized ? "bg-emerald-500" : "bg-amber-500"
                                  }`}
                              />
                            </div>

                            {/* Cultural priority: Convenio is main title, Portaria + Association as subtitle */}
                            <div className="flex flex-col min-w-0 leading-normal">
                              <span className="text-xs font-extrabold text-[#1d1d1f] tracking-tight">
                                Convênio {row[0]}
                              </span>
                              <span className="text-[10px] font-semibold text-[#86868b] mt-0.5 truncate max-w-md">
                                {hasPortaria ? `Portaria ${code}` : "Sem Portaria"} • {row[3] || "Entidade Não Informada"}
                              </span>
                            </div>
                          </div>

                          {/* Detail Indicators */}
                          <div className="flex items-center gap-4 flex-shrink-0 pl-3">
                            {/* Commission avatars */}
                            {avatars.length > 0 && (
                              <div className="flex -space-x-1.5 items-center">
                                {avatars.slice(0, 3).map((av, avIdx) => (
                                  <div key={avIdx} className="w-5 h-5 rounded-full border border-white overflow-hidden bg-slate-50 shadow-sm" title={av.name}>
                                    <img src={av.img} alt={av.name} className="w-full h-full object-contain" />
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Status indicator */}
                            <span
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded-md leading-none ${isFinalized
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-500/10"
                                : "bg-orange-50 text-orange-700 border border-orange-500/10"
                                }`}
                            >
                              {isFinalized ? "Finalizado" : "Pendente"}
                            </span>

                            <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Premium Inspector Panel */}
            <div className="flex-[2] flex flex-col bg-white border border-black/[0.04] rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.01)] p-4 min-w-[280px]">
              <div className="pb-3 border-b border-black/[0.03] mb-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#28CD41]" />
                  <h3 className="text-xs font-black text-[#1d1d1f] tracking-tight">Painel de Detalhes</h3>
                </div>
                {selectedRow && (
                  <span className="text-[9px] font-bold text-[#28CD41] bg-[#28CD41]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Ficha
                  </span>
                )}
              </div>

              {/* Details and Inputs */}
              <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 max-h-[500px]">
                <AnimatePresence mode="wait">
                  {!selectedRow ? (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="h-full flex flex-col items-center justify-center text-center py-20 text-[#86868b] px-4"
                    >
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                      </div>
                      <h4 className="text-[11px] font-extrabold text-[#1d1d1f]">Nenhuma Tomada Selecionada</h4>
                      <p className="text-[10px] text-[#86868b] mt-1 max-w-[200px]">
                        Clique em um convênio da lista à esquerda para abrir a ficha de edição consolidada.
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key={selectedRow[0]}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-4 text-[11px] text-[#1f2937]"
                    >
                      {/* Highlighted Meta Card */}
                      <div className="bg-[#F8F9FA] border border-black/[0.02] rounded-xl p-3">
                        <span className="text-[9px] font-bold text-[#86868b] uppercase tracking-wider block">ID do Convênio</span>
                        <span className="text-xs font-black text-[#1d1d1f] mt-0.5 block">{selectedRow[0]}</span>
                        {selectedRow[1] && (
                          <div className="text-[9.5px] font-bold text-[#6b7280] mt-1 flex items-center gap-1">
                            <Layers className="w-3 h-3 stroke-[2px]" />
                            Prog: {selectedRow[1]}
                          </div>
                        )}
                      </div>

                      {/* Code Input (index 10) */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-bold text-[#86868b] uppercase tracking-wider">Código Portaria</label>
                        <input
                          type="text"
                          value={selectedRow[10]}
                          onChange={(e) => handleDetailChange(10, e.target.value.replace(/\D/g, ""))}
                          className="w-full h-8 px-3 rounded-lg border border-black/[0.06] focus:border-[#28CD41] outline-none font-bold text-xs tabular-nums text-[#1d1d1f] transition-all bg-[#FAFAFA] focus:bg-white focus:ring-2 focus:ring-[#28CD41]/5"
                        />
                      </div>

                      {/* Read-Only Status Indicator (index 9) */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-bold text-[#86868b] uppercase tracking-wider">Andamento / Status</label>
                        <div className="mt-1 flex items-center">
                          <span className={`h-8 px-4.5 rounded-lg text-[10.5px] font-extrabold border flex items-center gap-1.5 select-none ${selectedRow[9].toLowerCase().includes("finalizado") || selectedRow[9].toLowerCase().includes("concluido")
                            ? "bg-emerald-50/80 border-emerald-500/10 text-emerald-700"
                            : "bg-orange-50/80 border-orange-500/10 text-orange-700"
                            }`}>
                            {selectedRow[9].toLowerCase().includes("finalizado") || selectedRow[9].toLowerCase().includes("concluido") ? (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Finalizado
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                Pendente
                              </>
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 180-Day Deadline Panel (ONLY for Pendente status) */}
                      {(() => {
                        const status = String(selectedRow[9] || "").trim().toLowerCase();
                        const isFinalized = status.includes("finalizado") || status.includes("concluido");

                        if (isFinalized) return null;

                        const dataTomada = selectedRow[7];
                        if (!dataTomada) {
                          return (
                            <div className="bg-slate-50 border border-black/[0.03] rounded-xl p-3 flex items-center justify-center text-center text-gray-500 text-[10px] leading-snug">
                              Instaure a tomada de contas inserindo a data na coluna "Data Tomada" para iniciar o rastreamento do prazo legal of 180 dias.
                            </div>
                          );
                        }

                        const deadline = getDeadlineStats(dataTomada);
                        if (!deadline) return null;

                        return (
                          <div className={`border rounded-xl p-3.5 flex flex-col gap-2 ${deadline.colorClass}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase tracking-wider select-none">{deadline.title}</span>
                              <span className="text-[10px] font-black font-mono">
                                {deadline.isOverdue ? `Atraso: ${Math.abs(deadline.remaining)}d` : `Restam: ${deadline.remaining}d`}
                              </span>
                            </div>

                            {/* Linear Progress Bar */}
                            <div className="w-full h-1.5 bg-black/[0.04] rounded-full overflow-hidden relative">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${deadline.progressColor}`}
                                style={{ width: `${deadline.percent}%` }}
                              />
                            </div>

                            <div className="flex justify-between items-center text-[9.5px] font-bold select-none">
                              <span>{deadline.elapsed} dias decorridos</span>
                              <span className="opacity-70">Prazo: 180 dias</span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Municipio Input (index 2) */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-bold text-[#86868b] uppercase tracking-wider">Município</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={selectedRow[2]}
                            onChange={(e) => handleDetailChange(2, e.target.value)}
                            className="w-full h-8 pl-8 pr-3 rounded-lg border border-black/[0.06] focus:border-[#28CD41] outline-none font-semibold text-xs text-[#1d1d1f] bg-[#FAFAFA] focus:bg-white transition-all focus:ring-2 focus:ring-[#28CD41]/5"
                          />
                          <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868b]" />
                        </div>
                      </div>

                      {/* Entidade Input (index 3) */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-bold text-[#86868b] uppercase tracking-wider">Entidade</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={selectedRow[3]}
                            onChange={(e) => handleDetailChange(3, e.target.value)}
                            className="w-full h-8 pl-8 pr-3 rounded-lg border border-black/[0.06] focus:border-[#28CD41] outline-none font-semibold text-xs text-[#1d1d1f] bg-[#FAFAFA] focus:bg-white transition-all focus:ring-2 focus:ring-[#28CD41]/5"
                          />
                          <Building className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868b]" />
                        </div>
                      </div>

                      {/* Objeto Textarea (index 4) */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-bold text-[#86868b] uppercase tracking-wider">Objeto</label>
                        <textarea
                          rows={3}
                          value={selectedRow[4]}
                          onChange={(e) => handleDetailChange(4, e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-black/[0.06] focus:border-[#28CD41] outline-none font-semibold text-xs text-[#1d1d1f] bg-[#FAFAFA] focus:bg-white transition-all resize-none leading-normal focus:ring-2 focus:ring-[#28CD41]/5"
                        />
                      </div>

                      {/* Observations (index 11) */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-bold text-[#86868b] uppercase tracking-wider">Observações / Despacho</label>
                        <textarea
                          rows={3.5}
                          value={selectedRow[11]}
                          onChange={(e) => handleDetailChange(11, e.target.value)}
                          placeholder="Digite anotações ou nomes dos relatores (ex: João Rios, Iraildes, Pedro)..."
                          className="w-full p-2.5 rounded-lg border border-black/[0.06] focus:border-[#28CD41] outline-none font-semibold text-xs text-[#1d1d1f] bg-[#FAFAFA] focus:bg-white transition-all resize-none leading-normal focus:ring-2 focus:ring-[#28CD41]/5 placeholder:text-gray-400"
                        />
                      </div>

                      {/* Result (index 13) */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[9.5px] font-bold text-[#86868b] uppercase tracking-wider">Resultado Final</label>
                        <input
                          type="text"
                          value={selectedRow[13] || ""}
                          onChange={(e) => handleDetailChange(13, e.target.value)}
                          placeholder="Resultado da tomada..."
                          className="w-full h-8 px-3 rounded-lg border border-black/[0.06] focus:border-[#28CD41] outline-none font-semibold text-xs text-[#1d1d1f] bg-[#FAFAFA] focus:bg-white transition-all focus:ring-2 focus:ring-[#28CD41]/5"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
