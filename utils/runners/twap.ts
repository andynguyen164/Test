import { Page } from '@playwright/test';
import { TestCase } from '../excel';
import {
  openCreateTwapForm,
  fillTwapForm,
  submitCreate,
  isSubmitDisabled,
  getValidationMessages,
  triggerValidation,
  TwapFormFields,
} from '../forms/twap';

export interface RunOutcome {
  status: 'Pass' | 'Fail' | 'Blocked';
  actual: string;
}

const PERCENT_KEYS = new Set(['maxdeviationpercentabove', 'maxdeviationpercentbelow', 'postonlypriceoffsetpercent']);

function strip(v: string): string {
  return v.replace(/%/g, '').trim();
}

function mapTestData(td: Record<string, string>): TwapFormFields {
  const out: TwapFormFields = {};
  if (td.symbol) out.symbol = td.symbol;
  if (td.brokerage) out.brokerage = td.brokerage;
  if (td.side) out.side = (td.side.charAt(0).toUpperCase() + td.side.slice(1)) as any;

  const numKeys: Array<[string, keyof TwapFormFields]> = [
    ['totalquantity', 'totalQuantity'],
    ['durationminutes', 'durationMinutes'],
    ['sliceintervalseconds', 'sliceIntervalSeconds'],
    ['maxdeviationpercentabove', 'maxDeviationPercentAbove'],
    ['maxdeviationpercentbelow', 'maxDeviationPercentBelow'],
    ['postonlypriceoffsetpercent', 'postOnlyPriceOffsetPercent'],
  ];
  for (const [src, dst] of numKeys) {
    const raw = td[src];
    if (raw === undefined) continue;
    const cleaned = PERCENT_KEYS.has(src) ? strip(raw) : raw.trim();
    (out as any)[dst] = cleaned;
  }

  // Boolean toggles: sheet uses "true"/"false".
  const bools: Array<[string, keyof TwapFormFields]> = [
    ['usepostonly', 'usePostOnly'],
    ['marketexecuteunfilled', 'marketExecuteUnfilled'],
  ];
  for (const [src, dst] of bools) {
    const raw = td[src];
    if (raw === undefined) continue;
    (out as any)[dst] = /true|on|yes/i.test(raw.trim());
  }
  return out;
}

const HAPPY_PATH_TC_IDS = new Set(['TC-T026']);
const VALIDATION_TC_IDS = new Set(['TC-T027', 'TC-T028', 'TC-T029']);
const REQUIRES_LIVE_MARKET = new Set(['TC-T030', 'TC-T031', 'TC-T032', 'TC-T033']);

const TWAP_DEFAULTS: TwapFormFields = {
  symbol: 'BTCUSDT',
  side: 'Buy',
  totalQuantity: 0.1,
  durationMinutes: 60,
  sliceIntervalSeconds: 30,
  maxDeviationPercentAbove: 0.3,
  maxDeviationPercentBelow: 0.3,
  postOnlyPriceOffsetPercent: 0.05,
  usePostOnly: true,
  marketExecuteUnfilled: false,
};

export async function runTwapTC(page: Page, tc: TestCase): Promise<RunOutcome> {
  if (REQUIRES_LIVE_MARKET.has(tc.id)) {
    return {
      status: 'Blocked',
      actual:
        'Requires live market state and order-event timing inspection (precondition unmet for automated DEV run).',
    };
  }

  await openCreateTwapForm(page);
  const merged: TwapFormFields = { ...TWAP_DEFAULTS, ...mapTestData(tc.testData) };
  await fillTwapForm(page, merged);

  if (HAPPY_PATH_TC_IDS.has(tc.id)) {
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

  if (VALIDATION_TC_IDS.has(tc.id)) {
    await triggerValidation(page);
    await page.waitForTimeout(500);
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

  return { status: 'Blocked', actual: 'TWAP runner has no classification for this TC-ID yet.' };
}
