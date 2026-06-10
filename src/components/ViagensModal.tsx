"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { X, Plus, Printer, Save } from "lucide-react";

export default function ViagensModal() {
  const { isViagensOpen, setIsViagensOpen, showToast } = useApp();
  const [selectedMonth, setSelectedMonth] = useState("");
  const [rows, setRows] = useState<string[][]>([]);

  // Pre-fill current month on mount
  useEffect(() => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const currentMonth = `${yyyy}-${mm}`;
    setSelectedMonth(currentMonth);
    loadMonthData(currentMonth);
  }, []);

  const sanitizeRows = (loadedRows: any[]): string[][] => {
    return loadedRows.map((r: any) => {
      if (!Array.isArray(r)) return Array(5).fill("");
      const row = r.map(c => String(c || ""));
      if (row.length === 6) {
        // Drop the "Objeto" column at index 2
        return [row[0], row[1], row[3], row[4], row[5]];
      }
      if (row.length < 5) {
        return [...row, ...Array(5 - row.length).fill("")];
      }
      return row.slice(0, 5);
    });
  };

  // Load viajes data for the selected month
  const loadMonthData = async (month: string) => {
    if (!month) return;
    
    // 1. Try loading from the server backend API
    try {
      const response = await fetch(`/api/viagens?month=${month}`);
      if (response.ok) {
        const resJson = await response.json();
        if (resJson && Array.isArray(resJson.rows)) {
          setRows(sanitizeRows(resJson.rows));
          return;
        }
      }
    } catch (e) {
      console.warn("Failed to load voyages from server API, trying localStorage...", e);
    }

    // 2. Try loading from localStorage
    try {
      const saved = localStorage.getItem(`viagens:${month}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.rows)) {
          setRows(sanitizeRows(parsed.rows));
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // Default fallback - 4 empty rows with 5 columns each (no Objeto column)
    setRows(Array(4).fill(null).map(() => Array(5).fill("")));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const m = e.target.value;
    setSelectedMonth(m);
    loadMonthData(m);
  };

  // Date masks for Data Saída (col 3) and Data Retorno (col 4)
  const formatDDMM = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + "/" + digits.slice(2);
  };

  const normalizeDDMM = (val: string) => {
    const d = val.replace(/\D/g, "");
    let dd = d.slice(0, 2);
    let mm = d.slice(2, 4);
    if (!dd) dd = "";
    if (!mm) mm = "";
    if (dd) dd = String(Math.max(1, Math.min(31, parseInt(dd, 10)))).padStart(2, "0");
    if (mm) mm = String(Math.max(1, Math.min(12, parseInt(mm, 10)))).padStart(2, "0");
    if (dd && mm) return `${dd}/${mm}`;
    if (dd) return dd;
    return "";
  };

  const handleCellBlur = (rIdx: number, cIdx: number, val: string) => {
    if (cIdx === 3 || cIdx === 4) {
      const normalized = normalizeDDMM(val);
      updateCell(rIdx, cIdx, normalized);
    }
  };

  const handleCellInput = (rIdx: number, cIdx: number, val: string) => {
    let finalVal = val;
    if (cIdx === 3 || cIdx === 4) {
      finalVal = formatDDMM(val);
    }
    updateCell(rIdx, cIdx, finalVal);
  };

  const updateCell = (rIdx: number, cIdx: number, val: string) => {
    setRows(prev => {
      const next = [...prev];
      next[rIdx] = [...next[rIdx]];
      next[rIdx][cIdx] = val;
      return next;
    });
  };

  const addRow = () => {
    setRows(prev => [...prev, Array(5).fill("")]);
  };

  const handleSave = async () => {
    if (!selectedMonth) return;
    // Filter out rows that are entirely empty
    const filteredRows = rows.filter(r => r.some(cell => cell.trim() !== ""));
    
    // Save to localStorage as fallback
    const payload = { month: selectedMonth, rows: filteredRows };
    localStorage.setItem(`viagens:${selectedMonth}`, JSON.stringify(payload));

    // Save to server API
    let savedOnServer = false;
    try {
      const response = await fetch("/api/viagens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ month: selectedMonth, rows: filteredRows }),
      });
      if (response.ok) {
        savedOnServer = true;
      }
    } catch (e) {
      console.error("Failed to save voyages on server:", e);
    }

    const [yyyy, mm] = selectedMonth.split("-");
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const monthName = monthNames[parseInt(mm, 10) - 1] || mm;

    if (savedOnServer) {
      showToast(`Tabela salva no servidor • ${monthName}/${yyyy}`);
    } else {
      showToast(`Salva localmente (servidor indisponível) • ${monthName}/${yyyy}`, false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getFormattedMonthLabel = () => {
    if (!selectedMonth) return "";
    const [yyyy, mm] = selectedMonth.split("-");
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const monthName = monthNames[parseInt(mm, 10) - 1] || mm;
    return `${monthName}/${yyyy}`;
  };

  if (!isViagensOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm z-[100] flex justify-end print:absolute print:inset-0 print:bg-white print:backdrop-blur-none print:z-0">
      {/* Print-specific style override */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide main dashboard, sidebar and modals overlay background during voyages print */
          body > :not(#viagens-print-area-container) {
            display: none !important;
          }
          #viagens-print-area-container {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            backdrop-filter: none !important;
            -webkit-backdrop-filter: none !important;
          }
          @page {
            size: portrait;
            margin: 1.5cm;
          }
        }
      `}} />

      {/* Click Outside overlay */}
      <div className="absolute inset-0 print:hidden" onClick={() => setIsViagensOpen(false)} />

      {/* Slide-out Sheet Card / Print Area Container */}
      <div 
        id="viagens-print-area-container"
        className="relative w-full max-w-[850px] h-full bg-white/95 backdrop-blur-[25px] shadow-[0_0_50px_rgba(0,0,0,0.1)] border-l border-black/5 p-6 flex flex-col justify-between z-10 animate-in slide-in-from-right duration-300 print:static print:w-full print:shadow-none print:border-none print:p-0 print:m-0"
      >
        <div className="flex flex-col gap-6 overflow-y-auto pr-1 custom-scrollbar print:overflow-visible print:pr-0">
          
          {/* Modal Header */}
          <div className="flex justify-between items-center pb-4 border-b border-black/5 print:hidden">
            <div>
              <h2 className="text-lg font-bold text-[#1d1d1f] tracking-tight">Relação de Viagens</h2>
              <p className="text-[11px] text-[#86868b] mt-0.5">Programações de viagem e diárias do setor</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Select Month Pill */}
              <div className="flex items-center gap-2">
                <label htmlFor="viagens-month-input" className="text-[11px] font-bold text-[#86868b]">Mês:</label>
                <input
                  id="viagens-month-input"
                  type="month"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="h-8 px-3 text-xs font-semibold bg-black/5 rounded-full border-0 outline-none cursor-pointer text-[#2d3142]"
                />
              </div>
              <button
                onClick={() => setIsViagensOpen(false)}
                className="p-1.5 rounded-full hover:bg-black/5 text-[#86868b] hover:text-[#1d1d1f] transition-colors cursor-pointer outline-none border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* PRINT ONLY Header */}
          <div className="hidden print:block mb-8 pb-4 border-b-2 border-slate-900">
            <div className="flex justify-between items-center w-full mb-6">
              {/* Left Logo (CAR) */}
              <div className="relative w-40 h-10">
                <img
                  src="https://www.ba.gov.br/car/sites/site-car/files/migracao_2024/arquivos/files/logo_docs.png"
                  alt="Logo CAR"
                  className="object-contain w-full h-full"
                />
              </div>
              
              {/* Right Logo (Governo da Bahia) */}
              <div className="relative w-44 h-12">
                <img
                  src="https://www.ba.gov.br/comunicacao/modules/custom/bagov_base_blocks/assets/images/logo-governo-rodape.png"
                  alt="Governo da Bahia"
                  className="object-contain w-full h-full"
                />
              </div>
            </div>
            
            <div className="text-center">
              <h1 className="text-[14pt] font-black text-slate-950 uppercase tracking-tight leading-none">
                Relação de Viagens e Programação de Diárias
              </h1>
              <h2 className="text-[10pt] font-bold text-slate-600 mt-1.5 uppercase tracking-wider">
                Setor de Tomada de Contas Especial (TCE)
              </h2>
              <div className="inline-block mt-3 px-4 py-1 border border-slate-950 rounded bg-slate-50 text-[10pt] font-extrabold text-slate-950">
                Mês de Referência: <span className="underline decoration-2">{getFormattedMonthLabel()}</span>
              </div>
            </div>
          </div>

          {/* Viagens Spreadsheet Table */}
          <div className="border border-[#EAECEF] rounded-[12px] bg-white overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.02)] print:border-slate-800 print:rounded-none print:shadow-none">
            <table className="w-full border-collapse text-xs print:text-[10pt]">
              <thead>
                <tr className="bg-[#F5F5F7] text-[#5C6479] font-bold border-b border-[#EAECEF] print:bg-slate-50 print:border-slate-800">
                  <th className="p-3 border-r border-[#EAECEF] print:border-slate-800 text-left print:text-black font-extrabold uppercase tracking-wide">Comissão</th>
                  <th className="p-3 border-r border-[#EAECEF] print:border-slate-800 text-center print:text-black font-extrabold uppercase tracking-wide w-24">Convênio</th>
                  <th className="p-3 border-r border-[#EAECEF] print:border-slate-800 text-left print:text-black font-extrabold uppercase tracking-wide">Município</th>
                  <th className="p-3 border-r border-[#EAECEF] print:border-slate-800 text-center print:text-black font-extrabold uppercase tracking-wide w-24">Data saída</th>
                  <th className="p-3 print:border-slate-800 text-center print:text-black font-extrabold uppercase tracking-wide w-24">Data retorno</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="border-b border-[#EAECEF] print:border-slate-800 print:bg-white odd:bg-white even:bg-slate-50/40 print:even:bg-white">
                    {row.map((cellVal, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-1 border-r border-black/5 last:border-r-0 print:border-slate-800 print:p-2 ${
                          cIdx === 1 || cIdx === 3 || cIdx === 4 ? "text-center" : "text-left"
                        }`}
                      >
                        {/* Screen editing inputs (Fixes backwards typing and cursor jump) */}
                        <div className="print:hidden">
                          <input
                            type="text"
                            value={cellVal}
                            onChange={(e) => handleCellInput(rIdx, cIdx, e.target.value)}
                            onBlur={(e) => handleCellBlur(rIdx, cIdx, e.target.value)}
                            placeholder={cIdx === 3 || cIdx === 4 ? "DD/MM" : ""}
                            className={`w-full bg-transparent border-0 outline-none px-2 py-1 text-xs font-semibold ${
                              cIdx === 1 || cIdx === 3 || cIdx === 4 ? "text-center font-mono" : "text-left"
                            } text-[#2d3142] focus:ring-1 focus:ring-[#28cd41]/20 rounded`}
                          />
                        </div>

                        {/* Print static view (Fully displays wrapped text) */}
                        <div className={`hidden print:block font-medium text-black leading-snug ${
                          cIdx === 1 || cIdx === 3 || cIdx === 4 ? "text-center font-mono" : "text-left"
                        }`}>
                          {cellVal || "\u00A0"}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-black/5 mt-4 print:hidden">
          <button
            onClick={addRow}
            className="inline-flex items-center gap-1.5 px-4 h-9 bg-black/5 text-[#2d3142] hover:bg-black/10 rounded-[10px] text-xs font-semibold cursor-pointer border-0 outline-none"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar linha
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 h-9 bg-emerald-50 text-[#28cd41] hover:bg-emerald-100/50 rounded-[10px] text-xs font-semibold cursor-pointer border-0 outline-none"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir tabela
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 h-9 bg-[#34C759] text-white hover:bg-[#2fb551] rounded-[10px] text-xs font-semibold cursor-pointer border-0 outline-none shadow-[0_2px_10px_rgba(52,199,89,0.2)]"
            >
              <Save className="w-3.5 h-3.5" /> Salvar tabela
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
