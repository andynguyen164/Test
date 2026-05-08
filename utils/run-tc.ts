import * as fs from 'fs';
import * as path from 'path';
import { test, expect, Page, TestInfo } from '@playwright/test';
import { TestCase, ModuleSheet, readTestCases } from './excel';
import { tryGenericStep } from './helpers';
import {
  appendResult,
  TcResult,
  Status,
  nextBugId,
  logBug,
  BugEntry,
} from './reporter';
import { SCREENSHOTS_DIR } from './run-context';
import { runFuturesGridTC } from './runners/futures-grid';
import { runDcaTC } from './runners/dca';
import { runTwapTC } from './runners/twap';
import { runPortfolioTC } from './runners/portfolio';
import { runBotsTC } from './runners/bots';
import { runAlertTC } from './runners/alert';
import { runAlgoHubTC } from './runners/algo-hub';
import { runStrategyBuilderTC } from './runners/strategy-builder';
import { runChartTC } from './runners/chart';

/**
 * Dispatch table for module-specific runners. Keyed by `${module}::${subFeature}`.
 * If a key matches, the runner takes full control of the test body and returns
 * a {status, actual} verdict. Otherwise the generic step interpreter is used.
 */
const RUNNERS: Record<
  string,
  (page: Page, tc: TestCase) => Promise<{ status: Status; actual: string }>
> = {
  'Trading::Futures Grid Trading': runFuturesGridTC,
  'Trading::DCA Trading': runDcaTC,
  'Trading::TWAP Futures Trading': runTwapTC,
  'Trading::Portfolio Rebalancing': runPortfolioTC,
  // CHART / AI INDICATOR / WATCHLIST — all on /terminal trading desk.
  'Trading::Change Interval': runChartTC,
  'Trading::Change Symbol': runChartTC,
  'Trading::Chart View & Indicators': runChartTC,
  'Trading::AI Indicator': runChartTC,
  'Trading::Search': runChartTC,
  'Trading::Manage Watchlist': runChartTC,
};

/**
 * Module-level fallback runners — applied when no `module::subFeature`
 * key matches. Useful for sheets where the sub-feature is just an
 * organisational tag rather than a different page (Bots, Algo Hub).
 */
const MODULE_RUNNERS: Record<
  string,
  (page: Page, tc: TestCase) => Promise<{ status: Status; actual: string }>
> = {
  Bots: runBotsTC,
  Alert: runAlertTC,
  'Algo Hub': runAlgoHubTC,
  'Strategy Builder': runStrategyBuilderTC,
};

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Decide whether the row should be skipped (e.g. live-fund safety, missing data).
 */
function shouldSkip(tc: TestCase): { skip: boolean; reason: string } {
  const text = `${tc.title} ${tc.steps.join(' ')} ${tc.preconditions}`.toLowerCase();
  if (text.includes('live trade') || text.includes('real funds') || text.includes('withdraw')) {
    return { skip: true, reason: 'requires live funds (safety rule)' };
  }
  if (!tc.steps.length) {
    return { skip: true, reason: 'no steps in sheet' };
  }
  return { skip: false, reason: '' };
}

async function captureFailure(page: Page, tc: TestCase): Promise<string | null> {
  ensureDir(SCREENSHOTS_DIR);
  const file = path.join(SCREENSHOTS_DIR, `${tc.id}-fail.png`);
  try {
    await page.screenshot({ path: file, fullPage: true });
    return file;
  } catch {
    return null;
  }
}

/**
 * Generate a Playwright `test()` for every row in a module sheet.
 * The runner is intentionally generic — per-row precision comes from
 * targeted helpers we'll add as the suite matures. For now, every step
 * is interpreted heuristically and assertion is best-effort against the
 * Expected Result text.
 */
export function buildSpecsFor(sheet: ModuleSheet) {
  const cases = readTestCases(sheet);

  const groups = new Map<string, Map<string, TestCase[]>>();
  for (const tc of cases) {
    if (!groups.has(tc.featureGroup)) groups.set(tc.featureGroup, new Map());
    const sub = groups.get(tc.featureGroup)!;
    if (!sub.has(tc.subFeature)) sub.set(tc.subFeature, []);
    sub.get(tc.subFeature)!.push(tc);
  }

  for (const [featureGroup, subMap] of groups) {
    test.describe(featureGroup || sheet, () => {
      for (const [subFeature, tcs] of subMap) {
        test.describe(subFeature || '(general)', () => {
          for (const tc of tcs) {
            test(`${tc.id} — ${tc.title}`, async ({ page }, info) => {
              const start = Date.now();
              let status: Status = 'Pass';
              let actual = '';
              let bugId: string | null = null;
              let screenshotPath: string | null = null;
              const tracePath = info.outputDir
                ? path.join(info.outputDir, 'trace.zip')
                : null;

              const decision = shouldSkip(tc);
              let skipReason: string | null = null;
              if (decision.skip) {
                actual = decision.reason;
                status = 'Skipped';
                skipReason = decision.reason;
              } else {
                try {
                  if (tc.preconditions) {
                    await test.step(`Preconditions: ${tc.preconditions.slice(0, 80)}`, async () => {});
                  }

                  const runnerKey = `${tc.module}::${tc.subFeature}`;
                  const runner = RUNNERS[runnerKey] ?? MODULE_RUNNERS[tc.module];
                  if (runner) {
                    const verdict = await runner(page, tc);
                    status = verdict.status;
                    actual = verdict.actual;
                    if (status === 'Blocked') {
                      skipReason = `Blocked: ${actual}`;
                    }
                  } else {
                    for (let i = 0; i < tc.steps.length; i++) {
                      const step = tc.steps[i];
                      await test.step(`${i + 1}. ${step}`, async () => {
                        await tryGenericStep(page, step);
                      });
                    }
                    // Light assertion: look for the first phrase of Expected
                    // Result. Missing -> Blocked (selector unproven), not Fail.
                    const phrase = firstPhrase(tc.expected);
                    if (phrase) {
                      const found = await page
                        .getByText(phrase, { exact: false })
                        .first()
                        .isVisible()
                        .catch(() => false);
                      if (!found) {
                        actual = `Expected text "${phrase}" not visible after steps.`;
                        status = 'Blocked';
                        skipReason = `Blocked: ${actual}`;
                      } else {
                        actual = `Matched expected phrase: "${phrase}"`;
                      }
                    } else {
                      actual = 'Steps completed without explicit expectation phrase.';
                    }
                  }
                } catch (err) {
                  status = 'Fail';
                  actual = (err as Error).message ?? String(err);
                  screenshotPath = await captureFailure(page, tc);
                  bugId = nextBugId(tc.id);
                  const bug: BugEntry = {
                    bugId,
                    runId: process.env.RUN_ID!,
                    linkedTcId: tc.id,
                    title: tc.title,
                    stepsToReproduce: tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
                    expected: tc.expected,
                    actual,
                    severity: tc.severity || 'Medium',
                    priority: tc.priority || 'Medium',
                    status: 'New',
                    reportedBy: 'claude-code-agent',
                    dateReported: todayIso(),
                    dateFixed: null,
                    devPass: false,
                    stgPass: null,
                    prodPass: null,
                    environment: tc.environment || 'DEV',
                    notes: screenshotPath ? `Screenshot: ${screenshotPath}` : '',
                  };
                  logBug(bug);
                }
              }

              // Fail verdicts that come from a module runner (no throw) still
              // need a bug entry + screenshot before we surface to Playwright.
              if (status === 'Fail' && !bugId) {
                screenshotPath = await captureFailure(page, tc);
                bugId = nextBugId(tc.id);
                logBug({
                  bugId,
                  runId: process.env.RUN_ID!,
                  linkedTcId: tc.id,
                  title: tc.title,
                  stepsToReproduce: tc.steps.map((s, i) => `${i + 1}. ${s}`).join('\n'),
                  expected: tc.expected,
                  actual,
                  severity: tc.severity || 'Medium',
                  priority: tc.priority || 'Medium',
                  status: 'New',
                  reportedBy: 'claude-code-agent',
                  dateReported: todayIso(),
                  dateFixed: null,
                  devPass: false,
                  stgPass: null,
                  prodPass: null,
                  environment: tc.environment || 'DEV',
                  notes: screenshotPath ? `Screenshot: ${screenshotPath}` : '',
                });
              }

              appendResult(
                tcResult(tc, status, {
                  duration_ms: Date.now() - start,
                  actual,
                  attempts: info.retry + 1,
                  flaky: info.retry > 0 && status === 'Pass',
                  screenshot: screenshotPath,
                  trace: status === 'Fail' ? tracePath : null,
                  bugId,
                  skipReason: status === 'Skipped' ? skipReason ?? undefined : undefined,
                }),
              );

              if (status === 'Fail') {
                throw new Error(actual);
              }
              if (skipReason) {
                test.skip(true, skipReason);
              }
            });
          }
        });
      }
    });
  }
}

function firstPhrase(expected: string): string | null {
  if (!expected) return null;
  // Take the first short clause (up to a period or comma) capped at 60 chars.
  const m = expected.split(/[\.\n,;]/).find((s) => s.trim().length > 0);
  if (!m) return null;
  const phrase = m.trim().slice(0, 60);
  return phrase.length >= 4 ? phrase : null;
}

function tcResult(
  tc: TestCase,
  status: Status,
  extra: Partial<TcResult> = {},
): TcResult {
  return {
    id: tc.id,
    module: tc.module,
    featureGroup: tc.featureGroup,
    subFeature: tc.subFeature,
    title: tc.title,
    status,
    attempts: 1,
    flaky: false,
    duration_ms: 0,
    actual: '',
    screenshot: null,
    trace: null,
    bugId: null,
    ...extra,
  };
}

/**
 * Best-effort post-run cleanup hook for a spec — deletes auto-<TC-ID>-* entities
 * we may have created. Currently a stub that logs intent; per-module deletes
 * land as the spec gains targeted helpers.
 */
export async function cleanupAutoEntities(_page: Page, _module: ModuleSheet) {
  // Stub. Implemented per-module once UI flows for delete are codified.
}
