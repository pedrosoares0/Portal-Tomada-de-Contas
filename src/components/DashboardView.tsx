"use client";

import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { motion } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  ShieldAlert,
  Folder,
  FolderOpen
} from "lucide-react";
import { parseDate, parseFinalizationDate, PEOPLE, getCellDisplayValue } from "@/lib/utils";
import { BarChart } from "@mui/x-charts/BarChart";
import { PieChart } from "@mui/x-charts/PieChart";
import { RadarChart } from "@mui/x-charts/RadarChart";

const PROGRAM_NAME_MAP: Record<string, string> = {
  "Implement.Proj.Apoio a Produção": "Apoio à Produção",
  "Bahia Produtiva": "Bahia Produtiva",
  "Impl. Inf. Est. Hidrica": "Infra. Hídrica",
  "Produzir-Assentamento": "Assentamento",
  "Produzir-II": "Produzir II",
  "Produzir-Adicional": "Prod. Adicional",
  "Cadeias Produtivas - BNDES/CAR": "Cadeias Produtivas",
  "Produzir-III": "Produzir III",
  "PRO-SEMIARIDO": "Pró-Semiárido",
  "Implement. Proj. Inf. Social": "Infra. Social",
  "Desenv.Sust.Semi-Arido": "Sust. Semiárido",
  "Impl.Infra. Prod. Ambiental": "Infra. Ambiental",
  "Produzir-Moradia": "Prod. Moradia",
  "Quilombolas, Indígenas e C. Trad": "Quilombolas/Indíg.",
  "Prodecar": "Prodecar",
  "CP - COMIDA NO PRATO": "Comida no Prato",
  "Produzir": "Produzir",
  "HR - Infraestrutura Social": "Infra. Social HR"
};

const folders = [
  { id: "all", label: "Geral" },
  { id: "2026", label: "2026" },
  { id: "2025", label: "2025" },
  { id: "2024", label: "2024" },
  { id: "2023", label: "2023" },
  { id: "2022", label: "2022" },
  { id: "2021", label: "2021" },
  { id: "2020-2016", label: "2020 - 2016" }
];

export default function DashboardView() {
  const {
    sheetData,
    mergedData,
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

  // Use dynamic current date
  const currentDate = useMemo(() => new Date(), []);

  // 1. Rebuild base merged data (without year filter) to calculate folder counts and general trends
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

  // Apply search, column filters, and commission filter (excluding year filter)
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

  // Compute counts for Year folders in the dashboard
  const yearCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: coreFilteredData.length
    };

    folders.forEach(f => {
      if (f.id !== "all") counts[f.id] = 0;
    });

    coreFilteredData.forEach(row => {
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
  }, [coreFilteredData]);

  // Filtered by year, search, and column filters, but NOT by active commission filter
  const yearFilteredDataWithoutCommission = useMemo(() => {
    return baseMergedData.filter(row => {
      const cleanQuery = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
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

      return matchSearch && matchFilters && matchYearFolder;
    });
  }, [baseMergedData, searchQuery, activeFilters, activeYearFolder]);

  // Compute stats on the globally filtered dataset (respects activeYearFolder)
  const stats = useMemo(() => {
    if (!mergedData || mergedData.length === 0) {
      return {
        total: 0,
        finalizadas: 0,
        finalizadasPercent: 0,
        finalizadasOnTime: 0,
        finalizadasOnTimePercent: 0,
        totalAtrasadas: 0,
        atrasadasPercent: 0,
        averageDays: 0,
        instaurationDelayCount: 0,
        statusCounts: {} as Record<string, number>,
        memberCounts: { "João Rios": 0, "Iraildes": 0, "Pedro": 0 } as Record<string, number>,
        memberFinalizedCounts: { "João Rios": 0, "Iraildes": 0, "Pedro": 0 } as Record<string, number>,
        memberPendingCounts: { "João Rios": 0, "Iraildes": 0, "Pedro": 0 } as Record<string, number>,
        assignedCount: 0
      };
    }

    let finalizadasCount = 0;
    let finalizadasOnTimeCount = 0;
    let totalDaysToFinalize = 0;
    let finalizedWithDaysCount = 0;
    let totalAtrasadasCount = 0;
    let instaurationDelayCount = 0;

    const statusMap: Record<string, number> = {};
    const memberMap: Record<string, number> = { "João Rios": 0, "Iraildes": 0, "Pedro": 0 };
    const memberFinalizedMap: Record<string, number> = { "João Rios": 0, "Iraildes": 0, "Pedro": 0 };
    const memberPendingMap: Record<string, number> = { "João Rios": 0, "Iraildes": 0, "Pedro": 0 };

    // Calculate general metrics from globally filtered dataset (mergedData)
    mergedData.forEach(row => {
      if (!row || !Array.isArray(row) || row.length < 10) return;

      const diasVigênciaVal = parseInt(String(row[6] || ""), 10);
      const andamento = String(row[9] || "Pendente").trim();
      const dataTomadaStr = String(row[7] || "");
      const dataTomada = parseDate(dataTomadaStr);
      const observacao = String(row[11] || "");

      const andamentoLower = andamento.toLowerCase();
      const isFinalized = andamentoLower.includes("finalizado") || andamentoLower.includes("concluido");

      // Classify status
      if (isFinalized) {
        finalizadasCount++;
        statusMap["Finalizado"] = (statusMap["Finalizado"] || 0) + 1;
      } else if (andamentoLower.includes("aberto") || andamentoLower.includes("pendente")) {
        statusMap["Pendente"] = (statusMap["Pendente"] || 0) + 1;
      } else if (andamentoLower.includes("analise")) {
        statusMap["Em Análise"] = (statusMap["Em Análise"] || 0) + 1;
      } else {
        statusMap[andamento || "Outros"] = (statusMap[andamento || "Outros"] || 0) + 1;
      }

      // Instauration threshold (Vigência vs. Data Tomada -> "Dias Passados" > 90)
      if (!isNaN(diasVigênciaVal) && diasVigênciaVal > 90) {
        instaurationDelayCount++;
      }

      // Tomada duration and delay logic (180 days threshold)
      if (dataTomada) {
        if (isFinalized) {
          const finDate = parseFinalizationDate(observacao);
          if (finDate) {
            const diffDays = Math.ceil((finDate.getTime() - dataTomada.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0) {
              totalDaysToFinalize += diffDays;
              finalizedWithDaysCount++;
              if (diffDays <= 180) {
                finalizadasOnTimeCount++;
              } else {
                totalAtrasadasCount++;
              }
            } else {
              // Date mismatch fallback, count as on time
              finalizadasOnTimeCount++;
              totalDaysToFinalize += 120;
              finalizedWithDaysCount++;
            }
          } else {
            // Fallback for historical clean data without observation date
            const yearMatch = observacao.match(/\b(20\d{2}|19\d{2})\b/);
            let estimatedDelayed = false;
            if (yearMatch) {
              const yearVal = parseInt(yearMatch[1], 10);
              if (yearVal - dataTomada.getFullYear() > 1) {
                estimatedDelayed = true;
              }
            }
            if (estimatedDelayed) {
              totalAtrasadasCount++;
              totalDaysToFinalize += 240;
              finalizedWithDaysCount++;
            } else {
              finalizadasOnTimeCount++;
              totalDaysToFinalize += 120;
              finalizedWithDaysCount++;
            }
          }
        } else {
          // Open process -> calculate current age from Data Tomada
          const ageDays = Math.ceil((currentDate.getTime() - dataTomada.getTime()) / (1000 * 60 * 60 * 24));
          if (ageDays > 180) {
            totalAtrasadasCount++;
          }
        }
      }
    });

    let assignedCount = 0;

    // Calculate commission/member stats independent of the commission filter (using yearFilteredDataWithoutCommission)
    yearFilteredDataWithoutCommission.forEach(row => {
      if (!row || !Array.isArray(row) || row.length < 10) return;
      const andamento = String(row[9] || "Pendente").trim();
      const andamentoLower = andamento.toLowerCase();
      const isFinalized = andamentoLower.includes("finalizado") || andamentoLower.includes("concluido");
      const comissaoText = String(row[12] || row[11] || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      let matchesAny = false;
      if (comissaoText.includes("joao") && !comissaoText.includes("sena")) {
        memberMap["João Rios"]++;
        matchesAny = true;
        if (isFinalized) {
          memberFinalizedMap["João Rios"]++;
        } else {
          memberPendingMap["João Rios"]++;
        }
      }
      if (comissaoText.includes("irail")) {
        memberMap["Iraildes"]++;
        matchesAny = true;
        if (isFinalized) {
          memberFinalizedMap["Iraildes"]++;
        } else {
          memberPendingMap["Iraildes"]++;
        }
      }
      if (comissaoText.includes("pedro")) {
        memberMap["Pedro"]++;
        matchesAny = true;
        if (isFinalized) {
          memberFinalizedMap["Pedro"]++;
        } else {
          memberPendingMap["Pedro"]++;
        }
      }
      if (matchesAny) {
        assignedCount++;
      }
    });

    const total = mergedData.length;
    const finalizadasPercent = total > 0 ? parseFloat(((finalizadasCount / total) * 100).toFixed(1)) : 0;
    const finalizadasOnTimePercent = finalizadasCount > 0 ? parseFloat(((finalizadasOnTimeCount / finalizadasCount) * 100).toFixed(1)) : 0;
    const atrasadasPercent = total > 0 ? parseFloat(((totalAtrasadasCount / total) * 100).toFixed(1)) : 0;
    const averageDays = finalizedWithDaysCount > 0 ? Math.round(totalDaysToFinalize / finalizedWithDaysCount) : 0;

    return {
      total,
      finalizadas: finalizadasCount,
      finalizadasPercent,
      finalizadasOnTime: finalizadasOnTimeCount,
      finalizadasOnTimePercent,
      totalAtrasadas: totalAtrasadasCount,
      atrasadasPercent,
      averageDays,
      instaurationDelayCount,
      statusCounts: statusMap,
      memberCounts: memberMap,
      memberFinalizedCounts: memberFinalizedMap,
      memberPendingCounts: memberPendingMap,
      assignedCount
    };
  }, [mergedData, yearFilteredDataWithoutCommission, currentDate]);

  // Compute data for MUI BarChart (General Trend across all years)
  const yearDistribution = useMemo(() => {
    const counts: Record<string, number> = {
      "2016-2020": 0,
      "2021": 0,
      "2022": 0,
      "2023": 0,
      "2024": 0,
      "2025": 0,
      "2026": 0
    };

    coreFilteredData.forEach(row => {
      const yearStr = String(row[8] || "").trim();
      const yearNum = parseInt(yearStr, 10);

      if (!isNaN(yearNum) && yearNum >= 2016 && yearNum <= 2020) {
        counts["2016-2020"]++;
      } else if (counts[yearStr] !== undefined) {
        counts[yearStr]++;
      }
    });

    return Object.entries(counts).map(([year, count]) => ({
      year,
      count
    }));
  }, [coreFilteredData]);

  const barData = useMemo(() => {
    return yearDistribution.map(item => item.count);
  }, [yearDistribution]);

  const barLabels = useMemo(() => {
    return yearDistribution.map(item => item.year);
  }, [yearDistribution]);

  // Compute data for MUI PieChart (Status counts)
  const pieData = useMemo(() => {
    return Object.entries(stats.statusCounts)
      .filter(([_, value]) => value > 0)
      .map(([label, value], idx) => {
        let color = "#3b82f6"; // default blue
        if (label === "Finalizado") color = "#28cd41"; // green
        if (label === "Pendente") color = "#f97316"; // orange
        if (label === "Em Análise") color = "#a855f7"; // purple

        // Dim if status filter is active
        const isFilteredOut =
          (activeStatusFolder === "finalized" && label !== "Finalizado") ||
          (activeStatusFolder === "pending" && label === "Finalizado");

        return {
          id: idx,
          value,
          label,
          color: isFilteredOut ? `${color}40` : color
        };
      });
  }, [stats.statusCounts, activeStatusFolder]);

  // Top programs for the Radar Chart (dynamic count of processes per Program)
  const topPrograms = useMemo(() => {
    const programCounts: Record<string, number> = {};
    mergedData.forEach(row => {
      if (!row || !Array.isArray(row) || row.length < 2) return;
      const prog = String(row[1] || "").trim();
      if (!prog) return;

      const cleanProg = PROGRAM_NAME_MAP[prog] || (prog.length > 25 ? prog.slice(0, 22) + "..." : prog);
      programCounts[cleanProg] = (programCounts[cleanProg] || 0) + 1;
    });

    const sorted = Object.entries(programCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    while (sorted.length < 3) {
      sorted.push([`Programa ${sorted.length + 1}`, 0]);
    }

    return sorted.map(([name, count]) => ({ name, count }));
  }, [mergedData]);

  const radarMetrics = useMemo(() => {
    return topPrograms.map(p => p.name);
  }, [topPrograms]);

  const radarSeriesData = useMemo(() => {
    return topPrograms.map(p => p.count);
  }, [topPrograms]);

  // Gauge-style PieChart data for commissions workload
  const commissionGaugeData = useMemo(() => {
    return PEOPLE.map((person, idx) => {
      const value = stats.memberCounts[person.name] || 0;
      let color = "#3b82f6";
      if (person.name === "João Rios") color = "#10b981"; // emerald
      if (person.name === "Iraildes") color = "#ec4899"; // pink
      if (person.name === "Pedro") color = "#6b7280"; // slate gray

      const isFilteredOut = activeCommissionFilter && activeCommissionFilter !== person.name;

      return {
        id: idx,
        value,
        label: person.name,
        color: isFilteredOut ? `${color}40` : color
      };
    });
  }, [stats.memberCounts, activeCommissionFilter]);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-y-auto custom-scrollbar gap-6 pr-1 select-none">

      {/* Header section with description and Year Filter Folder Control */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/[0.04] mb-2 flex-shrink-0">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-base font-extrabold text-[#1d1d1f] tracking-tight">Indicadores de Desempenho</h2>
          <p className="text-xs font-semibold text-[#86868b]">
            Acompanhamento em tempo real de prazos, conclusões e cargas de trabalho das comissões.
          </p>
        </div>

        {/* Year Filter Folder Control */}
        <div className="flex p-0.5 bg-black/[0.03] border border-black/[0.02] rounded-[10px] items-center gap-0.5 flex-shrink-0 h-9 overflow-x-auto custom-scrollbar self-start sm:self-auto flex-nowrap">
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
                    layoutId="active-dashboard-folder-bg"
                    className="absolute inset-0 bg-white rounded-[7px] shadow-[0_1px_3px_rgba(0,0,0,0.06),0_1px_1px_rgba(0,0,0,0.01)] border border-black/[0.03] -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  />
                )}

                <Icon
                  className={`w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-105 ${isActive ? "text-[#28cd41] stroke-[2.2px]" : "text-[#9ca3af] group-hover:text-[#6b7280] stroke-[1.8px]"
                    }`}
                />

                <span>{folder.label}</span>

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
      </div>

      {/* Hero cards grid (spacious and clear with high hierarchy numbers) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {/* Card 1: Total de Tomadas */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-black/[0.04] p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Total de Processos</span>
            <div className="p-1.5 rounded-[10px] bg-emerald-50 text-[#28cd41]">
              <FileText className="w-4 h-4 stroke-[2.2px]" />
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-4xl font-black text-[#1d1d1f] tracking-tight">{stats.total}</span>
            <span className="text-[10px] font-bold text-[#86868b] mt-1">Tomadas de contas cadastradas</span>
          </div>
        </motion.div>

        {/* Card 2: Conclusão rate */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white border border-black/[0.04] p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Conclusões</span>
            <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
              {stats.finalizadasPercent}%
            </span>
          </div>
          <div className="flex flex-col mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-emerald-600 tracking-tight">{stats.finalizadas}</span>
              <span className="text-xs font-bold text-[#86868b]">/ {stats.total}</span>
            </div>
            {/* Completion Progress Bar */}
            <div className="w-full h-1.5 bg-black/[0.03] rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.finalizadasPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-[#86868b] mt-1.5">Processos finalizados e enviados</span>
          </div>
        </motion.div>

        {/* Card 3: Processos Pendentes */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-black/[0.04] p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col justify-between min-h-[140px]"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-wider">Processos Pendentes</span>
            <span className="text-[9.5px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
              {stats.total > 0 ? parseFloat((((stats.total - stats.finalizadas) / stats.total) * 100).toFixed(1)) : 0}%
            </span>
          </div>
          <div className="flex flex-col mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-amber-500 tracking-tight">{stats.total - stats.finalizadas}</span>
              <span className="text-xs font-bold text-[#86868b]">/ {stats.total}</span>
            </div>
            {/* Pending Progress Bar */}
            <div className="w-full h-1.5 bg-black/[0.03] rounded-full overflow-hidden mt-2">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${stats.total > 0 ? ((stats.total - stats.finalizadas) / stats.total) * 100 : 0}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-[#86868b] mt-1.5">Processos em aberto</span>
          </div>
        </motion.div>

      </div>

      {/* Row 1: Premium Advanced Charts (Radar & Gauge) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-1 flex-shrink-0">

        {/* Chart 1: Radar Chart for Top Programs (7 columns) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative lg:col-span-7 bg-white border border-black/[0.04] p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col min-h-[350px]"
        >
          <div className="pb-3 border-b border-black/[0.03] mb-3">
            <h3 className="text-xs font-extrabold text-[#1d1d1f]">Quantidade de Processos por Programas</h3>
            <p className="text-[10px] font-semibold text-[#86868b] mt-0.5">
              Comparativo radial dos principais programas com maior volume de tomadas de contas.
            </p>
          </div>
          <div className="w-full h-[250px] relative">
            {radarSeriesData.some(c => c > 0) ? (
              <RadarChart
                radar={{
                  metrics: radarMetrics,
                  max: Math.max(...radarSeriesData, 5) + 1,
                }}
                series={[
                  {
                    type: "radar",
                    data: radarSeriesData,
                    label: "Processos",
                    fillArea: true,
                    color: "#3b82f6"
                  }
                ]}
                height={250}
                sx={{
                  '& .MuiRadarMetricLabels-text': {
                    fontSize: '9px',
                    fontWeight: '700',
                    fill: '#4b5563',
                    fontFamily: 'var(--font-sans), system-ui, sans-serif',
                  },
                  '& .MuiRadarGrid-line': {
                    stroke: 'rgba(0, 0, 0, 0.05)',
                  },
                  '& .MuiRadarGrid-grid': {
                    stroke: 'rgba(0, 0, 0, 0.07)',
                  }
                }}
              />
            ) : (
              <span className="text-xs font-semibold text-[#86868b]">Nenhum dado para exibir</span>
            )}
          </div>
        </motion.div>

        {/* Chart 2: Gauge Multi-segment Pie for Commissions (5 columns) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="relative lg:col-span-5 bg-white border border-black/[0.04] p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col min-h-[350px] justify-between"
        >
          <div>
            <div className="pb-3 border-b border-black/[0.03] mb-1">
              <h3 className="text-xs font-extrabold text-[#1d1d1f]">Divisão por Comissão / Técnico</h3>
              <p className="text-[10px] font-semibold text-[#86868b] mt-0.5">
                Proporção da carga horária de processos direcionados a cada comissão.
              </p>
            </div>

            {/* Semi-circle Pie Chart (Gauge effect) */}
            <div className="h-[140px] relative overflow-hidden flex justify-center w-full mt-2">
              {commissionGaugeData.some(d => d.value > 0) ? (
                <>
                  <PieChart
                    series={[
                      {
                        data: commissionGaugeData,
                        startAngle: -90,
                        endAngle: 90,
                        innerRadius: 75,
                        outerRadius: 115,
                        paddingAngle: 3,
                        cornerRadius: 6,
                        cx: "50%",
                        cy: 130,
                      },
                    ]}
                    height={140}
                    slotProps={{
                      legend: { hidden: true } as any,
                      tooltip: {
                        trigger: 'item',
                        anchor: 'node',
                        position: 'top',
                        placement: 'top',
                        popperOptions: {
                          modifiers: [
                            {
                              name: 'flip',
                              enabled: true,
                              options: {
                                fallbackPlacements: ['top', 'bottom', 'left', 'right'],
                              },
                            },
                            {
                              name: 'preventOverflow',
                              enabled: true,
                              options: {
                                boundary: 'viewport',
                              },
                            },
                          ],
                        },
                      }
                    }}
                    onItemClick={(event, itemIdentifier) => {
                      const clickedIdx = itemIdentifier.dataIndex;
                      const person = PEOPLE[clickedIdx];
                      if (person) {
                        toggleCommissionFilter(person.name);
                      }
                    }}
                    sx={{
                      cursor: 'pointer',
                      '& .MuiPieArc-root': {
                        cursor: 'pointer',
                        transition: 'opacity 0.2s ease',
                        '&:hover': {
                          opacity: 0.85
                        }
                      }
                    }}
                  />
                  {/* Center label */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center leading-none text-center">
                    <span className="text-[9px] font-bold text-[#86868b] uppercase tracking-wider">
                      {activeCommissionFilter ? "Filtrado" : "Total"}
                    </span>
                    <span className="text-base font-black text-[#1d1d1f] mt-0.5">
                      {activeCommissionFilter
                        ? (stats.memberCounts[activeCommissionFilter] || 0)
                        : stats.assignedCount}
                    </span>
                  </div>
                </>
              ) : (
                <span className="text-xs font-semibold text-[#86868b] self-center">Nenhum dado para exibir</span>
              )}
            </div>
          </div>

          {/* Custom Avatar Legends Below (Interactive Gauge Legend) */}
          <div className="grid grid-cols-3 gap-2.5 w-full mt-2">
            {PEOPLE.map((person) => {
              const count = stats.memberCounts[person.name] || 0;
              const totalCommissions = Object.values(stats.memberCounts).reduce((a, b) => a + b, 0);
              const percentage = totalCommissions > 0 ? Math.round((count / totalCommissions) * 100) : 0;
              const isSelected = activeCommissionFilter === person.name;

              let accentColor = "#10b981"; // emerald for João Rios
              if (person.name === "Iraildes") accentColor = "#ec4899"; // pink for Iraildes
              if (person.name === "Pedro") accentColor = "#6b7280"; // slate gray for Pedro

              return (
                <motion.button
                  key={person.name}
                  onClick={() => toggleCommissionFilter(person.name)}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex flex-col items-center gap-2 p-3 rounded-[16px] border bg-transparent cursor-pointer transition-all duration-200 outline-none select-none group relative overflow-hidden flex-1 ${isSelected
                      ? "shadow-[0_4px_12px_rgba(0,0,0,0.03)] border-black/[0.08]"
                      : "border-black/[0.04] bg-black/[0.01] hover:bg-black/[0.025] hover:border-black/[0.08]"
                    }`}
                  style={{
                    backgroundColor: isSelected ? person.sideAccentFrom : undefined,
                    borderColor: isSelected ? person.sideAccentBorder : undefined,
                  }}
                >
                  <div className="relative w-11 h-11 flex items-center justify-center rounded-full border border-black/[0.06] bg-white p-0.5 shadow-sm transition-transform duration-200 group-hover:scale-105">
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className="object-contain w-full h-full rounded-full"
                    />
                    {/* Color status dot matching the gauge segment */}
                    <span
                      className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm z-10"
                      style={{ backgroundColor: accentColor }}
                    />
                  </div>
                  <div className="flex flex-col items-center leading-tight text-center">
                    <span className="text-[11px] font-extrabold text-[#1d1d1f] tracking-tight">{person.name.split(" ")[0]}</span>
                    <span className="text-[10px] font-extrabold text-[#86868b] mt-0.5">{count} proc</span>
                    <span className="text-[9px] font-bold text-[#86868b]/70 mt-0.5">{percentage}%</span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Row 2: Analytics & Evolution Charts (Pie & Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-1 flex-shrink-0">
        {/* Chart 3: Pie Chart for Status (5 columns) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative lg:col-span-5 bg-white border border-black/[0.04] p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col min-h-[290px]"
        >
          <div className="pb-3 border-b border-black/[0.03] mb-4">
            <h3 className="text-xs font-extrabold text-[#1d1d1f]">Distribuição por Status</h3>
            <p className="text-[10px] font-semibold text-[#86868b] mt-0.5">
              Proporção de processos finalizados, pendentes e em análise.
            </p>
          </div>
          <div className="w-full h-[200px] relative">
            {pieData.length > 0 ? (
              <PieChart
                series={[
                  {
                    data: pieData,
                    innerRadius: 50,
                    outerRadius: 85,
                    paddingAngle: 4,
                    cornerRadius: 5,
                    cx: 110
                  },
                ]}
                height={200}
                onItemClick={(event, d) => {
                  const clickedIdx = d.dataIndex;
                  const clickedItem = pieData[clickedIdx];
                  if (clickedItem) {
                    if (clickedItem.label === "Finalizado") {
                      setActiveStatusFolder(activeStatusFolder === "finalized" ? "all" : "finalized");
                    } else if (clickedItem.label === "Pendente" || clickedItem.label === "Em Análise") {
                      setActiveStatusFolder(activeStatusFolder === "pending" ? "all" : "pending");
                    }
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  '& .MuiPieArc-root': {
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      opacity: 0.85
                    }
                  }
                }}
                slotProps={{
                  tooltip: {
                    trigger: 'item',
                    anchor: 'node',
                    position: 'top',
                    placement: 'top',
                    popperOptions: {
                      modifiers: [
                        {
                          name: 'flip',
                          enabled: true,
                          options: {
                            fallbackPlacements: ['top', 'bottom', 'left', 'right'],
                          },
                        },
                        {
                          name: 'preventOverflow',
                          enabled: true,
                          options: {
                            boundary: 'viewport',
                          },
                        },
                      ],
                    },
                  },
                  legend: {
                    direction: 'column' as any,
                    position: { vertical: 'middle' as const, horizontal: 'end' as const },
                    labelStyle: {
                      fontSize: 10,
                      fontWeight: 'bold',
                      fill: '#374151',
                    },
                    itemMarkWidth: 8,
                    itemMarkHeight: 8,
                    markGap: 6,
                    itemGap: 10,
                  } as any,
                }}
              />
            ) : (
              <span className="text-xs font-semibold text-[#86868b]">Nenhum dado para exibir</span>
            )}
          </div>
        </motion.div>

        {/* Chart 4: Bar Chart for Processes by Year (7 columns) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="relative lg:col-span-7 bg-white border border-black/[0.04] p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col min-h-[290px]"
        >
          <div className="pb-3 border-b border-black/[0.03] mb-4">
            <h3 className="text-xs font-extrabold text-[#1d1d1f]">Processos por Ano</h3>
            <p className="text-[10px] font-semibold text-[#86868b] mt-0.5">
              Volume total de processos distribuídos ao longo dos anos.
            </p>
          </div>
          <div className="w-full h-[200px] relative">
            {barData.some(c => c > 0) ? (
              <BarChart
                xAxis={[
                  {
                    id: 'years',
                    data: barLabels,
                    scaleType: 'band',
                    colorMap: {
                      type: 'ordinal',
                      values: barLabels,
                      colors: barLabels.map(year => {
                        const isActiveYear = activeYearFolder === "all" ||
                          (activeYearFolder === "2020-2016" && year === "2016-2020") ||
                          (activeYearFolder === year);
                        return isActiveYear ? '#28cd41' : '#28cd4130';
                      })
                    },
                    tickLabelStyle: {
                      fontSize: 9,
                      fontWeight: 'bold',
                      fill: '#4B5563',
                    }
                  },
                ]}
                series={[
                  {
                    data: barData,
                    color: '#28cd41',
                  },
                ]}
                height={200}
                borderRadius={6}
                margin={{ left: 35, right: 15, top: 15, bottom: 25 }}
                onItemClick={(event, d) => {
                  const clickedIdx = d.dataIndex;
                  const clickedYear = barLabels[clickedIdx];
                  if (clickedYear) {
                    const stateYear = clickedYear === "2016-2020" ? "2020-2016" : clickedYear;
                    setActiveYearFolder(activeYearFolder === stateYear ? "all" : stateYear);
                  }
                }}
                sx={{
                  cursor: 'pointer',
                  '& .MuiBarElement-root': {
                    cursor: 'pointer',
                    transition: 'opacity 0.2s ease',
                    '&:hover': {
                      opacity: 0.85
                    }
                  }
                }}
                slotProps={{
                  tooltip: {
                    trigger: 'item',
                    anchor: 'node',
                    position: 'top',
                    placement: 'top',
                    popperOptions: {
                      modifiers: [
                        {
                          name: 'flip',
                          enabled: true,
                          options: {
                            fallbackPlacements: ['top', 'bottom', 'left', 'right'],
                          },
                        },
                        {
                          name: 'preventOverflow',
                          enabled: true,
                          options: {
                            boundary: 'viewport',
                          },
                        },
                      ],
                    },
                  }
                }}
              />
            ) : (
              <span className="text-xs font-semibold text-[#86868b]">Nenhum dado para exibir</span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Row 3: Secondary indicators (Relators progress bar workloads & delays) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-1 flex-shrink-0">

        {/* Section 1: Relatores Workload (8 columns) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="relative lg:col-span-8 bg-white border border-black/[0.04] p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col justify-between"
        >
          <div className="pb-3 border-b border-black/[0.03]">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#28cd41] stroke-[2.2px]" />
              <h3 className="text-xs font-extrabold text-[#1d1d1f]">Carga de Trabalho e Relatorias</h3>
            </div>
            <p className="text-[10px] font-semibold text-[#86868b] mt-0.5">
              Distribuição e andamento das tomadas de contas por comissão/relator.
            </p>
          </div>

          <div className="flex flex-col gap-3.5 py-4">
            {PEOPLE.map((person, idx) => {
              const count = stats.memberCounts[person.name] || 0;
              const finalizedCount = stats.memberFinalizedCounts[person.name] || 0;
              const pendingCount = stats.memberPendingCounts[person.name] || 0;
              const completionRate = count > 0 ? Math.round((finalizedCount / count) * 100) : 0;
              const isSelected = activeCommissionFilter === person.name;

              return (
                <motion.div
                  key={idx}
                  onClick={() => toggleCommissionFilter(person.name)}
                  whileHover={{ x: 4 }}
                  className={`flex items-start gap-4 p-2.5 rounded-[16px] cursor-pointer transition-all duration-200 border ${isSelected
                      ? "shadow-sm border-black/[0.08]"
                      : "bg-transparent border-transparent hover:bg-black/[0.015] hover:border-black/[0.04]"
                    }`}
                  style={{
                    backgroundColor: isSelected ? person.sideAccentFrom : undefined,
                    borderColor: isSelected ? person.sideAccentBorder : undefined,
                  }}
                >
                  {/* Avatar section */}
                  <div className="relative flex-shrink-0">
                    <div className="w-[44px] h-[44px] flex items-center justify-center rounded-full border border-black/[0.04] bg-slate-50 p-0.5 shadow-sm">
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="object-contain w-full h-full"
                      />
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-[11px] h-[11px] border-2 border-white rounded-full animate-pulse"
                      style={{ backgroundColor: isSelected ? person.sideAccentDot : "#d1d5db" }}
                    />
                  </div>

                  {/* Relator stats details */}
                  <div className="flex-1 flex flex-col gap-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col leading-tight">
                        <span className="text-xs font-bold text-[#1d1d1f]">{person.name}</span>
                        <span className="text-[9px] font-bold text-[#86868b]">{person.role}</span>
                      </div>
                      <div className="flex flex-col items-end leading-tight">
                        <span className="text-[11px] font-extrabold text-[#1d1d1f]">{finalizedCount} de {count} concluídos</span>
                        <span className="text-[9.5px] font-extrabold text-[#86868b]">{completionRate}% taxa de conclusão</span>
                      </div>
                    </div>

                    {/* Progress Bar container */}
                    <div className="w-full h-2 bg-black/[0.03] rounded-full overflow-hidden mt-0.5 relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${completionRate}%` }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: idx * 0.1 }}
                        className="h-full rounded-full"
                        style={{
                          backgroundColor: person.name === "João Rios" ? "#10b981" : (person.name === "Iraildes" ? "#ec4899" : "#6b7280")
                        }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="bg-black/[0.015] border border-black/[0.03] p-3 rounded-[12px] flex items-center gap-2 mt-2">
            <TrendingUp className="w-3.5 h-3.5 text-[#28cd41]" />
            <span className="text-[9.5px] font-semibold text-[#86868b] leading-snug">
              Os relatores João Rios, Iraildes e Pedro dividem {stats.assignedCount} dos processos selecionados para este período.
            </span>
          </div>
        </motion.div>

        {/* Section 2: Other Indicators (4 columns) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="relative lg:col-span-4 bg-white border border-black/[0.04] p-5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.01)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.02)] transition-all duration-300 flex flex-col justify-between"
        >
          <div className="pb-3 border-b border-black/[0.03]">
            <div className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-[#ff9500] stroke-[2.2px]" />
              <h3 className="text-xs font-extrabold text-[#1d1d1f]">Atrasos de Instauração</h3>
            </div>
            <p className="text-[10px] font-semibold text-[#86868b] mt-0.5">
              Estouro do prazo para instauração da Tomada de Contas.
            </p>
          </div>

          {/* Instauration stats display */}
          <div className="flex flex-col items-center justify-center py-6 flex-1">
            <span className="text-5xl font-black text-red-500 tracking-tight">{stats.instaurationDelayCount}</span>
            <span className="text-[10.5px] font-bold text-[#1d1d1f] text-center mt-2.5 px-3">
              Convênios instaurados fora do limite (90 dias de vencimento).
            </span>
            <p className="text-[9px] font-bold text-[#86868b] text-center mt-1 uppercase tracking-wider">
              Atraso na Instauração de Tomada
            </p>
          </div>

          <div className="bg-orange-50/50 border border-orange-200/50 p-2.5 rounded-[12px] flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-[#ff9500] flex-shrink-0 mt-0.5" />
            <span className="text-[9.5px] font-semibold text-orange-800 leading-snug">
              A legislação prevê que a instauração da tomada de contas especial ocorra no prazo de até 90 dias após a vigência do convênio expirado.
            </span>
          </div>
        </motion.div>

      </div>

      {/* General Sector Duration Bottom Callout */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-emerald-50/70 via-emerald-100/30 to-transparent border border-emerald-200/40 p-4.5 rounded-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.005)] flex items-center justify-between flex-shrink-0 mt-1 mb-2"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-[12px] bg-emerald-500/10 text-[#28cd41]">
            <Clock className="w-5 h-5 stroke-[2.2px]" />
          </div>
          <div className="flex flex-col leading-snug">
            <span className="text-xs font-bold text-[#1d1d1f]">Média de Tempo Geral de Conclusão</span>
            <span className="text-[10px] font-semibold text-[#86868b]">Intervalo médio em dias entre a Data de Instauração e a data de Finalização.</span>
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-black text-emerald-600 tracking-tight">{stats.averageDays}</span>
          <span className="text-xs font-extrabold text-[#86868b] uppercase tracking-wider">Dias</span>
        </div>
      </motion.div>

    </div>
  );
}
