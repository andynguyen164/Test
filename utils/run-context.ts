import * as path from 'path';

/**
 * Run-wide constants. RUN_ID is provisioned by global-setup and exposed via env.
 */
export const RUN_ID = process.env.RUN_ID ?? fallbackRunId();

export function fallbackRunId(): string {
  // Asia/Ho_Chi_Minh = UTC+7. Compute deterministically without external libs.
  const now = new Date(Date.now() + 7 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getUTCFullYear()}-${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}_${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;
}

export const REPO_ROOT = process.cwd();
export const REPORTS_ROOT = path.join(REPO_ROOT, 'reports');
export const RUN_DIR = path.join(REPORTS_ROOT, RUN_ID);
export const SCREENSHOTS_DIR = path.join(RUN_DIR, 'screenshots');
export const TRACES_DIR = path.join(RUN_DIR, 'traces');
export const REPORT_JSON = path.join(RUN_DIR, 'report.json');
export const BUG_LOG_JSON = path.join(RUN_DIR, 'bug-log.json');
export const BUG_LOG_MASTER = path.join(REPORTS_ROOT, 'bug-log-master.json');
export const PRE_CLEANUP_LOG = path.join(RUN_DIR, 'pre-cleanup.log');
export const AUTH_STATE = path.join(REPO_ROOT, 'utils', '.auth', 'state.json');
export const TESTCASES_JSON = path.join(REPO_ROOT, 'data', 'testcases.json');
export const XLSX_PATH = path.join(REPO_ROOT, 'Test Case org.xlsx');

export const MODULE_PREFIX_TO_LETTER: Record<string, string> = {
  'TC-T': 'T',
  'SB-': 'SB',
  'BOT-': 'BOT',
  'AH-': 'AH',
  'AL-': 'AL',
};

export function modulePrefixOf(tcId: string): string {
  for (const k of Object.keys(MODULE_PREFIX_TO_LETTER)) {
    if (tcId.startsWith(k)) return MODULE_PREFIX_TO_LETTER[k];
  }
  return 'X';
}
