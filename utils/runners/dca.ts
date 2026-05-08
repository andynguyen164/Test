import { Page } from '@playwright/test';
import { TestCase } from '../excel';
import {
  openCreateDcaForm,
  fillDcaForm,
  submitCreate,
  isSubmitDisabled,
  getValidationMessages,
  triggerValidation,
  DcaFormFields,
} from '../forms/dca';

export interface RunOutcome {
  status: 'Pass' | 'Fail' | 'Blocked';
  actual: string;
}

const PERCENT_KEYS = new Set(['pricedeviation', 'takeprofit', 'stoploss']);

function stripPercent(v: string): string {
  return v.replace(/%/g, '').trim();
}

function mapTestData(td: Record<string, string>): DcaFormFields {
  const out: DcaFormFields = {};
  if (td.symbol) out.symbol = td.symbol;
  if (td.brokerage) out.brokerage = td.brokerage;
  if (td.direction) out.direction = (td.direction.charAt(0).toUpperCase() + td.direction.slice(1)) as any;

  const numKeys: Array<[string, keyof DcaFormFields]> = [
    ['baseorderquantity', 'baseOrderQuantity'],
    ['dcaorderquantity', 'dcaOrderQuantity'],
    ['maxdcaorders', 'maxDcaOrders'],
    ['pricedeviation', 'priceDeviation'],
    ['takeprofit', 'takeProfit'],
    ['stoploss', 'stopLoss'],
    ['volumescale', 'volumeScale'],
    ['pricedeviationscale', 'priceDeviationScale'],
  ];
  for (const [src, dst] of numKeys) {
    const raw = td[src];
    if (raw === undefined) continue;
    const trimmed = raw.trim();
    if (/^\(.*empty.*\)$/i.test(trimmed) || /not entered/i.test(trimmed)) {
      // TC-T019: "(empty / not entered)" -> leave field blank
      (out as any)[dst] = null;
      continue;
    }
    const cleaned = PERCENT_KEYS.has(src) ? stripPercent(trimmed) : trimmed;
    (out as any)[dst] = cleaned;
  }
  return out;
}

const HAPPY_PATH_TC_IDS = new Set(['TC-T014', 'TC-T018', 'TC-T019', 'TC-T020']);
const VALIDATION_TC_IDS = new Set(['TC-T015', 'TC-T016', 'TC-T017', 'TC-T021', 'TC-T022']);
const REQUIRES_BROKERAGE = new Set(['TC-T023', 'TC-T024', 'TC-T025']);

const DCA_DEFAULTS: DcaFormFields = {
  symbol: 'BTCUSDT',
  direction: 'Long',
  baseOrderQuantity: 0.01,
  dcaOrderQuantity: 0.005,
  maxDcaOrders: 5,
  priceDeviation: 1,
  takeProfit: 1.5,
  stopLoss: 10,
  volumeScale: 1,
  priceDeviationScale: 1,
};

export async function runDcaTC(page: Page, tc: TestCase): Promise<RunOutcome> {
  if (REQUIRES_BROKERAGE.has(tc.id)) {
    return {
      status: 'Blocked',
      actual:
        'Requires connected brokerage to inspect placed safety orders / DCA levels (precondition unmet for automated DEV run).',
    };
  }

  await openCreateDcaForm(page);
  const parsed = mapTestData(tc.testData);
  const merged: DcaFormFields = { ...DCA_DEFAULTS, ...parsed };
  await fillDcaForm(page, merged);

  if (HAPPY_PATH_TC_IDS.has(tc.id)) {
    await submitCreate(page);
    const success = await Promise.race([
      page
        .waitForURL((u) => !u.toString().includes('create=true'), { timeout: 30_000 })
        .then(() => true)
        .catch(() => false),
      page
        .getByText(/strategy created|bot created|running successfully|success/i)
        .first()
        .isVisible({ timeout: 30_000 })
        .catch(() => false),
      page
        .getByRole('button', { name: /^Creating$/i })
        .first()
        .waitFor({ state: 'detached', timeout: 30_000 })
        .then(() => true)
        .catch(() => false),
    ]);
    if (success) {
      return { status: 'Pass', actual: 'Bot creation submitted; success indicator observed.' };
    }
    const msgs = await getValidationMessages(page);
    return {
      status: 'Fail',
      actual: `Submitted but no success signal within 30s. Validation messages: ${
        msgs.join(' | ') || '(none)'
      }`,
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
        actual: `Validation observed (button disabled=${disabled}, messages=${
          msgs.join(' | ') || '(none)'
        }).`,
      };
    }
    await submitCreate(page);
    await page.waitForTimeout(1500);
    msgs = await getValidationMessages(page);
    if (msgs.length) {
      return {
        status: 'Pass',
        actual: `Validation surfaced after submit: ${msgs.join(' | ')}`,
      };
    }
    return {
      status: 'Fail',
      actual:
        'Expected validation error or disabled submit, but neither surfaced. ' +
        'Likely an app bug: invalid config was accepted silently.',
    };
  }

  return {
    status: 'Blocked',
    actual: 'DCA runner has no classification for this TC-ID yet.',
  };
}
