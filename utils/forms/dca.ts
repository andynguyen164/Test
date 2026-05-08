import { Page, expect, Locator } from '@playwright/test';
import { TEST_BASE_URL } from '../login';

/**
 * Helper for the BOT / DCA Trading form on
 * `/strategy-builder?create=true&type=DCA`.
 *
 * Confirmed against unstable.dev (May 2026):
 *   input[name=baseOrderQuantity]
 *   input[name=dcaOrderQuantity]
 *   input[name=maxDcaOrders]
 *   input[name=priceDeviation]      // entered as percentage value (e.g. "1" = 1%)
 *   input[name=takeProfit]          // optional
 *   input[name=stopLoss]            // optional
 *   input[name=volumeScale]
 *   input[name=priceDeviationScale]
 *   button "Binance" (brokerage)
 *   button "BTCUSDT" (symbol)
 *   button "Long" / "Short" (direction)
 *   button "Create Strategy" (submit)
 */

export interface DcaFormFields {
  symbol?: string;
  brokerage?: string;
  direction?: 'Long' | 'Short';
  baseOrderQuantity?: number | string;
  dcaOrderQuantity?: number | string;
  maxDcaOrders?: number | string;
  priceDeviation?: number | string;
  takeProfit?: number | string | null; // null = leave empty
  stopLoss?: number | string;
  volumeScale?: number | string;
  priceDeviationScale?: number | string;
}

const NUMERIC_INPUTS: Array<keyof DcaFormFields> = [
  'baseOrderQuantity',
  'dcaOrderQuantity',
  'maxDcaOrders',
  'priceDeviation',
  'takeProfit',
  'stopLoss',
  'volumeScale',
  'priceDeviationScale',
];

export async function openCreateDcaForm(page: Page): Promise<void> {
  await page.goto(`${TEST_BASE_URL}/strategy-builder?create=true&type=DCA`, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  await expect(page.locator('input[name="baseOrderQuantity"]')).toBeVisible({ timeout: 30_000 });
}

export async function fillDcaForm(page: Page, fields: DcaFormFields): Promise<void> {
  for (const key of NUMERIC_INPUTS) {
    if (!(key in fields)) continue;
    const v = fields[key];
    const input = page.locator(`input[name="${key}"]`).first();
    if (v === null || v === '') {
      // Explicit empty — clear the input.
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
  if (fields.direction) {
    await selectFromButtonDropdown(page, /^(Long|Short)$/i, fields.direction);
  }
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
  const submit = page.getByRole('button', { name: /Create (Bot|Strategy)/i }).first();
  await submit.click();
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
