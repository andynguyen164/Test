import { Page, Locator } from '@playwright/test';
import { TestCase } from '../excel';
import { TEST_BASE_URL } from '../login';

export interface RunOutcome {
  status: 'Pass' | 'Fail' | 'Blocked';
  actual: string;
}

/**
 * Alerts page = `/alert`. Create form = `/alert?create=true`.
 * Confirmed fields (May 2026):
 *   input[name=name]
 *   button "Select brokerage"
 *   radio: "No Expiration" / "On Date & Time"
 *   checkbox: Email / Web (Notify Via)
 *   button "Create Alert" (submit)
 *
 * AI Method, condition tree builder, and notification triggers are out of
 * scope for an automated DEV run — they need either an AI roundtrip with
 * non-deterministic output, a real alert trigger event, or a brokerage hook.
 * Those TCs are Blocked with a precise reason rather than false-passed.
 */

const AI_METHOD = new Set(['AL-001', 'AL-002', 'AL-003']);
const CONDITION_LOGIC = new Set(['AL-007', 'AL-008', 'AL-009', 'AL-010', 'AL-011', 'AL-012', 'AL-013', 'AL-014', 'AL-015']);
const REQUIRES_FIRING_EVENT = new Set(['AL-020', 'AL-021', 'AL-022']);
const REQUIRES_EXISTING_ALERT = new Set(['AL-016', 'AL-017', 'AL-018', 'AL-019']);
const REQUIRES_TIMING = new Set(['AL-005']);
const MANUAL_CREATE = new Set(['AL-004']);
const MANUAL_VALIDATION = new Set(['AL-006']);

async function getValidationMessages(page: Page): Promise<string[]> {
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

async function openAlertsPage(page: Page) {
  await page.goto(`${TEST_BASE_URL}/alert`, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(1000);
}

async function openCreateAlertForm(page: Page) {
  await page.goto(`${TEST_BASE_URL}/alert?create=true`, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(1500);
}

export async function runAlertTC(page: Page, tc: TestCase): Promise<RunOutcome> {
  if (AI_METHOD.has(tc.id)) {
    return {
      status: 'Blocked',
      actual:
        'AI Method TC requires non-deterministic AI roundtrip and visual condition-tree assertion (out of scope for automated DEV).',
    };
  }
  if (CONDITION_LOGIC.has(tc.id)) {
    return {
      status: 'Blocked',
      actual:
        'Condition-tree builder (operands, AND/OR, nested logic) is a complex visual editor — needs dedicated helper not yet written.',
    };
  }
  if (REQUIRES_FIRING_EVENT.has(tc.id)) {
    return {
      status: 'Blocked',
      actual: 'Requires waiting for a real market trigger event + notification delivery (out of scope for automated DEV).',
    };
  }
  if (REQUIRES_EXISTING_ALERT.has(tc.id)) {
    return {
      status: 'Blocked',
      actual:
        'Requires at least 1 existing alert. Test account currently has 0 alerts; chained on alert creation flow.',
    };
  }
  if (REQUIRES_TIMING.has(tc.id)) {
    return {
      status: 'Blocked',
      actual: 'Requires real-time wait for expiration auto-deactivation (clock-based) — out of scope for automated DEV.',
    };
  }

  if (MANUAL_CREATE.has(tc.id)) {
    await openCreateAlertForm(page);
    const nameInput = page.locator('input[name="name"]').first();
    if (!(await nameInput.isVisible().catch(() => false))) {
      return { status: 'Blocked', actual: 'Create alert form did not render `name` input — selector drifted.' };
    }
    await nameInput.fill('auto-AL-004-BTC RSI Alert');

    // Pick brokerage
    const brokerage = page.getByRole('button', { name: /Select brokerage/i }).first();
    if (await brokerage.isVisible().catch(() => false)) {
      await brokerage.click();
      await page.waitForTimeout(500);
      const opt = page.getByText(/Binance|OkxDemo/i, { exact: false }).last();
      if (await opt.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await opt.click();
      } else {
        await page.keyboard.press('Escape').catch(() => {});
      }
    }

    // Notify via Web + Email
    for (const lbl of ['Email', 'Web']) {
      const cb = page.getByLabel(lbl).first();
      if (await cb.isVisible().catch(() => false)) {
        const checked = await cb.isChecked().catch(() => false);
        if (!checked) await cb.check().catch(() => {});
      }
    }

    // Submit
    const submit = page.getByRole('button', { name: /Create Alert/i }).first();
    await submit.click();
    const success = await Promise.race([
      page.waitForURL((u) => !u.toString().includes('create=true'), { timeout: 15_000 })
        .then(() => true).catch(() => false),
      page.getByText(/alert saved|alert created|success/i).first()
        .isVisible({ timeout: 15_000 }).catch(() => false),
    ]);
    if (success) return { status: 'Pass', actual: 'Alert creation submitted; success indicator observed.' };
    const msgs = await getValidationMessages(page);
    return {
      status: 'Fail',
      actual: `Alert submit produced no success signal. Validation messages: ${msgs.join(' | ') || '(none)'}`,
    };
  }

  if (MANUAL_VALIDATION.has(tc.id)) {
    await openCreateAlertForm(page);
    // Submit without filling required fields.
    const submit = page.getByRole('button', { name: /Create Alert/i }).first();
    if (await submit.isVisible().catch(() => false) && (await submit.isDisabled().catch(() => false))) {
      return { status: 'Pass', actual: 'Submit disabled when required fields are empty (validation gate works).' };
    }
    await submit.click().catch(() => {});
    await page.waitForTimeout(1000);
    const msgs = await getValidationMessages(page);
    if (msgs.length) return { status: 'Pass', actual: `Validation surfaced after submit: ${msgs.join(' | ')}` };
    return {
      status: 'Fail',
      actual: 'Expected validation when required fields empty, but neither disabled state nor error message surfaced.',
    };
  }

  return { status: 'Blocked', actual: 'No classification for this Alert TC-ID.' };
}
