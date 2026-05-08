import { Page, expect } from '@playwright/test';
import { TestCase } from '../excel';
import {
  openCreateGridForm,
  fillGridForm,
  submitCreate,
  isSubmitDisabled,
  getValidationMessages,
  triggerValidation,
  GridFormFields,
} from '../forms/futures-grid';

export interface RunOutcome {
  status: 'Pass' | 'Fail' | 'Blocked';
  actual: string;
}

/**
 * Translate the parsed Excel `testData` map into the typed GridFormFields shape.
 * Numeric strings become numbers; OFF/ON stay literal.
 */
function mapTestData(td: Record<string, string>): GridFormFields {
  const out: GridFormFields = {};
  if (td.symbol) out.symbol = td.symbol;
  if (td.brokerage) out.brokerage = td.brokerage;
  if (td.gridmode) out.mode = td.gridmode as any;
  if (td.liquidatewhenoutofrange) {
    out.liquidateWhenOutOfRange = /on/i.test(td.liquidatewhenoutofrange) ? 'ON' : 'OFF';
  }
  for (const k of [
    'lowerprice',
    'upperprice',
    'numberofgrids',
    'quantitypergrid',
    'maxnearestlevels',
    'profitspreadmultiplier',
  ] as const) {
    if (td[k] === undefined) continue;
    const camel = camelCase(k);
    (out as any)[camel] = td[k];
  }
  return out;
}

function camelCase(s: string): string {
  // 'lowerprice' -> 'lowerPrice'
  const map: Record<string, string> = {
    lowerprice: 'lowerPrice',
    upperprice: 'upperPrice',
    numberofgrids: 'numberOfGrids',
    quantitypergrid: 'quantityPerGrid',
    maxnearestlevels: 'maxNearestLevels',
    profitspreadmultiplier: 'profitSpreadMultiplier',
  };
  return map[s] ?? s;
}

const VALIDATION_TC_IDS = new Set([
  'TC-T002', 'TC-T003', 'TC-T004', 'TC-T005', 'TC-T006',
  'TC-T011', 'TC-T012',
]);

const HAPPY_PATH_TC_IDS = new Set(['TC-T001']);

/**
 * Out-of-scope: tests that need price simulation, brokerage state, or order-book
 * inspection. Mark Blocked (precondition unmet) — this matches CLAUDE.md guidance
 * for "Brokerage connected" / live-state preconditions.
 */
const REQUIRES_BROKERAGE_OR_SIMULATION = new Set([
  'TC-T007', 'TC-T008', 'TC-T009', 'TC-T010', 'TC-T013',
]);

export async function runFuturesGridTC(page: Page, tc: TestCase): Promise<RunOutcome> {
  if (REQUIRES_BROKERAGE_OR_SIMULATION.has(tc.id)) {
    return {
      status: 'Blocked',
      actual: 'Requires connected brokerage and order-book inspection (precondition unmet for automated DEV run).',
    };
  }

  await openCreateGridForm(page);
  const fields = mapTestData(tc.testData);

  // Defaults from TC-T001 — applied to validation TCs so the field that's
  // NOT under test is valid.
  const defaults: GridFormFields = {
    lowerPrice: 50000,
    upperPrice: 80000,
    numberOfGrids: 10,
    quantityPerGrid: 0.001,
    mode: 'Neutral',
    liquidateWhenOutOfRange: 'OFF',
  };
  const merged: GridFormFields = { ...defaults, ...fields };

  await fillGridForm(page, merged);

  if (HAPPY_PATH_TC_IDS.has(tc.id)) {
    await submitCreate(page);
    // Wait for either: URL change away from create=true, success toast, or
    // submit button text changing to "Creating" then disappearing.
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
    // Trigger blur-based validation first.
    await triggerValidation(page);
    await page.waitForTimeout(500);

    // Some validation TCs expect button-disabled, others expect surfaced error.
    // Either is acceptable for Pass.
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

    // Last resort: try submitting and checking for surfaced error/toast.
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

  // Fallback for any other Grid TC we haven't classified.
  return {
    status: 'Blocked',
    actual: 'Futures Grid runner has no classification for this TC-ID yet.',
  };
}
