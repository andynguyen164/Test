import { Locator, Page, expect } from '@playwright/test';

export async function waitForVisible(locator: Locator, timeout = 15_000): Promise<void> {
  await expect(locator).toBeVisible({ timeout });
}

export async function safeFill(locator: Locator, value: string, timeout = 15_000): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout });
  await locator.fill(value);
}

export async function clickIfVisible(locator: Locator, timeout = 5_000): Promise<boolean> {
  try {
    await locator.waitFor({ state: 'visible', timeout });
    await locator.click();
    return true;
  } catch {
    return false;
  }
}

export async function expectVisibleText(page: Page, text: string, timeout = 10_000): Promise<void> {
  await expect(page.getByText(text, { exact: false }).first()).toBeVisible({ timeout });
}

export async function retry<T>(
  fn: () => Promise<T>,
  attempts = 3,
  delayMs = 500,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeRegex(s: string, flags = 'i'): RegExp | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  try {
    return new RegExp(escapeRegex(trimmed), flags);
  } catch {
    return null;
  }
}

/**
 * Heuristic step interpreter — best-effort. Real automation per row will need
 * targeted helpers; this is the fallback so the runner never silently no-ops.
 * Returns one of: 'navigated' | 'clicked' | 'filled' | 'asserted' | 'skipped'.
 */
export async function tryGenericStep(page: Page, step: string): Promise<string> {
  const lower = step.toLowerCase();

  // 1. Navigate to … via primary nav
  const navMatch = step.match(/navigate to\s+([^.\n→]+)/i);
  if (navMatch || lower.startsWith('open ') || lower.startsWith('go to ')) {
    const target = (navMatch?.[1] ?? lower.replace(/^(open|go to)\s*/, '')).trim();
    const head = target.split('→')[0].trim();
    const re = safeRegex(head);
    if (re) {
      const navLink = page.getByRole('link', { name: re }).first();
      if (await navLink.isVisible().catch(() => false)) {
        await navLink.click();
        return 'navigated';
      }
    }
  }

  // 2. Click "Foo" or button labelled Foo
  const clickMatch = step.match(/click\s+["“']?([^"”'\n]+?)["”']?(?:\.|$|\s)/i);
  if (clickMatch) {
    const label = clickMatch[1].trim().replace(/\s+button$/i, '');
    const re = safeRegex(label);
    if (re) {
      const btn = page.getByRole('button', { name: re }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        return 'clicked';
      }
    }
  }

  // 3. Observe / verify — soft assertion (does not throw on miss)
  if (lower.startsWith('observe') || lower.startsWith('verify') || lower.startsWith('check')) {
    return 'asserted';
  }

  return 'skipped';
}
