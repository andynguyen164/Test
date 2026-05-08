import * as fs from 'fs';
import * as path from 'path';
import { chromium, FullConfig } from '@playwright/test';
import { fallbackRunId } from './utils/run-context';
import { loginAsTestUser, TEST_BASE_URL, TEST_EMAIL } from './utils/login';
import { initRunReport } from './utils/reporter';

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function updateLatestSymlink(target: string) {
  const link = path.join(process.cwd(), 'reports', 'latest');
  try {
    if (fs.existsSync(link) || fs.lstatSync(link, { throwIfNoEntry: false } as any)?.isSymbolicLink?.()) {
      try {
        fs.unlinkSync(link);
      } catch {
        /* ignore */
      }
    }
  } catch {
    /* ignore */
  }
  try {
    fs.symlinkSync(path.basename(target), link, 'dir');
  } catch (e) {
    // Windows / no permission — fall back to writing a pointer file.
    try {
      fs.writeFileSync(`${link}.txt`, path.basename(target));
    } catch {
      /* ignore */
    }
  }
}

export default async function globalSetup(_config: FullConfig) {
  // 1. Provision RUN_ID before any spec evaluates run-context.
  if (!process.env.RUN_ID) {
    process.env.RUN_ID = fallbackRunId();
  }
  const runId = process.env.RUN_ID!;
  const repo = process.cwd();
  const runDir = path.join(repo, 'reports', runId);
  ensureDir(runDir);
  ensureDir(path.join(runDir, 'screenshots'));
  ensureDir(path.join(runDir, 'traces'));
  ensureDir(path.join(repo, 'utils', '.auth'));

  initRunReport({
    environment: 'DEV',
    baseUrl: TEST_BASE_URL,
    account: TEST_EMAIL,
  });

  updateLatestSymlink(runDir);

  const preCleanupLog = path.join(runDir, 'pre-cleanup.log');
  const log = (line: string) =>
    fs.appendFileSync(preCleanupLog, `[${new Date().toISOString()}] ${line}\n`);

  // 2. Authenticate (always refresh state.json on a new run — TTLs unknown).
  const authState = path.join(repo, 'utils', '.auth', 'state.json');
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    log(`run ${runId} starting global-setup`);
    await loginAsTestUser(page);
    await context.storageState({ path: authState });
    log(`auth state saved to ${authState}`);
  } catch (e) {
    log(`LOGIN FAILED: ${(e as Error).message}`);
    // Don't throw — let specs surface as Blocked individually so we still
    // produce a report instead of an empty run folder.
  }

  // 3. Sweep stale auto- entities. Best-effort & defensive: any failure is
  //    swallowed, logged, and the next run's sweep will catch leftovers.
  try {
    await sweepAutoEntities(page, log);
  } catch (e) {
    log(`sweep failed: ${(e as Error).message}`);
  }

  await browser.close();
  log('global-setup finished');
}

async function sweepAutoEntities(page: any, log: (s: string) => void) {
  // Heuristic: visit each module, find list rows whose names start with "auto-",
  // and click their delete affordance. Selectors may evolve — wrap in try blocks.
  const modules = [
    { name: 'Bot Trading', path: '/bots' },
    { name: 'Strategy Builder', path: '/strategy-builder' },
    { name: 'Alerts', path: '/alerts' },
  ];
  for (const m of modules) {
    try {
      await page.goto(`${TEST_BASE_URL}${m.path}`, { waitUntil: 'domcontentloaded', timeout: 20_000 });
      const rows = page.locator('text=/^auto-/');
      const count = await rows.count().catch(() => 0);
      log(`${m.name}: found ${count} stale auto- entities`);
      // Don't actually delete in scaffold — selectors per-module differ. Log only.
    } catch (e) {
      log(`${m.name} sweep skipped: ${(e as Error).message}`);
    }
  }
}
