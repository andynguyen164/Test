import { Page } from '@playwright/test';
import { TestCase } from '../excel';
import {
  openCreatePortfolioForm,
  fillPortfolioForm,
  submitCreate,
  isSubmitDisabled,
  getValidationMessages,
  PortfolioFields,
  PortfolioTarget,
} from '../forms/portfolio';

export interface RunOutcome {
  status: 'Pass' | 'Fail' | 'Blocked';
  actual: string;
}

const HAPPY_PATH = new Set(['TC-T034']);
const VALIDATION = new Set(['TC-T035', 'TC-T036', 'TC-T037']);
const REQUIRES_TIMING = new Set(['TC-T038', 'TC-T039']);

const DEFAULT_TARGETS: PortfolioTarget[] = [
  { symbol: 'BTCUSDT', weight: 50 },
  { symbol: 'ETHUSDT', weight: 50 },
];

function parseTargets(td: Record<string, string>): PortfolioTarget[] | undefined {
  // Sheet stores: portfolioTargets: [{symbol: BTCUSDT, weight: 50%}, ...]
  // Be lenient — extract pairs of (symbol, weight) tokens.
  const blob = td.portfoliotargets;
  if (blob === undefined) return undefined;
  if (/^\s*\[\s*\]\s*$/.test(blob)) return [];
  const out: PortfolioTarget[] = [];
  const symMatches = blob.matchAll(/symbol:\s*([A-Z0-9]+)/g);
  const wMatches = [...blob.matchAll(/weight:\s*([\d.]+)/g)];
  let i = 0;
  for (const m of symMatches) {
    const w = wMatches[i]?.[1];
    out.push({ symbol: m[1], weight: w ?? 0 });
    i++;
  }
  return out.length ? out : [];
}

function parseScheduleTimes(td: Record<string, string>): string[] | undefined {
  // Sheet stores: scheduling.times: ['08:00:00', '14:00:00', '20:00:00']
  const raw = td['scheduling.times'];
  if (!raw) return undefined;
  if (/^\s*\[\s*\]\s*$/.test(raw)) return [];
  return [...raw.matchAll(/'(\d{1,2}:\d{2}(?::\d{2})?)'/g)].map((m) => m[1]);
}

/**
 * Sheet uses logical names (RegularIntervals / SpecificTimes) but the UI
 * exposes "Every" / "At". Translate.
 */
function mapMode(s: string): 'Every' | 'At' | undefined {
  const v = s.trim().toLowerCase();
  if (v === 'regularintervals' || v === 'every') return 'Every';
  if (v === 'specifictimes' || v === 'at') return 'At';
  return undefined;
}

function mapTestData(td: Record<string, string>): PortfolioFields {
  const out: PortfolioFields = {};
  const targets = parseTargets(td);
  if (targets !== undefined) out.targets = targets;
  const mode = td['scheduling.mode'];
  if (mode) out.scheduleType = mapMode(mode) as any;
  const freq = td['scheduling.frequency'];
  if (freq) out.scheduleFrequency = freq.trim();
  const time = td['scheduling.time'];
  if (time) out.scheduleTime = time.trim().replace(/^['"]|['"]$/g, '');
  const times = parseScheduleTimes(td);
  if (times !== undefined) out.scheduleTimes = times;
  return out;
}

export async function runPortfolioTC(page: Page, tc: TestCase): Promise<RunOutcome> {
  if (REQUIRES_TIMING.has(tc.id)) {
    return {
      status: 'Blocked',
      actual:
        'Requires multi-day clock observation to verify rebalance triggers (out of scope for an automated DEV run).',
    };
  }

  await openCreatePortfolioForm(page);
  const parsed = mapTestData(tc.testData);

  // TC-T035 explicitly says portfolioTargets: [] -> we must NOT inject defaults,
  // and we must NOT touch the symbol pickers. parsed.targets === [] flags this.
  const useDefaults = parsed.targets === undefined;
  const fields: PortfolioFields = {
    targets: useDefaults ? DEFAULT_TARGETS : parsed.targets,
    scheduleType: parsed.scheduleType ?? ('Every' as any),
    scheduleFrequency: parsed.scheduleFrequency ?? 'EveryDay',
    scheduleTime: parsed.scheduleTime ?? '08:00:00',
    scheduleTimes: parsed.scheduleTimes,
  };

  await fillPortfolioForm(page, fields);

  if (HAPPY_PATH.has(tc.id)) {
    await submitCreate(page);
    const success = await Promise.race([
      page.waitForURL((u) => !u.toString().includes('create=true'), { timeout: 30_000 })
        .then(() => true).catch(() => false),
      page.getByText(/strategy created|bot created|running successfully|success/i).first()
        .isVisible({ timeout: 30_000 }).catch(() => false),
      page.getByRole('button', { name: /^Creating$/i }).first()
        .waitFor({ state: 'detached', timeout: 30_000 }).then(() => true).catch(() => false),
    ]);
    if (success) {
      return { status: 'Pass', actual: 'Bot creation submitted; success indicator observed.' };
    }
    const msgs = await getValidationMessages(page);
    return {
      status: 'Fail',
      actual: `Submitted but no success signal within 30s. Validation messages: ${msgs.join(' | ') || '(none)'}`,
    };
  }

  if (VALIDATION.has(tc.id)) {
    // For T035, force-empty targets by clearing the default row's symbol/weight.
    // For T036, set SpecificTimes mode without adding any times.
    // For T037, type an invalid time string.
    if (tc.id === 'TC-T037') {
      const timeInput = page.locator('input[placeholder="HH:mm:ss"]').first();
      if (await timeInput.isVisible().catch(() => false)) {
        await timeInput.fill('25:00:00');
        await timeInput.blur().catch(() => {});
      }
    }
    await page.waitForTimeout(400);
    const disabled = await isSubmitDisabled(page);
    let msgs = await getValidationMessages(page);
    if (disabled || msgs.length) {
      return {
        status: 'Pass',
        actual: `Validation observed (button disabled=${disabled}, messages=${msgs.join(' | ') || '(none)'}).`,
      };
    }
    await submitCreate(page);
    await page.waitForTimeout(1500);
    msgs = await getValidationMessages(page);
    if (msgs.length) {
      return { status: 'Pass', actual: `Validation surfaced after submit: ${msgs.join(' | ')}` };
    }
    return {
      status: 'Fail',
      actual:
        'Expected validation error or disabled submit, but neither surfaced. Likely an app bug: invalid config was accepted silently.',
    };
  }

  return { status: 'Blocked', actual: 'Portfolio runner has no classification for this TC-ID yet.' };
}
