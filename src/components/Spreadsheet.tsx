"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import {
  formatDateToDDMMYYYY,
  normalizeInputDate,
  parseDateToNum,
  getCommissionAvatars,
  computeDaysPassed,
  getDaysPassedString,
  getCellDisplayValue,
} from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Filter,
  Trash2
} from "lucide-react";

const placeholders = [
  "Convênio",
  "Programa",
  "Município",
  "Entidade",
  "Objeto",
  "Vigência",
  "Dias Passados",
  "Data Tomada",
  "Ano",
  "Andamento",
  "Código Portaria",
  "Observação",
  "Comissão"
];

// Columns that support sort (numbers & dates)
const SORTABLE_COLUMNS = new Set([0, 5, 6, 7, 8, 10]);

// Helper to format date input while typing (dd/mm/aaaa)
const formatDateInput = (value: string): string => {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

interface CellEditorProps {
  rowKey: string;
  colIdx: number;
  row: any[];
  initialVal: string;
  widthStyle: string;
  onFinish: (val: string) => void;
  onCancel: () => void;
  onNavigate: (dir: "left" | "right") => void;
  getUniqueValues: (colIdx: number) => string[];
}

function CellEditor({
  rowKey,
  colIdx,
  row,
  initialVal,
  widthStyle,
  onFinish,
  onCancel,
  onNavigate,
  getUniqueValues
}: CellEditorProps) {
  const normalizedInitialVal = useMemo(() => {
    const s = (initialVal || "").trim();
    if (!s) return "";
    const lower = s.toLowerCase();
    if (lower.includes("finalizado") || lower.includes("concluido")) {
      return "Finalizado";
    }
    return "Pendente";
  }, [initialVal]);

  const [val, setVal] = useState(colIdx === 9 ? normalizedInitialVal : initialVal);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [isModified, setIsModified] = useState(false);
  const hasFinishedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const finish = useCallback((valToFinish: string) => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onFinish(valToFinish);
  }, [onFinish]);

  const cancel = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    onCancel();
  }, [onCancel]);

  // Auto-focus on mount
  useEffect(() => {
    if (colIdx === 9 && containerRef.current) {
      containerRef.current.focus();
    } else if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [colIdx]);

  const isAutocompleteCol = colIdx === 1 || colIdx === 2 || colIdx === 3 || colIdx === 4;
  const uniqueOptions = useMemo(() => {
    if (!isAutocompleteCol) return [];
    return getUniqueValues(colIdx);
  }, [isAutocompleteCol, colIdx, getUniqueValues]);

  const filteredOptions = useMemo(() => {
    if (!isAutocompleteCol) return [];
    if (!isModified) {
      return uniqueOptions;
    }
    const search = val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const list = uniqueOptions.filter(opt =>
      opt.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search)
    );
    
    // For Programa (colIdx === 1), if search term is not empty and not an exact match, offer "+ Criar Novo"
    if (colIdx === 1 && search !== "") {
      const hasExactMatch = uniqueOptions.some(opt => opt.trim().toLowerCase() === val.trim().toLowerCase());
      if (!hasExactMatch) {
        list.push(`+ Criar Novo: "${val}"`);
      }
    }
    return list;
  }, [uniqueOptions, val, isAutocompleteCol, colIdx, isModified]);

  useEffect(() => {
    if (isAutocompleteCol && !isModified && uniqueOptions.length > 0) {
      const idx = uniqueOptions.indexOf(val);
      if (idx !== -1) {
        setHighlightedIdx(idx);
      } else {
        setHighlightedIdx(0);
      }
    }
  }, [isAutocompleteCol, isModified, uniqueOptions, val]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (autocompleteOpen && filteredOptions.length > 0) {
        const selected = filteredOptions[highlightedIdx];
        if (selected.startsWith(`+ Criar Novo: "`)) {
          finish(val.trim());
        } else {
          finish(selected);
        }
      } else {
        finish(val);
      }
    } else if (e.key === "Tab") {
      e.preventDefault();
      const dir = e.shiftKey ? "left" : "right";
      let finalValue = val;
      if (autocompleteOpen && filteredOptions.length > 0) {
        const selected = filteredOptions[highlightedIdx];
        if (selected.startsWith(`+ Criar Novo: "`)) {
          finalValue = val.trim();
        } else {
          finalValue = selected;
        }
      }
      finish(finalValue);
      setTimeout(() => {
        onNavigate(dir);
      }, 50);
    } else if (isAutocompleteCol && autocompleteOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIdx(prev => (prev + 1) % filteredOptions.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIdx(prev => (prev - 1 + filteredOptions.length) % filteredOptions.length);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputVal = e.target.value;

    if (colIdx === 5 || colIdx === 7) {
      inputVal = formatDateInput(inputVal);
    }

    if (colIdx === 10) {
      inputVal = inputVal.replace(/\D/g, "");
    }

    setVal(inputVal);
    setIsModified(true);
    if (isAutocompleteCol) {
      setAutocompleteOpen(true);
      setHighlightedIdx(0);
    }
  };

  if (colIdx === 9) {
    return (
      <div 
        ref={containerRef}
        tabIndex={0}
        onBlur={(e) => {
          // Check if focus left the container entirely
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (!containerRef.current?.contains(relatedTarget)) {
            setTimeout(() => {
              finish(val);
            }, 200);
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            cancel();
          } else if (e.key === "Tab") {
            e.preventDefault();
            finish(val);
            setTimeout(() => onNavigate(e.shiftKey ? "left" : "right"), 50);
          } else if (e.key === "Enter") {
            e.preventDefault();
            finish(val);
          } else if (e.key === "1") {
            e.preventDefault();
            finish("Pendente");
          } else if (e.key === "2") {
            e.preventDefault();
            finish("Finalizado");
          }
        }}
        className="absolute inset-0 bg-white z-30 flex items-center justify-center box-border ring-2 ring-[#28cd41] rounded-[6px] outline-none overflow-visible cursor-pointer"
        style={{ width: widthStyle }}
      >
        <div className="w-full h-full px-3 py-1.5 flex items-center justify-center font-semibold text-[11px] text-[#1F2937] select-none">
          {val ? (val === "Finalizado" ? "✅ Finalizado" : "⏳ Pendente") : "Selecione..."}
        </div>

        {/* Dropdown panel */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-white border border-[#E5E7EB] rounded-[12px] shadow-[0_12px_30px_rgba(0,0,0,0.12)] p-2 z-[100] w-[150px] flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150"
          onMouseDown={(e) => {
            // Prevent container from losing focus when clicking inside the dropdown
            e.preventDefault();
          }}
        >
          <button
            onClick={() => finish("Pendente")}
            className="w-full h-8 flex items-center justify-center gap-1.5 rounded-[8px] bg-[#FFF7ED] border border-[#F97316]/30 text-[#C2410C] hover:bg-[#FFEDD5] hover:border-[#F97316]/60 font-bold text-xs transition-all active:scale-[0.97] cursor-pointer outline-none"
          >
            ⏳ Pendente
          </button>
          
          <button
            onClick={() => finish("Finalizado")}
            className="w-full h-8 flex items-center justify-center gap-1.5 rounded-[8px] bg-[#E6F8F3] border border-[#10B981]/30 text-[#047857] hover:bg-[#D1F2E8] hover:border-[#10B981]/60 font-bold text-xs transition-all active:scale-[0.97] cursor-pointer outline-none"
          >
            ✅ Finalizado
          </button>

          <button
            onClick={() => finish("")}
            className="w-full h-7 flex items-center justify-center gap-1 rounded-[8px] bg-[#F9FAFB] border border-[#9CA3AF]/20 text-[#4B5563] hover:bg-[#F3F4F6] hover:border-[#9CA3AF]/50 font-semibold text-[10px] transition-all active:scale-[0.97] cursor-pointer outline-none"
          >
            Limpar Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 bg-white z-30 flex items-center box-border ring-2 ring-[#28cd41] overflow-visible" 
      style={{ width: widthStyle }}
    >
      <input
        ref={inputRef}
        type="text"
        value={val}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          setTimeout(() => {
            finish(val);
          }, 200);
        }}
        onFocus={() => {
          if (isAutocompleteCol) {
            setAutocompleteOpen(true);
          }
        }}
        className="w-full h-full px-3 py-1.5 outline-none border-0 bg-transparent text-[#1F2937] font-medium box-border tabular-nums"
        placeholder={placeholders[colIdx]}
      />

      {isAutocompleteCol && autocompleteOpen && filteredOptions.length > 0 && (
        <div className="absolute left-0 top-full mt-1 bg-white border border-[#E5E7EB] rounded-[10px] shadow-[0_10px_25px_rgba(0,0,0,0.08)] py-1.5 z-[100] max-h-[200px] overflow-y-auto w-[240px] text-left custom-scrollbar">
          {filteredOptions.map((opt, optIdx) => {
            const isHighlighted = optIdx === highlightedIdx;
            const isAddNew = opt.startsWith(`+ Criar Novo: `);
            return (
              <div
                key={opt}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (isAddNew) {
                    finish(val.trim());
                  } else {
                    finish(opt);
                  }
                  setAutocompleteOpen(false);
                }}
                onMouseEnter={() => setHighlightedIdx(optIdx)}
                className={`px-3 py-1.5 text-[11px] cursor-pointer font-medium transition-colors ${
                  isHighlighted 
                    ? "bg-emerald-50 text-emerald-700" 
                    : isAddNew
                      ? "text-emerald-500 hover:text-emerald-600 border-t border-gray-100 mt-1 pt-2"
                      : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isAddNew ? (
                  <span className="flex items-center gap-1">
                    <span className="font-bold">+</span> Criar Novo: <span className="font-bold text-gray-800">{val}</span>
                  </span>
                ) : (
                  opt
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Spreadsheet() {
  const {
    sheetData,
    mergedData,
    localEdits,
    isLoading,
    updateRecord,
    addRecord,
    deleteRecord,
    activeFilters,
    setColumnFilter,
    showToast,
    activeStatusFolder,
    setActiveStatusFolder
  } = useApp();

  const [columnWidths, setColumnWidths] = useState<Record<number, string>>({});
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [dropdownSearch, setDropdownSearch] = useState("");
  const [tempCheckedValues, setTempCheckedValues] = useState<string[]>([]);
  const [editingCell, setEditingCell] = useState<{ rowKey: string; colIdx: number } | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [rowSaveFlash, setRowSaveFlash] = useState<Record<string, boolean>>({});
  const [sortConfig, setSortConfig] = useState<{ col: number; dir: "asc" | "desc" } | null>(null);

  const filterBtnRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const cellInputRefs = useRef<HTMLDivElement | null>(null);
  const tbodyRef = useRef<HTMLTableSectionElement | null>(null);

  const handleAddRecord = () => {
    if (activeStatusFolder === "finalized") {
      setActiveStatusFolder("all");
    }
    const newKey = addRecord();
    if (newKey) {
      // Start editing the first cell (Convênio, index 0)
      startEditing(newKey, 0, "");
      setTimeout(() => {
        if (tbodyRef.current) {
          const rows = tbodyRef.current.querySelectorAll("tr");
          if (rows.length > 0) {
            // New row is right before the bottom Add Button row
            const lastRow = rows[rows.length - 2] || rows[rows.length - 1];
            lastRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        }
      }, 100);
    }
  };

  // Load column widths from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("spreadsheet_column_widths");
      if (saved) {
        setColumnWidths(JSON.parse(saved));
      } else {
        setColumnWidths({
          0: "140px",
          1: "180px",
          2: "150px",
          3: "220px",
          4: "260px",
          5: "110px",
          6: "130px",
          7: "115px",
          8: "80px",
          9: "130px",
          10: "120px",
          11: "300px",
          12: "140px"
        });
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (activeDropdown !== null) {
        const target = e.target as HTMLElement;
        if (!target.closest(".filter-dropdown") && !target.closest(".filter-btn")) {
          setActiveDropdown(null);
        }
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [activeDropdown]);

  // Handle column resize drag — fixed closure bug: uses functional setState to save latest widths
  const handleResizeStart = (e: React.MouseEvent, colIdx: number) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = parseInt(columnWidths[colIdx] || "120");

    const onMouseMove = (moveEvent: MouseEvent) => {
      const currentWidth = Math.max(50, startWidth + (moveEvent.clientX - startX));
      const updated = { ...columnWidths, [colIdx]: `${currentWidth}px` };
      setColumnWidths(updated);
    };

    const onMouseUp = () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      // Use functional setState to read latest widths and persist (fixes stale closure)
      setColumnWidths(current => {
        localStorage.setItem("spreadsheet_column_widths", JSON.stringify(current));
        return current;
      });
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  // Handle cell edit trigger
  const startEditing = (rowKey: string, colIdx: number, val: string) => {
    if (colIdx === 6) return;
    setEditingCell({ rowKey, colIdx });
    setEditingValue(val);
  };

  // Helper to navigate between editable cells (Tab key navigation)
  const navigateToNextCell = (rowKey: string, currentColIdx: number, direction: "left" | "right" = "right") => {
    const editableCols = [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12];
    const currentIdxInEditable = editableCols.indexOf(currentColIdx);
    if (currentIdxInEditable === -1) return;

    let nextIdxInEditable = currentIdxInEditable + (direction === "right" ? 1 : -1);
    
    if (nextIdxInEditable >= editableCols.length) {
      // Wrap to the next row, first editable column
      const sortedDisplayData = displayData;
      const currentRowIdx = sortedDisplayData.findIndex(r => String(r[0]) === rowKey);
      if (currentRowIdx !== -1 && currentRowIdx + 1 < sortedDisplayData.length) {
        const nextRowKey = String(sortedDisplayData[currentRowIdx + 1][0]);
        const nextCol = editableCols[0];
        const nextVal = getCellDisplayValue(sortedDisplayData[currentRowIdx + 1], nextCol);
        startEditing(nextRowKey, nextCol, nextVal);
      } else {
        // Last cell of last row, stop editing
        setEditingCell(null);
      }
    } else if (nextIdxInEditable < 0) {
      // Wrap to the previous row, last editable column
      const sortedDisplayData = displayData;
      const currentRowIdx = sortedDisplayData.findIndex(r => String(r[0]) === rowKey);
      if (currentRowIdx !== -1 && currentRowIdx - 1 >= 0) {
        const prevRowKey = String(sortedDisplayData[currentRowIdx - 1][0]);
        const nextCol = editableCols[editableCols.length - 1];
        const nextVal = getCellDisplayValue(sortedDisplayData[currentRowIdx - 1], nextCol);
        startEditing(prevRowKey, nextCol, nextVal);
      } else {
        // First cell of first row, stop editing
        setEditingCell(null);
      }
    } else {
      const nextCol = editableCols[nextIdxInEditable];
      const row = displayData.find(r => String(r[0]) === rowKey);
      if (row) {
        const nextVal = getCellDisplayValue(row, nextCol);
        startEditing(rowKey, nextCol, nextVal);
      }
    }
  };

  // Submit cell edit
  const finishEditing = (rowKey: string, colIdx: number, finalVal: string, originalRow: any[]) => {
    setEditingCell(null);
    finalVal = finalVal.trim();

    if (colIdx === 5 || colIdx === 7) {
      finalVal = normalizeInputDate(finalVal);
    }

    const isConvênioCol = colIdx === 0;

    if (isConvênioCol && !finalVal) {
      showToast("O Convênio não pode ser vazio!", false);
      return;
    }

    const updatedRow = [...originalRow];
    updatedRow[colIdx] = finalVal;

    // Recalculate Dias Passados if Vigência or Data Tomada is updated
    if (colIdx === 5 || colIdx === 7) {
      updatedRow[6] = ""; // Clear to force recalculation
      const newDias = computeDaysPassed(updatedRow);
      updatedRow[6] = newDias !== null ? String(newDias) : "";
    }

    // Auto-fill Comissão if Observação is updated
    if (colIdx === 11) {
      const parsedAvatars = getCommissionAvatars(finalVal);
      const newCommission = parsedAvatars.map(a => a.name).join(", ");
      updatedRow[12] = newCommission; // index 12 is Comissão!
    }

    updateRecord(rowKey, updatedRow);

    setRowSaveFlash(prev => ({ ...prev, [rowKey]: true }));
    setTimeout(() => {
      setRowSaveFlash(prev => {
        const u = { ...prev };
        delete u[rowKey];
        return u;
      });
    }, 12000);
  };

  // Render status badge (Andamento) in premium pill style
  const renderStatusBadge = (val: string) => {
    const s = (val || "").trim();
    if (!s) return null;
    const sLower = s.toLowerCase();

    let badgeClass = "badge-orange";
    let label = "Pendente";

    if (sLower.includes("finalizado") || sLower.includes("concluido")) {
      badgeClass = "badge-green";
      label = "Finalizado";
    }

    return (
      <span className={`premium-pill-badge ${badgeClass}`}>
        {label}
      </span>
    );
  };

  // Render days passed badge (Dias Passados) in premium pill style
  const renderDiasBadge = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) return val || "";

    let badgeClass = "badge-green";
    let label = `${num} dias`;

    if (num > 90) {
      badgeClass = "badge-red"; // Maior que 90 dias -> Vermelho
    } else {
      badgeClass = "badge-green"; // Menos ou igual -> Verde
      if (num < 0) {
        label = `${Math.abs(num)} dias antes`;
      }
    }

    return (
      <span className={`premium-pill-badge ${badgeClass}`}>
        {label}
      </span>
    );
  };

  // ─── Filter Helpers (unified via getCellDisplayValue) ─────────────────────

  const getUnfilteredMergedData = () => {
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
  };

  const getUniqueColumnValues = (colIdx: number): string[] => {
    const unfiltered = getUnfilteredMergedData();
    return Array.from(
      new Set(unfiltered.map(r => getCellDisplayValue(r, colIdx).trim()))
    ).filter(v => v !== "");
  };

  const openFilterDropdown = (colIdx: number) => {
    const allVals = getUniqueColumnValues(colIdx);
    allVals.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

    const selected = activeFilters[colIdx] || [...allVals];
    setTempCheckedValues(selected);
    setDropdownSearch("");
    setActiveDropdown(colIdx);
  };

  const submitFilter = (colIdx: number) => {
    const allVals = getUniqueColumnValues(colIdx);
    if (tempCheckedValues.length === allVals.length) {
      setColumnFilter(colIdx, null);
    } else {
      setColumnFilter(colIdx, tempCheckedValues);
    }
    setActiveDropdown(null);
  };

  const handleToggleSelectAll = (colIdx: number, selectAll: boolean) => {
    if (selectAll) {
      setTempCheckedValues(getUniqueColumnValues(colIdx));
    } else {
      setTempCheckedValues([]);
    }
  };

  // ─── Sort ─────────────────────────────────────────────────────────────────

  const handleSort = (colIdx: number) => {
    setSortConfig(prev => {
      if (prev && prev.col === colIdx) {
        if (prev.dir === "asc") return { col: colIdx, dir: "desc" };
        return null;
      }
      return { col: colIdx, dir: "asc" };
    });
  };

  const getSortedData = (data: any[][]) => {
    if (!sortConfig) return data;
    const { col, dir } = sortConfig;
    const sorted = [...data];

    sorted.sort((a, b) => {
      // Column 6 = computed "Dias Passados" — uses shared util
      if (col === 6) {
        const aDays = computeDaysPassed(a) ?? 0;
        const bDays = computeDaysPassed(b) ?? 0;
        return dir === "asc" ? aDays - bDays : bDays - aDays;
      }

      const aVal = String(a[col] || "").trim();
      const bVal = String(b[col] || "").trim();

      // Date columns (5, 7)
      if (col === 5 || col === 7) {
        const aNum = parseDateToNum(aVal);
        const bNum = parseDateToNum(bVal);
        return dir === "asc" ? aNum - bNum : bNum - aNum;
      }

      // Numeric columns (0, 8, 10)
      if (col === 0 || col === 8 || col === 10) {
        const aNum = parseFloat(aVal.replace(/\D/g, "")) || 0;
        const bNum = parseFloat(bVal.replace(/\D/g, "")) || 0;
        return dir === "asc" ? aNum - bNum : bNum - aNum;
      }

      // Default string comparison
      return dir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
    return sorted;
  };

  // ─── Dropdown Position Helper ─────────────────────────────────────────────

  /** Compute dropdown position accounting for viewport edges (fixes overflow off-screen) */
  const getDropdownPosition = (colIdx: number) => {
    const btn = filterBtnRefs.current[colIdx];
    if (!btn) return { top: "100px", left: "100px" };
    const rect = btn.getBoundingClientRect();
    const ddH = 280; // approximate max dropdown height
    const ddW = 220; // dropdown width
    const fitsBelow = rect.bottom + ddH + 6 < window.innerHeight;
    return {
      top: `${fitsBelow ? rect.bottom + 6 : Math.max(8, rect.top - ddH - 6)}px`,
      left: `${Math.min(window.innerWidth - ddW - 10, Math.max(8, rect.left - 100))}px`,
    };
  };

  const displayData = getSortedData(mergedData);

  return (
    <div className="manual-spreadsheet flex-1 min-h-0 overflow-auto bg-white border border-[#E5E7EB] rounded-[14px] mt-2 custom-scrollbar relative shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <table className="spreadsheet-table w-full border-collapse separate border-spacing-0 text-[11.5px] leading-[1.5]">
        <thead>
          <tr>
            {placeholders.map((colName, idx) => {
              const hasFilterActive = activeFilters[idx] !== undefined;
              const widthStyle = columnWidths[idx] || "120px";
              const isSortable = SORTABLE_COLUMNS.has(idx);
              const isSorted = sortConfig?.col === idx;
              return (
                <th
                  key={idx}
                  style={{ width: widthStyle, minWidth: widthStyle, maxWidth: widthStyle }}
                  className="sticky top-0 bg-[#FAFBFC] backdrop-blur-[10px] text-[#6B7280] font-semibold text-left px-3 py-2.5 border-b border-[#E5E7EB] z-10 select-none leading-tight tracking-[-0.01em] text-[10px] uppercase"
                >
                  <div className="flex items-center gap-1 pr-4 relative">
                    <span className="whitespace-normal break-words leading-[1.3]">{colName}</span>

                    {/* Sort arrows for sortable columns */}
                    {isSortable && (
                      <button
                        onClick={() => handleSort(idx)}
                        className={`sort-btn flex flex-col items-center justify-center -space-y-1 ml-0.5 p-0.5 rounded transition-colors cursor-pointer outline-none border-0 bg-transparent ${isSorted ? "text-[#28cd41]" : "text-[#C4C9D2] hover:text-[#6B7280]"
                          }`}
                        title={isSorted ? (sortConfig?.dir === "asc" ? "Mais antigo → mais novo" : "Mais novo → mais antigo") : "Ordenar"}
                      >
                        <ChevronUp className={`w-2.5 h-2.5 transition-opacity ${isSorted && sortConfig?.dir === "desc" ? "opacity-30" : "opacity-100"}`} />
                        <ChevronDown className={`w-2.5 h-2.5 transition-opacity ${isSorted && sortConfig?.dir === "asc" ? "opacity-30" : "opacity-100"}`} />
                      </button>
                    )}

                    {/* Filter button */}
                    <button
                      ref={(el) => { filterBtnRefs.current[idx] = el; }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeDropdown === idx) {
                          setActiveDropdown(null);
                        } else {
                          openFilterDropdown(idx);
                        }
                      }}
                      className={`filter-btn p-1 rounded hover:bg-black/5 outline-none cursor-pointer text-[#C4C9D2] hover:text-[#6B7280] transition-colors border-0 bg-transparent ${hasFilterActive ? "text-[#28cd41]! bg-emerald-50" : ""
                        }`}
                    >
                      <Filter className="w-2.5 h-2.5" />
                    </button>
                  </div>

                  {/* Drag Resize Handle */}
                  <div
                    onMouseDown={(e) => handleResizeStart(e, idx)}
                    className="resize-handle absolute top-0 right-0 bottom-0 w-1.5 cursor-col-resize z-20 hover:bg-emerald-400/40 transition-colors"
                  />
                </th>
              );
            })}
            <th className="sticky top-0 bg-[#FAFBFC] backdrop-blur-[10px] text-[#6B7280] font-semibold text-center px-3 py-2.5 border-b border-[#E5E7EB] z-10 select-none leading-tight tracking-[-0.01em] text-[10px] uppercase w-[60px] min-w-[60px]">
              Excluir
            </th>
          </tr>
        </thead>
        <tbody ref={tbodyRef}>
          {isLoading ? (
            <tr>
              <td colSpan={14} className="text-center p-8 text-[#9CA3AF] bg-white text-xs">
                Carregando dados da planilha do Google...
              </td>
            </tr>
          ) : displayData.length === 0 ? (
            <tr>
              <td colSpan={14} className="text-center p-8 text-[#9CA3AF] bg-white text-xs">
                Nenhum convênio encontrado.
              </td>
            </tr>
          ) : (
            displayData.map((row, idx) => {
              const rowKey = String(row[0]);
              const isFlashActive = rowSaveFlash[rowKey];
              const isEven = idx % 2 === 1;
              return (
                <tr
                  key={`${rowKey}_${idx}`}
                  className={`transition-colors duration-100 relative hover:z-20 hover:bg-[#F0FDF4]/60 ${isFlashActive ? "row-save-flash" : ""
                    } ${isEven ? "bg-[#FAFBFC]" : "bg-white"}`}
                >
                  {row.slice(0, 13).map((cellValue: any, colIdx: number) => {
                    const isEditing = editingCell?.rowKey === rowKey && editingCell?.colIdx === colIdx;
                    let displayVal = cellValue || "";
                    if (colIdx === 0 && displayVal.startsWith("NEW_")) {
                      displayVal = "";
                    }

                    if (colIdx === 5 || colIdx === 7) {
                      displayVal = formatDateToDDMMYYYY(displayVal);
                    }

                    // Column 6 = computed "Dias Passados" — single util call
                    if (colIdx === 6) {
                      displayVal = getDaysPassedString(row);
                    }

                    let tdStyles = "border-b border-[#F0F1F3] bg-transparent p-0 overflow-visible relative hover:z-30";
                    if (colIdx === 0 || colIdx === 5 || colIdx === 6 || colIdx === 7 || colIdx === 8 || colIdx === 10 || colIdx === 12) {
                      tdStyles += " text-center";
                    }

                    const widthStyle = columnWidths[colIdx] || "120px";

                    return (
                      <td
                        key={colIdx}
                        className={tdStyles}
                        style={{ width: widthStyle, minWidth: widthStyle, maxWidth: widthStyle }}
                      >
                        {isEditing ? (
                          <CellEditor
                            rowKey={rowKey}
                            colIdx={colIdx}
                            row={row}
                            initialVal={displayVal}
                            widthStyle={widthStyle}
                            onFinish={(val) => {
                              finishEditing(rowKey, colIdx, val, row);
                            }}
                            onCancel={() => setEditingCell(null)}
                            onNavigate={(dir) => navigateToNextCell(rowKey, colIdx, dir)}
                            getUniqueValues={getUniqueColumnValues}
                          />
                        ) : (
                          <div
                            onClick={() => startEditing(rowKey, colIdx, displayVal)}
                            className={`cell-value select-none w-full min-h-[34px] px-3 py-2 box-border font-medium cursor-text leading-[1.45] text-[#1F2937] ${(colIdx === 0 || colIdx === 5 || colIdx === 6 || colIdx === 7 || colIdx === 8 || colIdx === 10)
                              ? "flex items-center justify-center text-center"
                              : (colIdx === 1 || colIdx === 3 || colIdx === 4 || colIdx === 11 || colIdx === 12)
                                ? "overflow-visible"
                                : "truncate"
                              } ${colIdx === 0 ? "tabular-nums" : ""
                              }`}
                            style={{
                              width: widthStyle,
                              minWidth: widthStyle,
                              maxWidth: widthStyle,
                              whiteSpace: (colIdx === 1 || colIdx === 3 || colIdx === 4 || colIdx === 11) ? "normal" : "nowrap",
                              overflow: (colIdx === 12 || colIdx === 6) ? "visible" : "hidden"
                            }}
                          >
                            {colIdx === 12 ? (
                              (() => {
                                const commissionText = displayVal || String(row[11] || "");
                                const avatars = getCommissionAvatars(commissionText);
                                return avatars.length > 0 ? (
                                  <div className="inline-flex items-center justify-center gap-0 overflow-visible relative py-1">
                                    {avatars.map((member, avIdx) => (
                                      <div
                                        key={avIdx}
                                        className="relative w-[32px] h-[32px] -ml-1.5 cursor-pointer first:ml-0 group"
                                        data-tooltip={member.name}
                                      >
                                        <div className="w-[32px] h-[32px] flex items-center justify-center group-hover:scale-110 group-hover:-translate-y-0.5 transition-transform duration-150 ease-out">
                                          <img
                                            src={member.img}
                                            alt={member.name}
                                            className="object-contain w-full h-full"
                                          />
                                        </div>
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 scale-95 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150 ease-out bg-[#1F2937] text-white font-semibold text-[10px] px-2 py-1 rounded-md shadow-lg pointer-events-none whitespace-nowrap z-50 leading-none">
                                          {member.name}
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-[4px] border-t-[4px] border-x-transparent border-t-[#1F2937]" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  displayVal
                                );
                              })()
                            ) : colIdx === 6 ? (
                              renderDiasBadge(displayVal)
                            ) : colIdx === 9 ? (
                              renderStatusBadge(displayVal)
                            ) : (colIdx === 0 || colIdx === 5 || colIdx === 7 || colIdx === 8 || colIdx === 10) ? (
                              <span className="truncate max-w-full text-left">{displayVal}</span>
                            ) : (
                              displayVal
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                  <td className="border-b border-[#F0F1F3] p-0 text-center w-[60px] min-w-[60px] max-w-[60px]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const isNew = rowKey.startsWith("NEW_");
                        const confirmMsg = isNew
                          ? "Tem certeza de que deseja excluir este novo convênio?"
                          : `Tem certeza de que deseja excluir o convênio ${rowKey}?`;
                        if (confirm(confirmMsg)) {
                          deleteRecord(rowKey);
                        }
                      }}
                      className="p-1.5 rounded-[6px] hover:bg-red-50 text-[#86868b] hover:text-red-500 transition-colors border-0 bg-transparent outline-none cursor-pointer inline-flex items-center justify-center"
                      title="Excluir Convênio"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })
          )}

          {/* Inline bottom Add Button */}
          <tr className="no-print bg-[#FAFBFC]">
            <td colSpan={13} className="text-center p-3">
              <button
                onClick={handleAddRecord}
                className="inline-flex items-center justify-center gap-1.5 px-4 h-8 bg-emerald-50 text-[#28cd41] border border-dashed border-emerald-300 rounded-[6px] text-[11px] font-semibold hover:bg-emerald-100/70 transition-colors cursor-pointer"
              >
                + Adicionar Nova Tomada
              </button>
            </td>
          </tr>
        </tbody>
      </table>

      {activeDropdown !== null && (
        <div
          className="filter-dropdown fixed bg-white border border-[#E5E7EB] rounded-[12px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-3 z-50 flex flex-col gap-2 w-[220px]"
          style={getDropdownPosition(activeDropdown)}
        >
          <input
            type="text"
            placeholder="Filtrar valores..."
            value={dropdownSearch}
            onChange={(e) => setDropdownSearch(e.target.value)}
            className="w-full h-7 px-2 border border-[#E5E7EB] rounded-[6px] outline-none text-[11px] focus:border-[#28cd41]"
          />

          <div className="flex justify-between border-b border-[#F1F3F5] pb-1.5 text-[10px]">
            <button
              onClick={() => handleToggleSelectAll(activeDropdown, true)}
              className="text-[#28cd41] font-bold hover:underline cursor-pointer bg-transparent border-0 outline-none"
            >
              Selecionar tudo
            </button>
            <button
              onClick={() => handleToggleSelectAll(activeDropdown, false)}
              className="text-[#28cd41] font-bold hover:underline cursor-pointer bg-transparent border-0 outline-none"
            >
              Limpar
            </button>
          </div>

          <div className="max-h-[140px] overflow-y-auto flex flex-col gap-1.5 custom-scrollbar pr-1">
            {getUniqueColumnValues(activeDropdown)
              .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }))
              .filter(val => val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(dropdownSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")))
              .map((val) => {
                const isChecked = tempCheckedValues.includes(val);
                return (
                  <label key={val} className="flex items-center gap-2 cursor-pointer select-none text-[#2d3142]">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setTempCheckedValues(prev =>
                          isChecked ? prev.filter(v => v !== val) : [...prev, val]
                        );
                      }}
                      className="m-0 cursor-pointer accent-[#28cd41]"
                    />
                    <span className="truncate max-w-[150px]">{val}</span>
                  </label>
                );
              })}
          </div>

          <div className="flex gap-2 justify-end border-t border-[#F1F3F5] pt-2 mt-1">
            <button
              onClick={() => setActiveDropdown(null)}
              className="h-7 px-2.5 text-xs font-semibold text-[#86868b] hover:bg-black/5 rounded-[6px] bg-transparent border-0 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={() => submitFilter(activeDropdown)}
              className="h-7 px-2.5 text-xs font-semibold bg-[#28cd41] text-white hover:bg-[#20a632] rounded-[6px] border-0 cursor-pointer shadow-[0_2px_6px_rgba(40,205,65,0.2)]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
