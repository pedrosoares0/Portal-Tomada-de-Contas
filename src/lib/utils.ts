// ──────────────────────────────────────────────────────────────────────────────
// Shared utilities — Portal Tomada de Contas
// Single source of truth for parsing, business logic, and shared constants.
// ──────────────────────────────────────────────────────────────────────────────

// ─── Date Parsing & Formatting ────────────────────────────────────────────────

/** Safely parse date strings in ISO (YYYY-MM-DD), BR (DD/MM/YYYY), or JS Date formats */
export const parseDate = (val: string): Date | null => {
  if (!val) return null;
  const str = String(val).trim();
  const mIso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (mIso) return new Date(parseInt(mIso[1], 10), parseInt(mIso[2], 10) - 1, parseInt(mIso[3], 10));
  const mDd = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (mDd) return new Date(parseInt(mDd[3], 10), parseInt(mDd[2], 10) - 1, parseInt(mDd[1], 10));
  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
};

/** Convert any date value to DD/MM/YYYY for display */
export const formatDateToDDMMYYYY = (val: any): string => {
  if (!val) return "";
  const v = String(val).trim();
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|\s|$)/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
};

/** Normalize user-typed date input to DD/MM/YYYY */
export const normalizeInputDate = (val: string): string => {
  if (!val) return "";
  const v = String(val).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(v)) return v;
  const mIso = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (mIso) return `${mIso[3]}/${mIso[2]}/${mIso[1]}`;
  const digits = v.replace(/\D/g, "");
  if (digits.length === 8) return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
  return v;
};

/** Parse DD/MM/YYYY or YYYY-MM-DD to a sortable YYYYMMDD number */
export const parseDateToNum = (val: string): number => {
  if (!val) return 0;
  const s = String(val).trim();
  const m1 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m1) return parseInt(m1[3] + m1[2] + m1[1], 10);
  const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m2) return parseInt(m2[1] + m2[2] + m2[3], 10);
  return 0;
};

/** Extract a finalization date from observation text (e.g. "Encaminhado em 15/03/2025") */
export const parseFinalizationDate = (obs: string): Date | null => {
  if (!obs) return null;
  const m = obs.match(/\b(\d{2})\/(\d{2})\/(\d{2,4})\b/);
  if (m) {
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    const d = new Date(year, parseInt(m[2], 10) - 1, parseInt(m[1], 10));
    if (!isNaN(d.getTime())) return d;
  }
  return null;
};

// ─── Business Logic — Dias Passados ───────────────────────────────────────────

/**
 * Compute "Dias Passados" from a data row.
 * Uses the actual system clock (Date.now()) instead of a hardcoded date.
 *
 * Rules:
 * - If Data Tomada is empty or sfVal < -10000: days = today − Vigência
 * - If sfVal is valid and ≥ -10000: days = sfVal (raw value from the spreadsheet)
 * - If sfVal is NaN/invalid but Data Tomada exists: days = Data Tomada − Vigência
 */
export const computeDaysPassed = (row: any[]): number | null => {
  const vigStr = String(row[5] || "");
  const tomStr = String(row[7] || "");
  const sfVal = parseInt(String(row[6] || ""), 10);
  let days = sfVal;

  if (!tomStr || tomStr.trim() === "" || (!isNaN(sfVal) && sfVal < -10000)) {
    const vDate = parseDate(vigStr);
    if (vDate) {
      days = Math.ceil((Date.now() - vDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  } else if (isNaN(sfVal) || sfVal < -10000) {
    const vDate = parseDate(vigStr);
    const tDate = parseDate(tomStr);
    if (vDate && tDate) {
      days = Math.ceil((tDate.getTime() - vDate.getTime()) / (1000 * 60 * 60 * 24));
    }
  }

  return isNaN(days) ? null : days;
};

/** String version of computeDaysPassed (for display and filter matching) */
export const getDaysPassedString = (row: any[]): string => {
  const d = computeDaysPassed(row);
  return d === null ? "" : String(d);
};

/**
 * Get the display-ready cell value for a given UI column index.
 * Handles the column-index shift (UI col 6 = computed, cols ≥ 7 map to db col − 1).
 */
export const getCellDisplayValue = (row: any[], uiColIdx: number): string => {
  if (uiColIdx === 6) return getDaysPassedString(row);
  return String(row[uiColIdx] || "");
};

// ─── Commission / Avatar Helpers ──────────────────────────────────────────────

export interface PersonData {
  name: string;
  role: string;
  avatar: string;
  dashAccentFrom: string;
  dashAccentBorder: string;
  dashAccentBar: string;
  dashAccentText: string;
  dashAccentDot: string;
  dashAccentPill: string;
  sideAccentFrom: string;
  sideAccentTo: string;
  sideAccentBorder: string;
  sideAccentDot: string;
  sideAccentText: string;
}

/** Base data for the 3 main commission members with unified styling metadata */
export const PEOPLE: PersonData[] = [
  {
    name: "João Rios",
    role: "Coordenador",
    avatar: "/imagens/joao-icon.jpg",
    dashAccentFrom: "from-emerald-50 to-emerald-100/50",
    dashAccentBorder: "border-emerald-200",
    dashAccentBar: "bg-emerald-500",
    dashAccentText: "text-emerald-800",
    dashAccentDot: "bg-emerald-500",
    dashAccentPill: "bg-emerald-100",
    sideAccentFrom: "#D1FAE5",
    sideAccentTo: "#A7F3D0",
    sideAccentBorder: "#6EE7B7",
    sideAccentDot: "#059669",
    sideAccentText: "#065F46"
  },
  {
    name: "Iraildes",
    role: "Relatora",
    avatar: "/imagens/iraildes-icon.jpg",
    dashAccentFrom: "from-pink-50 to-pink-100/50",
    dashAccentBorder: "border-pink-200",
    dashAccentBar: "bg-pink-500",
    dashAccentText: "text-pink-800",
    dashAccentDot: "bg-pink-500",
    dashAccentPill: "bg-pink-100",
    sideAccentFrom: "#FCE7F3",
    sideAccentTo: "#FBCFE8",
    sideAccentBorder: "#F9A8D4",
    sideAccentDot: "#DB2777",
    sideAccentText: "#9D174D"
  },
  {
    name: "Pedro",
    role: "Relator",
    avatar: "/imagens/pedro-icon.jpg",
    dashAccentFrom: "from-slate-50 to-slate-100/50",
    dashAccentBorder: "border-slate-200",
    dashAccentBar: "bg-slate-600",
    dashAccentText: "text-slate-800",
    dashAccentDot: "bg-slate-600",
    dashAccentPill: "bg-slate-100",
    sideAccentFrom: "#F3F4F6",
    sideAccentTo: "#E5E7EB",
    sideAccentBorder: "#D1D5DB",
    sideAccentDot: "#374151",
    sideAccentText: "#1F2937"
  }
];

/** Resolve free-text commission/observation field to avatar images */
export const getCommissionAvatars = (text: string): { name: string; img: string }[] => {
  if (!text) return [];
  const n = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const found: { name: string; img: string }[] = [];
  if (n.includes("joao") && !n.includes("sena")) found.push({ name: "João Rios", img: "/imagens/joao-icon.jpg" });
  if (n.includes("irail")) found.push({ name: "Iraildes", img: "/imagens/iraildes-icon.jpg" });
  if (n.includes("pedro")) found.push({ name: "Pedro Soares", img: "/imagens/pedro-icon.jpg" });
  if (n.includes("pablo")) found.push({ name: "Pablo", img: "/imagens/pablo-icon.jpg" });
  return found;
};

// ─── Navigation ───────────────────────────────────────────────────────────────

export const TAB_LABELS: Record<string, string> = {
  inicio: "Início",
  dashboard: "Indicadores",
  analise: "Convênios em Análise",
  fluxos: "Fluxos",
  notificacoes: "Notificações",
  visitas: "Visitas",
  setafs: "SETAFs",
};
