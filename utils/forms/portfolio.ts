import { Page, expect, Locator } from '@playwright/test';
import { TEST_BASE_URL } from '../login';

/**
 * Helper for the BOT / Portfolio Rebalancing form on
 * `/strategy-builder?create=true&type=REBALANCING`.
 *
 * Layout (verified on unstable.dev, May 2026):
 *   button "Binance" (brokerage)
 *   Section "Portfolio":
 *     button "Add Item" — adds a target row
 *     each row: button "Select symbol" + Weight input (placeholder="Enter number")
 *   Section "Schedule Rule":
 *     button "Select option" (Type) — choices: RegularIntervals / SpecificTimes
 *     button "Select option" (Date Rule) — choices include EveryDay etc.
 *     input[placeholder="HH:mm:ss"] (interval time when RegularIntervals)
 *     button "Add Times" (only enabled when SpecificTimes selected)
 *   button "Create Strategy" (submit)
 *
 * Inputs are NOT named — match by placeholder + container.
 */

export interface PortfolioTarget {
  symbol: string;
  weight: number | string;
}

export interface PortfolioFields {
  brokerage?: string;
  targets?: PortfolioTarget[];
  /**
   * UI exposes two values: "Every" (interval mode) or "At" (specific times).
   * Sheet calls these RegularIntervals / SpecificTimes — runner translates.
   */
  scheduleType?: 'Every' | 'At';
  scheduleFrequency?: string; // EveryDay / Monday / MonthStart / ...
  scheduleTime?: string; // HH:mm:ss when scheduleType=Every
  scheduleTimes?: string[]; // HH:mm:ss list when scheduleType=At
}

export async function openCreatePortfolioForm(page: Page): Promise<void> {
  await page.goto(`${TEST_BASE_URL}/strategy-builder?create=true&type=REBALANCING`, {
    waitUntil: 'networkidle',
    timeout: 60_000,
  });
  await expect(page.getByText('Portfolio', { exact: false }).first()).toBeVisible({
    timeout: 30_000,
  });
}

export async function fillPortfolioForm(page: Page, fields: PortfolioFields): Promise<void> {
  if (fields.brokerage) {
    await selectFromButtonDropdown(page, /Binance|OkxDemo/i, fields.brokerage);
  }

  if (fields.targets) {
    // Each "Add Item" click adds a portfolio row. The form may already render
    // one empty row by default — add (n - existing) more.
    const portfolioAdd = portfolioAddItemButton(page);
    for (let i = 0; i < fields.targets.length; i++) {
      // If row i has no Select-symbol button yet, click Add Item.
      const symbolButtons = page.getByRole('button', { name: /Select symbol/i });
      const have = await symbolButtons.count().catch(() => 0);
      if (have <= i) {
        if (await portfolioAdd.isVisible().catch(() => false)) {
          await portfolioAdd.click();
          await page.waitForTimeout(300);
        }
      }
    }
    // Fill each row.
    for (let i = 0; i < fields.targets.length; i++) {
      const target = fields.targets[i];
      // Select symbol
      const sym = page.getByRole('button', { name: /Select symbol/i }).nth(i);
      if (await sym.isVisible().catch(() => false)) {
        await sym.click();
        await page.waitForTimeout(400);
        const opt = page.getByText(target.symbol, { exact: true }).first();
        if (await opt.isVisible({ timeout: 3_000 }).catch(() => false)) {
          await opt.click();
        } else {
          await page.keyboard.press('Escape').catch(() => {});
        }
      }
      // Weight input — there are N "Enter number" inputs corresponding to the
      // N portfolio rows.
      const weightInput = page.locator('input[placeholder="Enter number"]').nth(i);
      if (await weightInput.isVisible().catch(() => false)) {
        await weightInput.fill(String(target.weight));
        await weightInput.blur().catch(() => {});
      }
    }
  }

  // Schedule selectors: trigger index 0 = Date Rule (frequency),
  //                     trigger index 1 = Type (Every/At).
  // Pick Type first because it gates whether the time input(s) are enabled.
  if (fields.scheduleType) {
    await pickScheduleByIndex(page, 1, fields.scheduleType);
  }
  if (fields.scheduleFrequency) {
    await pickScheduleByIndex(page, 0, fields.scheduleFrequency);
  }
  if (fields.scheduleTime) {
    const timeInput = page.locator('input[placeholder="HH:mm:ss"]').first();
    if (await timeInput.isVisible().catch(() => false)) {
      // Wait for the input to become enabled (it's gated by scheduleType=Every).
      await timeInput.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});
      const enabled = await timeInput.isEnabled().catch(() => false);
      if (enabled) {
        await timeInput.fill(fields.scheduleTime);
        await timeInput.blur().catch(() => {});
      }
    }
  }
  if (fields.scheduleTimes && fields.scheduleTimes.length) {
    const addTimes = page.getByRole('button', { name: /Add Times/i }).first();
    for (let i = 0; i < fields.scheduleTimes.length; i++) {
      if (await addTimes.isEnabled().catch(() => false)) {
        await addTimes.click();
        await page.waitForTimeout(200);
      }
      const t = page.locator('input[placeholder="HH:mm:ss"]').nth(i);
      if (await t.isVisible().catch(() => false) && (await t.isEnabled().catch(() => false))) {
        await t.fill(fields.scheduleTimes[i]);
        await t.blur().catch(() => {});
      }
    }
  }
}

function portfolioAddItemButton(page: Page): Locator {
  // First "Add Item" on the page is for portfolio targets (Schedule's is second).
  return page.getByRole('button', { name: /Add Item/i }).first();
}

/**
 * The two "Select option" triggers are positional:
 *   index 0 = Date Rule  (EveryDay/Monday/.../MonthEnd/...)
 *   index 1 = Type       (Every / At)
 * Options render in a Radix popover (role=dialog with [data-radix-popper-content-wrapper]
 * wrapper) — no role=option attribute, so we match the option text inside the popover.
 */
async function pickScheduleByIndex(
  page: Page,
  triggerIndex: number,
  desired: string,
): Promise<void> {
  const triggers = page.getByRole('button', { name: /^Select option$/ });
  const count = await triggers.count().catch(() => 0);
  if (count <= triggerIndex) return;
  const trigger = triggers.nth(triggerIndex);
  await trigger.scrollIntoViewIfNeeded().catch(() => {});
  await trigger.click();
  // Wait for the Radix popover to mount.
  const popover = page.locator('[data-radix-popper-content-wrapper] [role="dialog"]').last();
  await popover.waitFor({ state: 'visible', timeout: 5_000 }).catch(() => {});

  const opt = popover.getByText(new RegExp(`^${escapeRegex(desired)}$`, 'i')).first();
  if (await opt.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await opt.click();
    // Wait for popover to close so subsequent steps don't see stale state.
    await popover.waitFor({ state: 'detached', timeout: 3_000 }).catch(() => {});
    return;
  }
  // Fallback: substring match.
  const optSub = popover.getByText(new RegExp(escapeRegex(desired), 'i')).first();
  if (await optSub.isVisible({ timeout: 1_000 }).catch(() => false)) {
    await optSub.click();
    return;
  }
  await page.keyboard.press('Escape').catch(() => {});
}

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
  for (const c of [optByRole, optByText]) {
    if (await c.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await c.click();
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

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
