import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';

export type Priority = 'High' | 'Medium' | 'Low' | 'Critical' | '';

export interface TestCase {
  id: string;
  module: string;
  featureGroup: string;
  subFeature: string;
  title: string;
  description: string;
  preconditions: string;
  testData: Record<string, string>;
  rawTestData: string;
  steps: string[];
  expected: string;
  priority: Priority;
  severity: string;
  environment: string;
  rowIndex: number;
}

export const MODULE_SHEETS = [
  'Trading',
  'Strategy Builder',
  'Bots',
  'Algo Hub',
  'Alert',
] as const;
export type ModuleSheet = (typeof MODULE_SHEETS)[number];

export const TC_PREFIX_RE = /^(TC-T|SB-|BOT-|AH-|AL-)\d+$/i;

const DEFAULT_XLSX_PATH = path.join(process.cwd(), 'Test Case org.xlsx');

let cachedWb: XLSX.WorkBook | null = null;

function loadWorkbook(xlsxPath = DEFAULT_XLSX_PATH): XLSX.WorkBook {
  if (cachedWb) return cachedWb;
  if (!fs.existsSync(xlsxPath)) {
    throw new Error(`Test Case xlsx not found at ${xlsxPath}`);
  }
  cachedWb = XLSX.readFile(xlsxPath);
  return cachedWb;
}

function parseTestData(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw) return out;
  const text = String(raw).trim();
  if (!text || text.toLowerCase() === 'nan' || text.toLowerCase() === 'n/a') return out;
  for (const segment of text.split('|')) {
    const s = segment.trim();
    if (!s) continue;
    const colon = s.indexOf(':');
    if (colon === -1) {
      // No key:value form — store under generic key
      out[`_${Object.keys(out).length}`] = s;
      continue;
    }
    const key = s.slice(0, colon).trim().toLowerCase();
    const val = s.slice(colon + 1).trim();
    if (key) out[key] = val;
  }
  return out;
}

function parseSteps(raw: string): string[] {
  if (!raw) return [];
  return String(raw)
    .split(/\r?\n\s*\d+\.\s*/g)
    .map((s, i) => (i === 0 ? s.replace(/^\s*\d+\.\s*/, '') : s))
    .map((s) => s.trim())
    .filter(Boolean);
}

export function readTestCases(sheetName: ModuleSheet, xlsxPath = DEFAULT_XLSX_PATH): TestCase[] {
  const wb = loadWorkbook(xlsxPath);
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Sheet "${sheetName}" missing in ${xlsxPath}`);
  const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });
  if (!rows.length) return [];
  // header row is row 0 per inspection
  const out: TestCase[] = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as any[];
    const id = String(row[0] ?? '').trim();
    if (!id || !TC_PREFIX_RE.test(id)) continue; // header / divider rows
    const featureGroup = String(row[1] ?? '').trim();
    const subFeature = String(row[2] ?? '').trim();
    const title = String(row[3] ?? '').trim();
    if (!title) continue;
    const description = String(row[4] ?? '').trim();
    const preconditions = String(row[5] ?? '').trim();
    const rawTestData = String(row[6] ?? '').trim();
    const stepsRaw = String(row[7] ?? '').trim();
    const expected = String(row[8] ?? '').trim();
    const priority = String(row[10] ?? '').trim() as Priority;
    const severity = String(row[11] ?? '').trim();
    const environment = String(row[12] ?? '').trim() || 'DEV';

    out.push({
      id,
      module: sheetName,
      featureGroup,
      subFeature,
      title,
      description,
      preconditions,
      testData: parseTestData(rawTestData),
      rawTestData,
      steps: parseSteps(stepsRaw),
      expected,
      priority,
      severity,
      environment,
      rowIndex: i,
    });
  }
  return out;
}

export function readAllTestCases(xlsxPath = DEFAULT_XLSX_PATH): TestCase[] {
  return MODULE_SHEETS.flatMap((s) => readTestCases(s, xlsxPath));
}

export function appendNoteToRow(
  sheetName: ModuleSheet,
  rowIndex: number,
  note: string,
  xlsxPath = DEFAULT_XLSX_PATH,
): boolean {
  // Best-effort. Returns false if the file is locked / write fails.
  try {
    const wb = XLSX.readFile(xlsxPath);
    const ws = wb.Sheets[sheetName];
    if (!ws) return false;
    // Notes column = U = index 20.
    const cellAddr = XLSX.utils.encode_cell({ r: rowIndex, c: 20 });
    const existing = ws[cellAddr]?.v ? String(ws[cellAddr].v) : '';
    const updated = existing ? `${existing}\n${note}` : note;
    ws[cellAddr] = { t: 's', v: updated };
    // Expand !ref if needed
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    if (range.e.c < 20) range.e.c = 20;
    if (range.e.r < rowIndex) range.e.r = rowIndex;
    ws['!ref'] = XLSX.utils.encode_range(range);
    XLSX.writeFile(wb, xlsxPath);
    return true;
  } catch (err) {
    return false;
  }
}

export function writeStatusToRow(
  sheetName: ModuleSheet,
  rowIndex: number,
  status: 'Pass' | 'Fail' | 'Blocked' | 'Skipped',
  actual: string,
  xlsxPath = DEFAULT_XLSX_PATH,
): boolean {
  try {
    const wb = XLSX.readFile(xlsxPath);
    const ws = wb.Sheets[sheetName];
    if (!ws) return false;
    // J = index 9 (Actual Result), N = index 13 (DEV)
    ws[XLSX.utils.encode_cell({ r: rowIndex, c: 9 })] = { t: 's', v: actual };
    ws[XLSX.utils.encode_cell({ r: rowIndex, c: 13 })] = { t: 's', v: status };
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    if (range.e.c < 13) range.e.c = 13;
    if (range.e.r < rowIndex) range.e.r = rowIndex;
    ws['!ref'] = XLSX.utils.encode_range(range);
    XLSX.writeFile(wb, xlsxPath);
    return true;
  } catch {
    return false;
  }
}
