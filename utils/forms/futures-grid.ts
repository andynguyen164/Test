import { Page, expect, Locator } from '@playwright/test';
import { TEST_BASE_URL } from '../login';

/**
 * Helper for the BOT / Futures Grid Trading form on
 * `/strategy-builder?create=true&type=GRID`.
 *
 * Fields confirmed against unstable.dev (May 2026):
 *   input[name=lowerPrice]
 *   input[name=upperPrice]
 *   input[name=numberOfGrids]
 *   input[name=quantityPerGrid]
 *   input[name=maxNearestLevels]
 *   input[name=profitSpreadMultiplier]
 *   button "Binance" (brokerage selector — opens dropdown)
 *   button "BTCUSDT" (symbol selector)
 *   button "Neutral" / "Long" / "Short" (Mode)
 *   button "No"/"Yes" (Liquidate Out Of Range toggle)
 *   button "Create Strategy" (submit; sheet calls it "Create Bot")
 */

export interface GridFormFields {
  symbol?: string;
  brokerage?: string;
  mode?: 'Neutral' | 'Long' | 'Short';
  liquidateWhenOutOfRange?: 'ON' | 'OFF';
  lowerPrice?: number | string;
  upperPrice?: number | string;
  numberOfGrids?: number | string;
  quantityPerGrid?: number | string;
  maxNearestLevels?: number | string;
  profitSpreadMultiplier?: number | string;
}

const NUMERIC_INPUTS: Array<keyof GridFormFields> = [
  'lowerPrice',
  'upperPrice',
  'numberOfGrids',
  'quantityPerGrid',
  'maxNearestLevels',
  'profitSpreadMultiplier',
];

export async function openCreateGridForm(page: Page): Promise<void> {
  // Direct URL is the most stable entry point.
  await page.goto(`${TEST_BASE_URL}/strategy-builder?create=true&type=GRID`, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  await expect(page.locator('input[name="lowerPrice"]')).toBeVisible({ timeout: 30_000 });
}

export async function fillGridForm(page: Page, fields: GridFormFields): Promise<void> {
  // Numeric inputs first — order matters for cross-validation (lower vs upper).
  for (const key of NUMERIC_INPUTS) {
    const v = fields[key];
    if (v === undefined || v === null) continue;
    const input = page.locator(`input[name="${key}"]`).first();
    await input.fill(String(v));
    await input.blur().catch(() => {});
  }

  if (fields.brokerage) {
    await selectFromButtonDropdown(page, /Binance|OkxDemo|Brokerage/i, fields.brokerage);
  }
  if (fields.symbol) {
    await selectFromButtonDropdown(page, /BTCUSDT|Symbol/i, fields.symbol);
  }
  if (fields.mode) {
    await selectFromButtonDropdown(page, /Neutral|Long|Short|Mode/i, fields.mode);
  }
  if (fields.liquidateWhenOutOfRange) {
    // Toggle is a button labelled "No" / "Yes". Click only if mismatched.
    const wantYes = fields.liquidateWhenOutOfRange === 'ON';
    const yesBtn = page.getByRole('button', { name: /^Yes$/i }).first();
    const noBtn = page.getByRole('button', { name: /^No$/i }).first();
    const yesVisible = await yesBtn.isVisible().catch(() => false);
    const noVisible = await noBtn.isVisible().catch(() => false);
    if (wantYes && noVisible) await noBtn.click();
    if (!wantYes && yesVisible) await yesBtn.click();
  }
}

/**
 * Click the trigger button (matched by `triggerNameRe`), then pick the option
 * matching `desired`. Most BeeTrade dropdowns render a popover with role=option
 * or simple buttons under a portal — fall back to text match if needed.
 */
async function selectFromButtonDropdown(
  page: Page,
  triggerNameRe: RegExp,
  desired: string,
): Promise<void> {
  const trigger = page.getByRole('button', { name: triggerNameRe }).first();
  if (!(await trigger.isVisible().catch(() => false))) return;
  await trigger.click().catch(() => {});
  const optByRole = page.getByRole('option', { name: new RegExp(`^${escapeRegex(desired)}$`, 'i') }).first();
  const optByText = page.getByText(desired, { exact: true }).first();
  for (const candidate of [optByRole, optByText]) {
    if (await candidate.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await candidate.click();
      return;
    }
  }
  // If neither matched, dismiss the popover (Esc) so subsequent fills aren't blocked.
  await page.keyboard.press('Escape').catch(() => {});
}

export async function submitCreate(page: Page): Promise<void> {
  // Sheet says "Create Bot"; UI says "Create Strategy". Match either.
  const submit = page
    .getByRole('button', { name: /Create (Bot|Strategy)/i })
    .first();
  await submit.click();
}

/**
 * Returns true iff the submit button is currently disabled.
 * Used by validation-error TCs (TC-T002..T006, T011, T012).
 */
export async function isSubmitDisabled(page: Page): Promise<boolean> {
  const submit = page
    .getByRole('button', { name: /Create (Bot|Strategy)/i })
    .first();
  if (!(await submit.isVisible().catch(() => false))) return true;
  return submit.isDisabled().catch(() => false);
}

/**
 * Return any visible inline validation/error text near the form.
 * BeeTrade renders errors as small red text under the input or as a toast.
 * We restrict to elements whose tone class signals an error to avoid
 * matching unrelated helper/placeholder text.
 */
export async function getValidationMessages(page: Page): Promise<string[]> {
  const candidates: Locator[] = [
    page.locator('[role="alert"]:visible'),
    page.locator('[data-sonner-toast][data-type="error"]:visible'),
    page.locator(
      '.text-destructive:visible, .text-red-500:visible, .text-red-600:visible, .text-error:visible',
    ),
    page.locator('[aria-invalid="true"] ~ *:visible'),
  ];
  const seen = new Set<string>();
  for (const loc of candidates) {
    const items = await loc.all().catch(() => []);
    for (const it of items) {
      const t = ((await it.textContent().catch(() => '')) ?? '').trim();
      // Reject empty, very-long, and obvious non-errors (e.g. the "*" required marker).
      if (!t || t.length > 200 || t === '*') continue;
      seen.add(t);
    }
  }
  return Array.from(seen);
}

/**
 * Trigger validation: blur all numeric inputs by tabbing through, then click
 * the form area. Some BeeTrade fields only validate on blur or submit.
 */
export async function triggerValidation(page: Page): Promise<void> {
  for (const name of NUMERIC_INPUTS) {
    const input = page.locator(`input[name="${name}"]`).first();
    if (await input.isVisible().catch(() => false)) {
      await input.focus().catch(() => {});
      await input.blur().catch(() => {});
    }
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
