// Shared spreadsheet plumbing for data-export.ts / data-import.ts.
import type ExcelJS from "exceljs";
import { EDIT_COLUMNS, type EditKey } from "../src/data/sheet";

export const DEFAULT_FILE = "data/kindergartens.xlsx";
export const MAIN_SHEET = "Kindergartens";
export const NEW_SHEET = "Add new";
export const INSTR_SHEET = "Read me first";
/** Read-only reference columns on the main sheet (the import ignores everything except `id`). */
export const REF_COLUMNS = ["id", "name", "area", "address", "phone_listed", "source", "kpm_code"] as const;
/** Identity columns on the "Add new" sheet. */
export const NEW_COLUMNS = ["name", "area", "address", "lat", "lng"] as const;
/** Columns that hold free text, not numbers (keep Excel from reformatting times/ids). */
export const TEXT_KEYS = new Set<string>(["id", "hours_open", "hours_close", "phone", "phone_listed", "verified_on", "kpm_code"]);

/** Cell -> trimmed text. Handles numbers, dates typed into Excel, formulas and rich text. */
export function cellText(cell: ExcelJS.Cell, key: string): string {
  const v = cell.value as unknown;
  if (v == null) return "";
  if (v instanceof Date) {
    if (key.startsWith("hours")) return `${String(v.getUTCHours()).padStart(2, "0")}:${String(v.getUTCMinutes()).padStart(2, "0")}`;
    return v.toISOString().slice(0, 10);
  }
  if (typeof v === "number") {
    // Excel stores dates as day counts since 1899-12-30 and times as a fraction of a day.
    if (key === "verified_on" && v > 30000 && v < 80000) return new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000).toISOString().slice(0, 10);
    if (key.startsWith("hours") && v >= 0 && v < 1) { const mins = Math.round(v * 1440); return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`; }
    return String(v);
  }
  if (typeof v === "object") {
    const o = v as { result?: unknown; text?: unknown; richText?: { text: string }[] };
    if (o.richText) return o.richText.map((r) => r.text).join("").trim();
    if (o.result !== undefined) return String(o.result).trim();
    if (o.text !== undefined) return String(o.text).trim();
    return "";
  }
  return String(v).trim();
}

/** header text -> column number, for the first row of a sheet. */
export function headerMap(ws: ExcelJS.Worksheet): Map<string, number> {
  const m = new Map<string, number>();
  ws.getRow(1).eachCell((c, n) => { const t = cellText(c, ""); if (t) m.set(t, n); });
  return m;
}

export const editColumns = (): readonly EditKey[] => EDIT_COLUMNS;
