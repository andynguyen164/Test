import { Page, BrowserContext, expect } from '@playwright/test';

export const TEST_BASE_URL = 'https://unstable.dev.beetrade.com';
export const TEST_EMAIL = process.env.BEETRADE_TEST_EMAIL ?? 'andy.nguyen+03@beelabs.ai';
export const TEST_PASSWORD = process.env.BEETRADE_TEST_PASSWORD ?? 'Linh@12345';

/**
 * Authenticated-user signal: dashboard renders bot-type cards (e.g. "GRID Bot"),
 * "Create new strategy" appears as a button, and "Login"/"Sign up" disappear.
 */
async function isAuthenticated(page: Page): Promise<boolean> {
  const loginVisible = await page
    .getByRole('button', { name: /^Login$/i })
    .first()
    .isVisible()
    .catch(() => false);
  if (loginVisible) return false;
  // Positive signal: GRID Bot tile rendered on dashboard.
  const gridTile = page
    .getByRole('button', { name: /GRID Bot/i })
    .first()
    .isVisible()
    .catch(() => false);
  const createNew = page
    .getByRole('button', { name: /Create new strategy/i })
    .first()
    .isVisible()
    .catch(() => false);
  const [g, c] = await Promise.all([gridTile, createNew]);
  return g || c;
}

/**
 * Drive the BeeTrade login flow and persist state for downstream specs.
 *
 * Real flow (verified against unstable.dev): root URL renders a public-facing
 * dashboard with a "Login" button. Clicking it opens an inline form (NOT a
 * separate /login page). After submit, the same dashboard URL re-renders with
 * authenticated content. Idempotent.
 */
export async function loginAsTestUser(page: Page): Promise<void> {
  await page.goto(TEST_BASE_URL, { waitUntil: 'networkidle', timeout: 60_000 });
  await page.waitForTimeout(800);

  if (await isAuthenticated(page)) return;

  // 1. Click the dashboard's "Login" button to reveal the form.
  const loginBtn = page.getByRole('button', { name: /^Login$/i }).first();
  if (await loginBtn.isVisible().catch(() => false)) {
    await loginBtn.click({ force: true }).catch(async () => {
      await loginBtn.evaluate((el: HTMLElement) => el.click());
    });
    await page.waitForTimeout(1500);
  }

  // 2. Fill the form. The form may render inline on /dashboard (no nav change).
  const email = page.locator('input[name="email"]').first();
  await expect(email).toBeVisible({ timeout: 15_000 });
  await email.fill(TEST_EMAIL);
  await page.locator('input[name="password"]').first().fill(TEST_PASSWORD);
  await page.locator('button[type="submit"]').first().click();

  // 3. Wait for an authenticated signal.
  await expect
    .poll(async () => isAuthenticated(page), {
      timeout: 30_000,
      message: 'expected dashboard to render authenticated tiles after login',
    })
    .toBe(true);
}

/**
 * Persist storage state to disk for reuse via `storageState` in playwright.config.
 */
export async function saveAuthState(context: BrowserContext, file: string): Promise<void> {
  await context.storageState({ path: file });
}
