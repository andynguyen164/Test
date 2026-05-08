import { Page } from '@playwright/test';
import { TestCase } from '../excel';
import { TEST_BASE_URL } from '../login';

export interface RunOutcome {
  status: 'Pass' | 'Fail' | 'Blocked';
  actual: string;
}

/**
 * Bots dashboard at `/runs` (verified May 2026). Two tabs: Live | Activity.
 * 13 of 14 TCs require at least one running bot — when the account has none,
 * we Block them with a clear precondition reason. BOT-005 (empty state) is the
 * exception: it's exactly the precondition unmet state.
 */

const REQUIRES_RUNNING_BOTS = new Set([
  'BOT-001',
  'BOT-002',
  'BOT-003',
  'BOT-004',
  'BOT-006',
  'BOT-007',
  'BOT-008',
  'BOT-009',
  'BOT-010',
  'BOT-011',
  'BOT-012',
  'BOT-013',
  'BOT-014',
]);

async function openBotsPage(page: Page) {
  await page.goto(`${TEST_BASE_URL}/runs`, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForTimeout(1500);
}

async function clickTab(page: Page, name: 'Live' | 'Activity'): Promise<void> {
  const tab = page.getByRole('tab', { name }).first();
  if (await tab.isVisible().catch(() => false)) {
    await tab.click();
    await page.waitForTimeout(800);
  }
}

async function botCardCount(page: Page): Promise<number> {
  // Heuristic: bot cards have a PNL% chip + symbol text. Count rows that
  // expose a "Stop" button as a strong signal of a running bot.
  const candidates = [
    page.getByRole('button', { name: /^Stop$/i }),
    page.locator('[data-testid="bot-card"]'),
  ];
  for (const c of candidates) {
    const n = await c.count().catch(() => 0);
    if (n > 0) return n;
  }
  return 0;
}

async function emptyStateVisible(page: Page): Promise<boolean> {
  const empty = page.getByText(/No active bots|No bots/i).first();
  return empty.isVisible({ timeout: 2_000 }).catch(() => false);
}

export async function runBotsTC(page: Page, tc: TestCase): Promise<RunOutcome> {
  await openBotsPage(page);

  if (tc.id === 'BOT-005') {
    // Empty state TC — Pass iff Live tab shows the empty-state message and
    // there are no bot cards.
    await clickTab(page, 'Live');
    const empty = await emptyStateVisible(page);
    const cards = await botCardCount(page);
    if (empty && cards === 0) {
      return { status: 'Pass', actual: '"No active bots" empty state visible. 0 bot cards.' };
    }
    if (cards > 0) {
      return {
        status: 'Blocked',
        actual: `Account has ${cards} active bot(s) — empty-state precondition unmet. Run BOT-005 against a clean account.`,
      };
    }
    return {
      status: 'Fail',
      actual: 'Live tab has no bot cards but expected empty-state message was not visible.',
    };
  }

  if (REQUIRES_RUNNING_BOTS.has(tc.id)) {
    // Most TCs require ≥1 running bot. Detect and gate.
    await clickTab(page, 'Live');
    const cards = await botCardCount(page);
    if (cards === 0) {
      return {
        status: 'Blocked',
        actual:
          'Precondition unmet: at least 1 running bot required. Test account currently has 0 active bots ' +
          '(create a bot via Trading sheet first; happy-path bot creation is currently failing — see BUG-T-* entries).',
      };
    }
    return {
      status: 'Blocked',
      actual:
        `${cards} bot(s) detected, but the assertion logic for ${tc.id} hasn't been implemented yet. ` +
        'This row needs a per-TC handler.',
    };
  }

  return { status: 'Blocked', actual: 'No classification for this Bots TC-ID.' };
}
