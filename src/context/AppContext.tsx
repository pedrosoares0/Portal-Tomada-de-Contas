"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { parseDate, getCellDisplayValue } from "@/lib/utils";

export interface LocalEdits {
  added: any[][];
  updated: Record<string, any[]>;
  deleted: string[];
}

export interface ViagensData {
  month: string;
  rows: string[][];
}

interface AppContextProps {
  sheetData: any[][]; // Raw sheet data from Google
  mergedData: any[][]; // Raw data + local edits (filtered by search and columns)
  localEdits: LocalEdits;
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeCommissionFilter: string | null;
  toggleCommissionFilter: (name: string | null) => void;
  activeFilters: Record<number, string[]>;
  setColumnFilter: (colIndex: number, values: string[] | null) => void;
  activeYearFolder: string;
  setActiveYearFolder: (year: string) => void;
  activeStatusFolder: string;
  setActiveStatusFolder: (status: string) => void;
  scriptUrl: string;
  saveScriptUrl: (url: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isViagensOpen: boolean;
  setIsViagensOpen: (open: boolean) => void;
  isSyncOpen: boolean;
  setIsSyncOpen: (open: boolean) => void;
  viagensData: ViagensData;
  saveViagensData: (month: string, rows: string[][]) => void;

  // CRUD Actions
  addRecord: () => string;
  updateRecord: (key: string, recordValues: any[]) => void;
  deleteRecord: (key: string) => void;
  fetchSheetData: (force?: boolean, silent?: boolean) => Promise<void>;
  triggerBilateralSync: () => Promise<void>;
  showToast: (msg: string, success?: boolean) => void;
  toastMessage: { msg: string; success: boolean } | null;
  isSyncing: boolean;
}

const reconcileLocalEdits = (freshSheetData: any[][], currentEdits: LocalEdits): LocalEdits => {
  const nextEdits: LocalEdits = {
    added: [],
    updated: {},
    deleted: []
  };

  const freshIds = new Set(freshSheetData.map(row => String(row[0])));

  // 1. Reconcile deleted (keep only if still present in fresh sheet)
  for (const deletedId of currentEdits.deleted) {
    if (freshIds.has(deletedId)) {
      nextEdits.deleted.push(deletedId);
    }
  }

  // 2. Reconcile added (keep only if not yet present in fresh sheet)
  for (const addedRow of currentEdits.added) {
    const addedId = String(addedRow[0]);
    if (!freshIds.has(addedId)) {
      nextEdits.added.push(addedRow);
    }
  }

  // 3. Reconcile updated (keep only if fresh sheet row doesn't match the update)
  for (const [key, updatedRow] of Object.entries(currentEdits.updated)) {
    const freshRow = freshSheetData.find(row => String(row[0]) === key);
    if (freshRow) {
      let allMatch = true;
      for (let i = 0; i < Math.max(updatedRow.length, freshRow.length); i++) {
        if (String(updatedRow[i] || "") !== String(freshRow[i] || "")) {
          allMatch = false;
          break;
        }
      }
      if (!allMatch) {
        nextEdits.updated[key] = updatedRow;
      }
    } else {
      nextEdits.updated[key] = updatedRow;
    }
  }

  return nextEdits;
};

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1KAraKreIDk0gdAOMHnBL8fiZll0FaYsej_aHmGBFnUQ/gviz/tq?tqx=out:json";

const AppContext = createContext<AppContextProps | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [localEdits, setLocalEdits] = useState<LocalEdits>({ added: [], updated: {}, deleted: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCommissionFilter, setActiveCommissionFilter] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<number, string[]>>({});
  const [activeYearFolder, setActiveYearFolder] = useState<string>("all");
  const [activeStatusFolder, setActiveStatusFolder] = useState<string>("all");
  const [scriptUrl, setScriptUrl] = useState("");
  const [activeTab, setActiveTab] = useState("inicio");
  const [isViagensOpen, setIsViagensOpen] = useState(false);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [viagensData, setViagensData] = useState<ViagensData>({ month: "", rows: [] });
  const [toastMessage, setToastMessage] = useState<{ msg: string; success: boolean } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Ref to compare polling data — prevents unnecessary re-renders when data hasn't changed
  const lastDataJsonRef = useRef("");

  // Helper to show toasts
  const showToast = useCallback((msg: string, success: boolean = true) => {
    setToastMessage({ msg, success });
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Load initial configurations from LocalStorage
  useEffect(() => {
    // 1. Script URL
    const savedUrl = localStorage.getItem("google_script_url") || "https://script.google.com/macros/s/AKfycby4Nm0ycDl9f5rxA5UPSe-W8FzmZE1ZtAgCCZGHNxwSoabEvR3srUsn58vCHnZzG_CWgg/exec";
    setScriptUrl(savedUrl);

    // 2. Local Edits
    try {
      const savedEdits = localStorage.getItem("sheet_local_edits");
      if (savedEdits) {
        const parsed = JSON.parse(savedEdits);
        setLocalEdits({
          added: parsed.added || [],
          updated: parsed.updated || {},
          deleted: parsed.deleted || []
        });
      }
    } catch (e) {
      console.error("Erro ao carregar edições locais", e);
    }

    // 3. Viagens data for default month
    try {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, "0");
      const defaultMonth = `${yyyy}-${mm}`;
      const savedViagens = localStorage.getItem(`viagens:${defaultMonth}`);
      if (savedViagens) {
        const parsed = JSON.parse(savedViagens);
        setViagensData({ month: defaultMonth, rows: parsed.rows || [] });
      } else {
        setViagensData({ month: defaultMonth, rows: Array(4).fill(null).map(() => Array(5).fill("")) });
      }
    } catch (e) {
      console.error("Erro ao carregar viagens padrão", e);
    }
  }, []);

  // Save edits to LocalStorage when they change
  const saveLocalEdits = (newEdits: LocalEdits) => {
    setLocalEdits(newEdits);
    localStorage.setItem("sheet_local_edits", JSON.stringify(newEdits));
  };

  // Helper to merge sheetData with local edits
  const getMergedData = (base: any[][], edits: LocalEdits): any[][] => {
    let merged = base.filter(row => {
      const convenio = String(row[0]);
      return !edits.deleted.includes(convenio);
    });

    merged = merged.map(row => {
      const convenio = String(row[0]);
      if (edits.updated[convenio]) {
        return edits.updated[convenio];
      }
      return row;
    });

    return [...merged, ...edits.added];
  };

  // Sync to Google Sheets via Apps Script Web App
  const triggerBilateralSync = useCallback(async (currentEdits?: LocalEdits, currentData?: any[][]) => {
    const activeUrl = localStorage.getItem("google_script_url") || scriptUrl;
    const editsToSync = currentEdits || localEdits;
    const dataToSync = currentData || getMergedData(sheetData, editsToSync);

    if (!activeUrl) {
      console.log("Sync ignorado: URL do Google Apps Script não configurada.");
      return;
    }

    setIsSyncing(true);
    try {
      const payload = {
        action: "sync",
        data: dataToSync,
        edits: editsToSync
      };

      await fetch(activeUrl, {
        method: "POST",
        body: JSON.stringify(payload),
        mode: "no-cors" // Required for Google Apps Script cross-origin
      });

      showToast("Sincronizado com o banco de dados!");
      await fetchSheetData(true, true);
    } catch (e: any) {
      console.error("Erro na sincronização", e);
      showToast("Erro ao sincronizar: " + e.message, false);
    } finally {
      setIsSyncing(false);
    }
  }, [scriptUrl, localEdits, sheetData, showToast]);

  // Fetch sheet data (with SWR caching + diff-check to prevent unnecessary re-renders)
  const fetchSheetData = useCallback(async (force = false, silent = false) => {
    if (!silent && lastDataJsonRef.current === "") {
      setIsLoading(true);
    }

    try {
      // 1. SWR Cache loading (only on initial mount, not on forced refreshes)
      if (!force && lastDataJsonRef.current === "") {
        const cached = localStorage.getItem("sheet_csv_cache");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            lastDataJsonRef.current = cached;
            setSheetData(parsed);
            setIsLoading(false);
          } catch (e) {
            console.error("Erro ao ler cache", e);
          }
        }
      }

      let loaded = false;
      const cacheBust = `&t=${Date.now()}`;
      const activeUrl = localStorage.getItem("google_script_url") || scriptUrl;

      // Try Apps Script first
      if (activeUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const urlWithBust = activeUrl.includes("?") ? `${activeUrl}&t=${Date.now()}` : `${activeUrl}?t=${Date.now()}`;
          const response = await fetch(urlWithBust, {
            cache: "no-cache",
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            const rows = await response.json();
            if (Array.isArray(rows) && rows.length > 0) {
              const finalRows = rows.slice(1).filter(r => r && r.length && r[0]).map(row => {
                const rowData = [];
                for (let i = 0; i < 14; i++) {
                  rowData.push(row[i] !== undefined && row[i] !== null ? String(row[i]) : "");
                }
                return rowData;
              });
              // Diff check: only update state if data actually changed
              const newJson = JSON.stringify(finalRows);
              if (newJson !== lastDataJsonRef.current) {
                lastDataJsonRef.current = newJson;
                setSheetData(finalRows);
                localStorage.setItem("sheet_csv_cache", newJson);
              }
              setLocalEdits(current => {
                const reconciled = reconcileLocalEdits(finalRows, current);
                localStorage.setItem("sheet_local_edits", JSON.stringify(reconciled));
                return reconciled;
              });
              loaded = true;
              setIsLoading(false);
            }
          }
        } catch (scriptErr) {
          console.warn("Falha ao buscar do Apps Script, tentando API pública...", scriptErr);
        }
      }

      // JSONP Fallback if Apps Script failed or isn't set
      if (!loaded) {
        const response = await fetch(`${SHEET_URL}${cacheBust}`);
        const text = await response.text();

        // Parse the google gviz json format
        const match = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*?)\);/);
        if (match && match[1]) {
          const json = JSON.parse(match[1]);
          if (json.status === "ok" && json.table && json.table.rows) {
            const parsedRows = json.table.rows.map((r: any) => {
              const cells = r.c || [];
              const rowData = [];
              for (let i = 0; i < 14; i++) {
                const cell = cells[i];
                rowData.push(cell && cell.v !== null && cell.v !== undefined ? String(cell.v) : "");
              }
              return rowData;
            });
            const finalRows = parsedRows.filter((r: any) => r[0] && r[0] !== "Convenio" && r[0] !== "Convênio");
            // Diff check: only update state if data actually changed
            const newJson = JSON.stringify(finalRows);
            if (newJson !== lastDataJsonRef.current) {
              lastDataJsonRef.current = newJson;
              setSheetData(finalRows);
              localStorage.setItem("sheet_csv_cache", newJson);
            }
            setLocalEdits(current => {
              const reconciled = reconcileLocalEdits(finalRows, current);
              localStorage.setItem("sheet_local_edits", JSON.stringify(reconciled));
              return reconciled;
            });
            setIsLoading(false);
          }
        }
      }
    } catch (e: any) {
      console.error(e);
      if (!silent) {
        showToast("Erro ao carregar planilha: " + e.message, false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [scriptUrl, showToast]);

  // Periodic polling for sheets revalidation (SWR)
  useEffect(() => {
    fetchSheetData();

    const interval = setInterval(() => {
      // Avoid polling while editing a cell to prevent focus/content disruption
      const activeEl = document.activeElement;
      const isEditing = activeEl && (
        activeEl.getAttribute("contenteditable") === "true" ||
        activeEl.tagName === "INPUT" ||
        activeEl.tagName === "TEXTAREA"
      );

      if (!isEditing) {
        console.log("Revalidando dados da planilha do Google em segundo plano...");
        fetchSheetData(true, true);
      }
    }, 12000); // 12 seconds revalidation window

    return () => clearInterval(interval);
  }, [fetchSheetData]);

  // CRUD Actions
  const addRecord = useCallback(() => {
    const newConvenio = "NEW_" + Math.floor(100000 + Math.random() * 900000);

    let initialYear = new Date().getFullYear().toString();
    if (activeYearFolder !== "all" && activeYearFolder !== "2020-2016") {
      initialYear = activeYearFolder;
    }

    const newRow = [
      newConvenio,
      "", // Programa
      "", // Município
      "", // Entidade
      "", // Objeto
      "", // Vigência
      "", // Dias Passados
      "", // Data Tomada
      initialYear, // Ano
      "", // Andamento (starts empty)
      "", // Código Portaria
      "", // Observação
      "", // Comissão default (starts empty)
      "" // Resultado default (starts empty)
    ];

    const updatedAdded = [...localEdits.added, newRow];
    const newEdits = { ...localEdits, added: updatedAdded };
    saveLocalEdits(newEdits);
    showToast("Novo convênio adicionado. Edite as células!");
    return newConvenio;
  }, [localEdits, showToast, activeYearFolder]);

  const updateRecord = useCallback((key: string, recordValues: any[]) => {
    const isNew = localEdits.added.some(r => String(r[0]) === key);
    let newEdits: LocalEdits;

    if (isNew) {
      const updatedAdded = localEdits.added.map(r => String(r[0]) === key ? recordValues : r);
      newEdits = { ...localEdits, added: updatedAdded };
    } else {
      const updatedMap = { ...localEdits.updated, [key]: recordValues };
      newEdits = { ...localEdits, updated: updatedMap };
    }

    saveLocalEdits(newEdits);
    showToast("Edição salva localmente");

    // Bilateral sync trigger
    const merged = getMergedData(sheetData, newEdits);
    triggerBilateralSync(newEdits, merged);
  }, [localEdits, sheetData, triggerBilateralSync, showToast]);

  const deleteRecord = useCallback((key: string) => {
    let newEdits: LocalEdits;
    const isNew = localEdits.added.some(r => String(r[0]) === key);

    if (isNew) {
      const updatedAdded = localEdits.added.filter(r => String(r[0]) !== key);
      newEdits = { ...localEdits, added: updatedAdded };
    } else {
      const updatedDeleted = [...localEdits.deleted, key];
      newEdits = { ...localEdits, deleted: updatedDeleted };
    }

    saveLocalEdits(newEdits);
    showToast("Convênio removido!");

    const merged = getMergedData(sheetData, newEdits);
    triggerBilateralSync(newEdits, merged);
  }, [localEdits, sheetData, triggerBilateralSync, showToast]);

  // Custom configuration setters
  const saveScriptUrl = useCallback((url: string) => {
    const trimmed = url.trim();
    setScriptUrl(trimmed);
    localStorage.setItem("google_script_url", trimmed);
    showToast("Configuração de sincronização salva!");
    fetchSheetData(true);
  }, [showToast, fetchSheetData]);

  const saveViagensData = useCallback((month: string, rows: string[][]) => {
    const payload = { month, rows };
    setViagensData(payload);
    localStorage.setItem(`viagens:${month}`, JSON.stringify(payload));
  }, []);

  const toggleCommissionFilter = useCallback((name: string | null) => {
    setActiveCommissionFilter(prev => prev === name ? null : name);
  }, []);

  const setColumnFilter = useCallback((colIndex: number, values: string[] | null) => {
    setActiveFilters(prev => {
      const updated = { ...prev };
      if (values === null || !values.length) {
        delete updated[colIndex];
      } else {
        updated[colIndex] = values;
      }
      return updated;
    });
  }, []);

  // Compute active merged data filtered by Search and Filters — useMemo instead of useCallback
  const filteredData = useMemo(() => {
    const baseMerged = getMergedData(sheetData, localEdits);
    const cleanQuery = searchQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    return baseMerged.filter(row => {
      // 1. Search filter
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

      // 2. Checkbox Column filters — uses shared getCellDisplayValue for consistency
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

      // 3. Sidebar commission filter
      let matchCommission = true;
      if (activeCommissionFilter) {
        const commText = String(row[12] || "").trim();
        const obsText = String(row[11] || "").trim();
        const textToSearch = commText ? commText : obsText;
        const normSearch = textToSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const filterName = activeCommissionFilter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        if (filterName.includes("joao")) {
          // Match Joao Rios but NOT Joao Sena
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
          // General fallback
          if (!normSearch.includes(filterName)) {
            matchCommission = false;
          }
        }
      }

      // 4. Year folder filter
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

      // 5. Status folder filter
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

      return matchSearch && matchFilters && matchCommission && matchYearFolder && matchStatusFolder;
    });
  }, [sheetData, localEdits, searchQuery, activeFilters, activeCommissionFilter, activeYearFolder, activeStatusFolder]);

  return (
    <AppContext.Provider
      value={{
        sheetData,
        mergedData: filteredData,
        localEdits,
        isLoading,
        searchQuery,
        setSearchQuery,
        activeCommissionFilter,
        toggleCommissionFilter,
        activeFilters,
        setColumnFilter,
        activeYearFolder,
        setActiveYearFolder,
        activeStatusFolder,
        setActiveStatusFolder,
        scriptUrl,
        saveScriptUrl,
        activeTab,
        setActiveTab,
        isViagensOpen,
        setIsViagensOpen,
        isSyncOpen,
        setIsSyncOpen,
        viagensData,
        saveViagensData,
        addRecord,
        updateRecord,
        deleteRecord,
        fetchSheetData,
        triggerBilateralSync,
        showToast,
        toastMessage,
        isSyncing
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp deve ser usado dentro de um AppProvider");
  }
  return context;
}
