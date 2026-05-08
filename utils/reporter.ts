import * as fs from 'fs';
import * as path from 'path';
import {
  RUN_ID,
  RUN_DIR,
  REPORT_JSON,
  BUG_LOG_JSON,
  BUG_LOG_MASTER,
  modulePrefixOf,
} from './run-context';

const RESULTS_NDJSON = `${REPORT_JSON}.ndjson`;
const BUGS_NDJSON = `${BUG_LOG_JSON}.ndjson`;

export type Status = 'Pass' | 'Fail' | 'Blocked' | 'Skipped';

export interface TcResult {
  id: string;
  module: string;
  featureGroup: string;
  subFeature: string;
  title: string;
  status: Status;
  attempts: number;
  flaky: boolean;
  duration_ms: number;
  actual: string;
  screenshot: string | null;
  trace: string | null;
  bugId: string | null;
  skipReason?: string;
}

export interface RunSummary {
  runId: string;
  startedAt: string;
  finishedAt: string | null;
  environment: string;
  baseUrl: string;
  account: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    blocked: number;
    skipped: number;
    flaky: number;
  };
  results: TcResult[];
}

export interface BugEntry {
  bugId: string;
  runId: string;
  linkedTcId: string;
  title: string;
  stepsToReproduce: string;
  expected: string;
  actual: string;
  severity: string;
  priority: string;
  status: string;
  reportedBy: string;
  dateReported: string;
  dateFixed: string | null;
  devPass: boolean;
  stgPass: boolean | null;
  prodPass: boolean | null;
  environment: string;
  notes: string;
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function readJson<T>(p: string, fallback: T): T {
  try {
    if (!fs.existsSync(p)) return fallback;
    const raw = fs.readFileSync(p, 'utf8');
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(p: string, data: unknown) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

export function initRunReport(meta: {
  environment: string;
  baseUrl: string;
  account: string;
}): void {
  ensureDir(RUN_DIR);
  if (fs.existsSync(REPORT_JSON)) return; // already initialised
  const initial: RunSummary = {
    runId: RUN_ID,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    environment: meta.environment,
    baseUrl: meta.baseUrl,
    account: meta.account,
    summary: { total: 0, passed: 0, failed: 0, blocked: 0, skipped: 0, flaky: 0 },
    results: [],
  };
  writeJson(REPORT_JSON, initial);
  if (!fs.existsSync(BUG_LOG_JSON)) writeJson(BUG_LOG_JSON, []);
  // Truncate NDJSON sinks so retries from a previous attempt don't accumulate.
  fs.writeFileSync(RESULTS_NDJSON, '');
  fs.writeFileSync(BUGS_NDJSON, '');
}

/**
 * Append-only result sink. Each TC writes one line; finalizeReport() folds them
 * into the canonical report.json (last-write-wins per TC-ID, so retries
 * naturally collapse to the final attempt).
 */
export function appendResult(result: TcResult): void {
  ensureDir(RUN_DIR);
  fs.appendFileSync(RESULTS_NDJSON, JSON.stringify(result) + '\n');
}

export function finalizeReport(): void {
  const summary = readJson<RunSummary | null>(REPORT_JSON, null);
  if (!summary) return;

  const lines = fs.existsSync(RESULTS_NDJSON)
    ? fs.readFileSync(RESULTS_NDJSON, 'utf8').split('\n').filter(Boolean)
    : [];
  // Dedupe by (id + featureGroup + subFeature) — Trading sheet reuses some
  // TC-IDs across feature groups (data quality issue in the source xlsx),
  // so plain id is not unique. Retries land with same composite key, so
  // last-write-wins still collapses retries correctly.
  const byKey = new Map<string, TcResult>();
  for (const line of lines) {
    try {
      const r = JSON.parse(line) as TcResult;
      const key = `${r.id}|${r.featureGroup}|${r.subFeature}`;
      byKey.set(key, r);
    } catch {
      /* skip malformed line */
    }
  }
  summary.results = Array.from(byKey.values()).sort((a, b) =>
    a.id === b.id ? a.featureGroup.localeCompare(b.featureGroup) : a.id.localeCompare(b.id),
  );

  const counts = { total: 0, passed: 0, failed: 0, blocked: 0, skipped: 0, flaky: 0 };
  for (const r of summary.results) {
    counts.total++;
    if (r.status === 'Pass') counts.passed++;
    else if (r.status === 'Fail') counts.failed++;
    else if (r.status === 'Blocked') counts.blocked++;
    else if (r.status === 'Skipped') counts.skipped++;
    if (r.flaky) counts.flaky++;
  }
  summary.summary = counts;
  summary.finishedAt = new Date().toISOString();
  writeJson(REPORT_JSON, summary);

  // Fold bug NDJSON into the per-run bug-log.json.
  if (fs.existsSync(BUGS_NDJSON)) {
    const bugLines = fs.readFileSync(BUGS_NDJSON, 'utf8').split('\n').filter(Boolean);
    const bugs: BugEntry[] = [];
    const seen = new Set<string>();
    for (const line of bugLines) {
      try {
        const b = JSON.parse(line) as BugEntry;
        if (!seen.has(b.bugId)) {
          seen.add(b.bugId);
          bugs.push(b);
        }
      } catch {
        /* ignore */
      }
    }
    writeJson(BUG_LOG_JSON, bugs);
  }
}

const BUG_SEQ_FILE = path.join(RUN_DIR, '.bug-seq');

/**
 * Sequence is persisted on disk so it survives across workers, retries, and
 * re-imports of this module. Each call atomically increments the counter
 * (read → +1 → write) — adequate under workers=1; for parallel workers the
 * file would need a lock, but Playwright config pins workers to 1.
 */
export function nextBugId(tcId: string): string {
  ensureDir(RUN_DIR);
  let n = 0;
  try {
    if (fs.existsSync(BUG_SEQ_FILE)) {
      n = parseInt(fs.readFileSync(BUG_SEQ_FILE, 'utf8').trim(), 10) || 0;
    }
  } catch {
    /* fresh start */
  }
  n += 1;
  fs.writeFileSync(BUG_SEQ_FILE, String(n));
  return `BUG-${modulePrefixOf(tcId)}-${RUN_ID}-${String(n).padStart(3, '0')}`;
}

export function logBug(bug: BugEntry): void {
  ensureDir(RUN_DIR);
  // Append-only sink — finalizeReport folds it into bug-log.json. Master log
  // is updated immediately too so failures aren't lost if the run crashes.
  fs.appendFileSync(BUGS_NDJSON, JSON.stringify(bug) + '\n');

  const masterBugs = readJson<BugEntry[]>(BUG_LOG_MASTER, []);
  masterBugs.push(bug);
  writeJson(BUG_LOG_MASTER, masterBugs);
}
