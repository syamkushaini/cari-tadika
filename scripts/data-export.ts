// Writes data/kindergartens.xlsx: every listing plus the columns you can fill in.
//   npm run data:export            (creates or refreshes the file)
// Existing values from src/data/curated.json are pre-filled, so nothing is lost.
import ExcelJS from "exceljs";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { REAL_KINDERGARTENS } from "../src/data/real";
import { CURRICULA, MODIFIERS, TYPES, curatedToRow, EDIT_COLUMNS, STATUS_COLUMNS, type EditKey } from "../src/data/sheet";
import type { PlaceRow } from "../src/data/real";
import { DEFAULT_FILE, INSTR_SHEET, MAIN_SHEET, NEW_COLUMNS, NEW_SHEET, REF_COLUMNS, TEXT_KEYS } from "./sheet-io";

const out = process.argv[2] ?? DEFAULT_FILE;
const curated = JSON.parse(readFileSync(resolve(process.cwd(), "src/data/curated.json"), "utf8"));
const manual = JSON.parse(readFileSync(resolve(process.cwd(), "src/data/manual-places.json"), "utf8")) as PlaceRow[];

async function main() {
  const wb = new ExcelJS.Workbook();
  const HEAD = { bold: true, color: { argb: "FFFFFFFF" } } as const;
  const GREY = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEFEBE3" } } as const;
  const GREEN = { type: "pattern", pattern: "solid", fgColor: { argb: "FF15503A" } } as const;
  const BLUE = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E40AF" } } as const;
  const WIDTH: Record<string, number> = { id: 16, name: 34, area: 18, address: 36, phone_listed: 15, source: 16, kpm_code: 11, source_note: 30, phone: 15 };

  // ---- instructions -----------------------------------------------------------------------------------
  const info = wb.addWorksheet(INSTR_SHEET);
  info.getColumn(1).width = 110;
  [
    "HOW TO UPDATE THE APP DATA",
    "",
    "1. Fill in the WHITE columns on the 'Kindergartens' sheet (grey columns are for reference; do not edit them).",
    "2. To add a kindergarten that is missing, use the 'Add new' sheet (name is required; lat/lng can stay blank if you give an address).",
    "3. Save this file, then run:  npm run data:import   (add --dry-run first to only check for mistakes).",
    "4. Publish with:  npm run data:publish   (imports, runs the tests, commits and pushes; the website updates in a couple of minutes).",
    "",
    "RULES",
    "- A BLANK cell means 'unknown / not checked'. It is NOT treated as 0, OK or registered. Only fill a cell when you have verified it.",
    "- 0 is a real value (for example RM 0 registration fee). Blank is not.",
    "- Money: numbers only, in RM (RM 1,200 also works). Yearly items are per year; transport is per month.",
    "- teacher_student_ratio: 12 or 1:12 both mean one teacher per 12 children. KPM recommends up to 15.",
    "- hours: 07:30 or 7:30 pm. Fill both open and close.",
    "- kpm_registered: yes only if you checked ePrasekolah; no if it is definitely not registered; blank if unknown.",
    "- check_*: ok, flag or unsure. Use ok only for things you saw or confirmed yourself.",
    "- hide = yes removes a listing from the app (not a kindergarten, closed, duplicate).",
    "- source_note and verified_on are your audit trail (who/what/when). They are not shown in the app.",
    "- Do not rename or reorder the header row.",
  ].forEach((t, i) => { const c = info.getCell(i + 1, 1); c.value = t; c.alignment = { wrapText: true }; if (i === 0 || t === "RULES") c.font = { bold: true, size: 14 }; });

  // ---- main sheet -------------------------------------------------------------------------------------
  const ws = wb.addWorksheet(MAIN_SHEET);
  const cols = [...REF_COLUMNS, ...EDIT_COLUMNS] as string[];
  ws.columns = cols.map((k) => ({ header: k, key: k, width: WIDTH[k] ?? 14, style: TEXT_KEYS.has(k) ? { numFmt: "@" } : {} }));
  const listings = [...REAL_KINDERGARTENS].sort((a, b) => a.name.localeCompare(b.name));
  for (const k of listings) {
    const cur = curatedToRow(curated[k.id]);
    const row: Record<string, string> = {
      id: k.id, name: k.name, area: k.area, address: k.address ?? "", phone_listed: k.phone ?? "", source: k.source, kpm_code: k.institutionCode ?? "", ...cur,
    };
    // Show the app's current KPM status in the editable column when the registry set it and no override exists.
    ws.addRow(row);
  }
  const last = listings.length + 1;
  ws.views = [{ state: "frozen", xSplit: 2, ySplit: 1 }];
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: cols.length } };
  ws.getRow(1).eachCell((c, n) => { c.font = HEAD; c.fill = n <= REF_COLUMNS.length ? { ...GREEN, fgColor: { argb: "FF6B5D53" } } : GREEN; c.alignment = { vertical: "middle", wrapText: true }; });
  ws.getRow(1).height = 32;
  for (let r = 2; r <= last; r++) for (let c = 1; c <= REF_COLUMNS.length; c++) ws.getCell(r, c).fill = GREY;

  const colLetter = (k: string) => ws.getColumn(k).letter;
  // ExcelJS supports data validation at runtime but its type definitions omit it.
  type WithValidations = { dataValidations: { add(range: string, rule: unknown): void } };
  const validate = (sheet: ExcelJS.Worksheet, range: string, rule: unknown) => (sheet as unknown as WithValidations).dataValidations.add(range, rule);
  function dropdown(sheet: ExcelJS.Worksheet, key: string, list: readonly string[], to: number) {
    const l = sheet.getColumn(key).letter;
    validate(sheet, `${l}2:${l}${to}`, { type: "list", allowBlank: true, formulae: [`"${list.join(",")}"`], showErrorMessage: true, errorTitle: "Not allowed", error: `Choose one of: ${list.join(", ")}` });
  }
  function validations(sheet: ExcelJS.Worksheet, to: number, withHide: boolean) {
    dropdown(sheet, "type", TYPES, to); dropdown(sheet, "modifier", MODIFIERS, to); dropdown(sheet, "curriculum", CURRICULA, to);
    dropdown(sheet, "kpm_registered", ["yes", "no"], to);
    if (withHide) dropdown(sheet, "hide", ["yes", "no"], to);
    for (const s of STATUS_COLUMNS) dropdown(sheet, `check_${s}`, ["ok", "flag", "unsure"], to);
    const l = sheet.getColumn("billable_months").letter;
    validate(sheet, `${l}2:${l}${to}`, { type: "whole", operator: "between", allowBlank: true, formulae: [1, 12], showErrorMessage: true, error: "A whole number from 1 to 12" });
  }
  validations(ws, last, true);
  void colLetter;

  // ---- add-new sheet ----------------------------------------------------------------------------------
  const nw = wb.addWorksheet(NEW_SHEET);
  const newEdit = EDIT_COLUMNS.filter((c) => c !== "hide") as EditKey[];
  const ncols = [...NEW_COLUMNS, ...newEdit] as string[];
  nw.columns = ncols.map((k) => ({ header: k, key: k, width: WIDTH[k] ?? 14, style: TEXT_KEYS.has(k) ? { numFmt: "@" } : {} }));
  manual.forEach((m) => nw.addRow({ name: m.name, area: m.area, address: m.address ?? "", lat: m.lat, lng: m.lng, ...curatedToRow(curated[m.placeId]) }));
  nw.views = [{ state: "frozen", xSplit: 1, ySplit: 1 }];
  nw.getRow(1).eachCell((c, n) => { c.font = HEAD; c.fill = n <= NEW_COLUMNS.length ? BLUE : GREEN; c.alignment = { vertical: "middle", wrapText: true }; });
  nw.getRow(1).height = 32;
  validations(nw, 500, false);

  mkdirSync(dirname(out), { recursive: true });
  await wb.xlsx.writeFile(out);
  console.log(`Wrote ${out}: ${listings.length} listings, ${manual.length} added by hand.`);
  console.log("Fill the white columns, save, then run: npm run data:import");

}
main().catch((e) => { console.error(e); process.exit(1); });
