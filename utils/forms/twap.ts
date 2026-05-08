import { Page, expect, Locator } from '@playwright/test';
import { TEST_BASE_URL } from '../login';

/**
 * Helper for the BOT / TWAP Futures Trading form on
 * `/strategy-builder?create=true&type=TWAP`.
 *
 * Confirmed against unstable.dev (May 2026):
 *   input[name=totalQuantity]
 *   input[name=durationMinutes]
 *   input[name=sliceIntervalSeconds]
 *   input[name=maxDeviationPercentAbove]
 *   input[name=maxDeviationPercentBelow]
 *   input[name=postOnlyPriceOffsetPercent]
 *   button "Binance" (brokerage)
 *   button "BTCUSDT" (symbol)
 *   button "Buy" / "Sell" (Side)
 *   button "No"/"Yes" (Use Post Only — first toggle)
 *   button "No"/"Yes" (Market Execute Unfilled — second toggle)
 *   button "Create Strategy" (submit)
 */

export interface TwapFormFields {
  symbol?: string;
  brokerage?: string;
  side?: 'Buy' | 'Sell';
  totalQuantity?: number | string;
  durationMinutes?: number | string;
  sliceIntervalSeconds?: number | string;
  maxDeviationPercentAbove?: number | string;
  maxDeviationPercentBelow?: number | string;
  postOnlyPriceOffsetPercent?: number | string;
  usePostOnly?: boolean;
  marketExecuteUnfilled?: boolean;
}

const NUMERIC_INPUTS: Array<keyof TwapFormFields> = [
  'totalQuantity',
  'durationMinutes',
  'sliceIntervalSeconds',
  'maxDeviationPercentAbove',
  'maxDeviationPercentBelow',
  'postOnlyPriceOffsetPercent',
];

export async function openCreateTwapForm(page: Page): Promise<void> {
  await page.goto(`${TEST_BASE_URL}/strategy-builder?create=true&type=TWAP`, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  await expect(page.locator('input[name="totalQuantity"]')).toBeVisible({ timeout: 30_000 });
}

export async function fillTwapForm(page: Page, fields: TwapFormFields): Promise<void> {
  for (const key of NUMERIC_INPUTS) {
    if (!(key in fields)) continue;
    const v = fields[key];
    const input = page.locator(`input[name="${key}"]`).first();
    if (v === null || v === '') {
      await input.fill('');
      await input.blur().catch(() => {});
      continue;
    }
    if (v === undefined) continue;
    await input.fill(String(v));
    await input.blur().catch(() => {});
  }

  if (fields.brokerage) {
    await selectFromButtonDropdown(page, /Binance|OkxDemo|Brokerage/i, fields.brokerage);
  }
  if (fields.symbol) {
    await selectFromButtonDropdown(page, /BTCUSDT|Symbol/i, fields.symbol);
  }
  if (fields.side) {
    await selectFromButtonDropdown(page, /^(Buy|Sell)$/i, fields.side);
  }
  if (typeof fields.usePostOnly === 'boolean') {
    await setToggleByLabel(page, /Use Post Only/i, fields.usePostOnly);
  }
  if (typeof fields.marketExecuteUnfilled === 'boolean') {
    await setToggleByLabel(page, /Market Execute Unfilled/i, fields.marketExecuteUnfilled);
  }
}

/**
 * Toggle is a button "No"/"Yes" rendered next to the labeled section.
 * Locate the label, walk to its containing row, then click the toggle.
 */
async function setToggleByLabel(page: Page, labelRe: RegExp, want: boolean): Promise<void> {
  const label = page.getByText(labelRe).first();
  if (!(await label.isVisible().catch(() => false))) return;
  // Look within the closest container for a Yes/No button.
  const row = label.locator('xpath=ancestor::*[self::div or self::section][1]');
  const yesBtn = row.getByRole('button', { name: /^Yes$/i }).first();
  const noBtn = row.getByRole('button', { name: /^No$/i }).first();
  const yesVisible = await yesBtn.isVisible().catch(() => false);
  const noVisible = await noBtn.isVisible().catch(() => false);
  if (want && noVisible) await noBtn.click();
  if (!want && yesVisible) await yesBtn.click();
}

async function selectFromButtonDropdown(
  page: Page,
  triggerNameRe: RegExp,
  desired: string,
): Promise<void> {
  const trigger = page.getByRole('button', { name: triggerNameRe }).first();
  if (!(await trigger.isVisible().catch(() => false))) return;
  await trigger.click().catch(() => {});
  const optByRole = page
    .getByRole('option', { name: new RegExp(`^${escapeRegex(desired)}$`, 'i') })
    .first();
  const optByText = page.getByText(desired, { exact: true }).first();
  for (const candidate of [optByRole, optByText]) {
    if (await candidate.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await candidate.click();
      return;
    }
  }
  await page.keyboard.press('Escape').catch(() => {});
}

export async function submitCreate(page: Page): Promise<void> {
  await page.getByRole('button', { name: /Create (Bot|Strategy)/i }).first().click();
}

export async function isSubmitDisabled(page: Page): Promise<boolean> {
  const submit = page.getByRole('button', { name: /Create (Bot|Strategy)/i }).first();
  if (!(await submit.isVisible().catch(() => false))) return true;
  return submit.isDisabled().catch(() => false);
}

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
      if (!t || t.length > 200 || t === '*') continue;
      seen.add(t);
    }
  }
  return Array.from(seen);
}

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
