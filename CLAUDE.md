# BeeTrade Automation Context for Claude Code

---

## Project Overview

**Project Name:** BeeTrade Web App
**Test Environment URL:** https://unstable.dev.beetrade.com
**Test Source:** `Test Case org.xlsx` (in repo root)

BeeTrade is a non-custodial trading platform. This repo automates the full QA test sheet end-to-end with Playwright and produces a structured report + bug log.

---

## Tech Stack

- Frontend under test: React / Next.js
- Backend under test: Python (FastAPI)
- Test framework: Playwright (TypeScript)
- Test data source: Excel file `Test Case org.xlsx`
- Excel parsing: `xlsx` (SheetJS) npm package

---

## Login (Test Account)

- URL: https://unstable.dev.beetrade.com
- Email: `andy.nguyen+03@beelabs.ai`
- Password: `Linh@12345`

Always reuse the `loginAsTestUser()` helper in `utils/login.ts`. Never inline login steps in spec files.

---

## Commands

```bash
# Install once
npm install
npx playwright install chromium

# Run the full sheet (all 152 test cases across 5 modules)
npx playwright test

# Run only one module (one sheet)
npx playwright test tests/trading.spec.ts
npx playwright test tests/strategy-builder.spec.ts
npx playwright test tests/bots.spec.ts
npx playwright test tests/algo-hub.spec.ts
npx playwright test tests/alert.spec.ts

# Run a single TC by ID (using grep)
npx playwright test -g "TC-T001"
npx playwright test -g "SB-005"

# Run by Feature Group
npx playwright test -g "Futures Grid Trading"

# Open report
npx playwright show-report
```

---

## Repo Architecture (target layout)

```
/tests
  trading.spec.ts             # all rows from "Trading" sheet
  strategy-builder.spec.ts    # all rows from "Strategy Builder" sheet
  bots.spec.ts                # all rows from "Bots" sheet
  algo-hub.spec.ts            # all rows from "Algo Hub" sheet
  alert.spec.ts               # all rows from "Alert" sheet

/utils
  login.ts                    # loginAsTestUser(page)
  excel.ts                    # readTestCases(sheetName) -> TestCase[]
  helpers.ts                  # waitForSelector, fillField, expectVisible, retry
  reporter.ts                 # writes report.json + appends to Bug Log

/data
  testcases.json              # cached parse of Test Case org.xlsx (regenerate with `npm run sync-tests`)

/reports
  /<YYYY-MM-DD_HHmm>/         # one folder per run, named with run timestamp (UTC+7)
    report.html               # auto-generated HTML report (Playwright)
    report.json               # machine-readable run summary
    bug-log.json              # bugs found this run
    /screenshots/             # full-page captures for failed / blocked TCs
    /traces/                  # Playwright traces for retried TCs
  /latest -> <YYYY-MM-DD_HHmm>/   # symlink to the most recent run for convenience
  bug-log-master.json         # cumulative bug log across ALL runs (append-only)

playwright.config.ts
Test Case org.xlsx            # source of truth — DO NOT edit by hand from automation
CLAUDE.md                     # this file
```

Each sheet maps to exactly one `*.spec.ts` file. Inside, use `test.describe(featureGroup)` → `test.describe(subFeature)` → `test(title)` so the report mirrors the sheet hierarchy.

---

## Test Case Source — `Test Case org.xlsx`

The Excel file contains **5 module sheets** that drive automation, plus 3 reference sheets (`Dashboard`, `Test Cases`, `Bug Log`).

### Sheets to automate (152 test cases total)

| Sheet              | TC-ID prefix | # Cases | Notes                                                  |
| ------------------ | ------------ | ------- | ------------------------------------------------------ |
| `Trading`          | `TC-T###`    | 62      | BOT, CHART, AI INDICATOR, WATCHLIST                    |
| `Strategy Builder` | `SB-###`     | 38      | AI Generation, Conditions, Order Blocks, Backtest, etc.|
| `Bots`             | `BOT-###`    | 14      | Live Tab, Activity Tab, Bot Actions                    |
| `Algo Hub`         | `AH-###`     | 16      | Browse, Search, Detail, Clone, My Published           |
| `Alert`            | `AL-###`     | 22      | AI/Manual create, If-condition logic, Notifications   |

### Column schema (every module sheet uses the same columns)

| Col | Field            | Required | Use                                              |
| --- | ---------------- | -------- | ------------------------------------------------ |
| A   | TC-ID            | yes      | Unique ID — used as Playwright test name prefix |
| B   | Feature Group    | yes      | Top-level `describe` block                       |
| C   | Sub-Feature      | yes      | Nested `describe` block                          |
| D   | Title            | yes      | The `test(...)` name                             |
| E   | Description      | yes      | Test intent (log to report)                      |
| F   | Preconditions    | yes      | Run before steps (login, brokerage, etc.)        |
| G   | Test Data        | maybe    | Pipe-separated `key: value` pairs                |
| H   | Test Steps       | yes      | Numbered steps `1. ...\n2. ...`                 |
| I   | Expected Result  | yes      | Drives the `expect(...)` assertions              |
| J   | Actual Result    | written  | Filled by the agent after each run               |
| K   | Priority         | filter   | High / Medium / Low                              |
| L   | Severity         | filter   | High / Medium / Low                              |
| M   | Environment      | yes      | Set to `DEV` for unstable.dev.beetrade.com       |
| N   | DEV              | written  | `Pass` / `Fail` / `Blocked`                      |
| O   | STG              | -        | Skip on this environment                         |
| P   | PROD             | -        | Skip on this environment                         |
| Q   | Assignee         | -        | Informational                                    |
| R-T | Sprint 1/2/3     | -        | Informational                                    |
| U   | Notes            | written  | Append bug ID or skip reason                     |

### Header / divider rows to ignore

Rows whose `TC-ID` does NOT match the regex `^(TC-T|SB-|BOT-|AH-|AL-)\d+` are section headers (e.g. `▶ BOT`, `● Futures Grid Trading`). Skip them.

---

## Parsing rules (utils/excel.ts)

```ts
import * as XLSX from 'xlsx';

export interface TestCase {
  id: string;              // TC-T001
  module: string;          // sheet name
  featureGroup: string;    // col B
  subFeature: string;      // col C
  title: string;           // col D
  description: string;
  preconditions: string;
  testData: Record<string, string>;   // parsed from "k: v | k: v"
  steps: string[];                    // split on /\n\d+\.\s*/
  expected: string;
  priority: 'High' | 'Medium' | 'Low';
}

export function readTestCases(sheetName: string): TestCase[];
```

- `testData` parsing: split on `|`, then on the first `:`. Trim everything. Lowercase the key.
- `steps` parsing: regex split on `^\d+\.\s+` (multiline). Drop empties.
- Skip rows where `TC-ID` is empty, NaN, or doesn't match the prefix regex above.

---

## Test Scope

**Run ALL valid rows from all 5 module sheets.** No TC-ID range filtering on this run.

You may filter at runtime via `--grep` (see commands above), but the default `npx playwright test` MUST cover all 152 cases.

Skip a row only when:
1. `TC-ID` doesn't match the prefix regex (header row).
2. `Preconditions` require something out of scope (e.g. real funds — see Safety Rules).
3. The row is explicitly marked `Status = Blocked` in the sheet.

When skipping, mark the test with `test.skip()` AND record the skip reason in the report.

---

## Execution Rules

1. Always log in via `utils/login.ts` in `test.beforeAll` per spec file. Reuse the auth state with Playwright `storageState` to avoid re-login on every test.
2. Run preconditions before steps. If a precondition fails, mark the TC as `Blocked` (not `Fail`) and continue.
3. Execute every numbered step in order. Do not skip. Do not invent steps.
4. After each step, wait for the relevant element/network response — never use blind `waitForTimeout` longer than 2 s except when the sheet explicitly says so.
5. Validate against `Expected Result` with explicit `expect()` assertions. Prefer:
   - `expect(locator).toBeVisible()`
   - `expect(locator).toHaveText(...)`
   - `expect(page).toHaveURL(...)`
   - `expect(response.status()).toBe(...)` for backend assertions
6. On failure: capture screenshot + video + trace, then continue to the next TC. Never abort the whole suite.
7. Do not assume UI behavior. If a selector is missing, log the TC as `Blocked - selector not found` and move on.
8. Use exact `Test Data` values from the sheet. Do not substitute "reasonable" defaults.

---

## Selector Strategy

Prefer (in order):
1. `getByRole('button', { name: 'Create Bot' })` — accessibility-first
2. `getByTestId('...')` if `data-testid` is present
3. `getByText('exact text')`
4. CSS attribute selectors `[name="email"]`
5. CSS class only as last resort — never rely on Tailwind utility classes

### Known stable selectors

```
Email input         input[name="email"]
Password input      input[name="password"]
Login submit        button[type="submit"]
Main nav: Bot       getByRole('link', { name: 'Bot Trading' })
Main nav: Strategy  getByRole('link', { name: 'Strategy Builder' })
Main nav: Algo Hub  getByRole('link', { name: 'Algo Hub' })
Main nav: Alerts    getByRole('link', { name: 'Alerts' })
Main nav: Bots      getByRole('link', { name: 'Bots' })
Create Bot button   getByRole('button', { name: 'Create Bot' })
Run button          getByRole('button', { name: 'Run' })
```

If a selector resolves to multiple elements, scope it: `page.locator('[role=dialog]').getByRole('button', { name: 'Run' })`.

---

## Reporting

After every `npx playwright test` run, write all artifacts under a date-stamped folder so previous runs are never overwritten.

### Run folder

- Format: `reports/YYYY-MM-DD_HHmm/` (timezone: Asia/Ho_Chi_Minh, UTC+7).
- Compute once at run start in `global-setup.ts` and inject as `process.env.RUN_ID`.
- Example: `reports/2026-05-08_1430/`.
- Always update `reports/latest` symlink to point at the new folder (best-effort; on Windows, copy instead).

### `reports/<runId>/report.json`
```json
{
  "runId": "2026-05-08_1430",
  "startedAt": "2026-05-08T07:30:00Z",
  "finishedAt": "2026-05-08T08:14:22Z",
  "environment": "DEV",
  "baseUrl": "https://unstable.dev.beetrade.com",
  "account": "andy.nguyen+03@beelabs.ai",
  "summary": { "total": 152, "passed": 130, "failed": 15, "blocked": 5, "skipped": 2 },
  "results": [
    {
      "id": "TC-T001",
      "module": "Trading",
      "featureGroup": "BOT",
      "subFeature": "Futures Grid Trading",
      "title": "Create Grid bot with valid default values",
      "status": "Pass",
      "attempts": 1,
      "flaky": false,
      "duration_ms": 8421,
      "actual": "Bot created. Status=Running. Grid orders placed at 10 levels.",
      "screenshot": null,
      "trace": null,
      "bugId": null
    }
  ]
}
```

`attempts` ≥ 2 with final status `Pass` ⇒ set `flaky: true`. Surface flaky count in `summary` too.

### `reports/<runId>/report.html`
Use the built-in Playwright HTML reporter — set `outputFolder` to the run folder via env var:

```ts
['html', { outputFolder: `reports/${process.env.RUN_ID}/playwright-html`, open: 'never' }]
```

---

## Bug Logging

When a TC fails, append a row to **both**:
1. `reports/<runId>/bug-log.json` — bugs from this run only.
2. `reports/bug-log-master.json` — cumulative across all runs (append-only, never rewrite).

Best-effort also append to the `Bug Log` sheet of `Test Case org.xlsx`. If the file is locked, log a warning and skip (JSON master log is the source of truth).

### Bug ID format
`BUG-<module-prefix>-<runId>-<seq>` — e.g. `BUG-T-2026-05-08_1430-001`, `BUG-SB-2026-05-08_1430-002`.

The `<runId>` segment guarantees Bug IDs never collide across runs even when the same TC fails repeatedly. `<seq>` resets per run.

### JSON schema (matches the `Bug Log` sheet columns)
```json
{
  "bugId": "BUG-T-2026-05-08_1430-001",
  "runId": "2026-05-08_1430",
  "linkedTcId": "TC-T001",
  "title": "Futures Grid bot stays in Pending after Create",
  "stepsToReproduce": "1. Bot Trading → Futures Grid\n2. Fill defaults (BTCUSDT, 50000–80000, 10 grids)\n3. Click Create Bot",
  "expected": "Bot status = Running, 10 grid orders placed",
  "actual": "Bot status = Pending after 60s, 0 orders visible",
  "severity": "High",
  "priority": "High",
  "status": "New",
  "reportedBy": "claude-code-agent",
  "dateReported": "2026-05-08",
  "dateFixed": null,
  "devPass": false,
  "stgPass": null,
  "prodPass": null,
  "environment": "DEV",
  "notes": "Screenshot: reports/2026-05-08_1430/screenshots/TC-T001-fail.png"
}
```

Always include the `runId` field so any bug can be traced back to the exact run folder that produced it.

---

## Re-run / Idempotency Rules

This suite WILL be executed multiple times against the same test account. Every run must be self-contained and must not corrupt future runs.

### 1. Run folder isolation
- All artifacts (`report.json`, `report.html`, `bug-log.json`, screenshots, traces, videos) live under `reports/<runId>/`.
- `<runId>` = `YYYY-MM-DD_HHmm` in Asia/Ho_Chi_Minh timezone, computed once in `global-setup.ts`.
- Never write to `reports/` root — only into the dated subfolder, plus the `bug-log-master.json` and `latest` symlink.
- Old run folders are kept indefinitely; no auto-cleanup. Operator can prune manually.

### 2. Excel write policy (Test Case org.xlsx)
- Never overwrite columns `DEV` / `Actual Result` / `Notes` from a previous run.
- Instead, **append** to `Notes` with the run timestamp prefix:
  `[2026-05-08_1430 DEV=Pass]` or `[2026-05-08_1430 DEV=Fail BUG-T-2026-05-08_1430-001]`.
- Sheet status columns (`DEV`/`STG`/`PROD`) reflect ONLY the latest run; full history lives in `Notes` and in the run folders.
- If the file is locked (Excel open), skip Excel write entirely and log a warning. JSON reports are authoritative.

### 3. Bug ID never collides across runs
- Bug IDs include `<runId>` segment (see Bug Logging section).
- Append to `bug-log-master.json`; never delete or rewrite existing entries.

### 4. Pre-run cleanup (in `global-setup.ts`, BEFORE tests start)
Before any test runs, perform the following on the test account:
1. **Verify session.** Load `utils/.auth/state.json`, hit `GET /api/me` (or equivalent). On 401/expired, run `loginAsTestUser` again and overwrite `state.json`.
2. **Sweep stale entities.** Delete every bot / strategy / alert whose name starts with `auto-`. These are leftovers from runs that crashed before `afterAll` could clean up.
3. **Reset transient state.** Clear watchlist entries added by automation (anything tagged `auto-`). Dismiss any persistent banners/modals.
4. **Log cleanup actions** to `reports/<runId>/pre-cleanup.log`.

### 5. Post-run cleanup (in spec `afterAll`)
- Delete every entity created in this run (prefix `auto-<TC-ID>-...`).
- This is best-effort; if it fails, the next run's pre-cleanup will catch it.

### 6. Flaky test handling
- Playwright `retries: 2` is enabled. If a test passes after a retry, mark `flaky: true` in `report.json`.
- Three consecutive flaky runs of the same TC ⇒ raise its priority in the bug log: prepend `[FLAKY-3x]` to the bug title.

### 7. Comparison across runs (optional helper)
- Provide `scripts/compare-runs.ts` that diffs two `report.json` files and prints which TCs changed status (Pass→Fail, Fail→Pass, etc.). Useful for regression detection.

---

## Safety Rules (NON-NEGOTIABLE)

- **NEVER** place a Live Trade with real funds. Always use Paper Trade or Backtest mode.
- **NEVER** confirm any "withdraw", "send to wallet", or "approve unlimited spending" prompt.
- If a TC's steps unambiguously require Live Trade with real money, mark it `Blocked - requires live funds` and skip.
- **NEVER** change the test account's password, email, 2FA, or API keys.
- **NEVER** delete bots/strategies/alerts you didn't create in this run. Tag created entities with prefix `auto-<TC-ID>-` so cleanup is safe.

### Cleanup
At the end of each spec file, remove any bots / strategies / alerts whose name starts with `auto-`. Use Playwright `test.afterAll`. Pre-run sweep in `global-setup.ts` is the safety net for crashes — see Re-run / Idempotency Rules.

---

## Conventions

- One sheet ⇒ one spec file. One row ⇒ one `test(...)` call inside the right describe block.
- Test name format: `` `${TC-ID} — ${Title}` `` (e.g. `"TC-T001 — Create Grid bot with valid default values"`). The TC-ID prefix is what `--grep` filters against.
- Reuse `loginAsTestUser()` — no duplicate login logic.
- Data-driven: drive each spec from `readTestCases('Trading')` etc. Use `for (const tc of cases) test(...)` instead of hand-written tests.
- Never hardcode URLs except `baseURL` in `playwright.config.ts`.
- Keep tests independent. No ordering dependencies between TCs.
- Timeouts: action 30 s, navigation 60 s, total per-test 120 s. Override only with a comment explaining why.

---

## playwright.config.ts (expected baseline)

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 2,
  workers: 1,
  timeout: 120_000,
  reporter: [
    ['html', { outputFolder: `reports/${process.env.RUN_ID}/playwright-html`, open: 'never' }],
    ['json', { outputFile: `reports/${process.env.RUN_ID}/test-results.json` }],
    ['list'],
  ],
  use: {
    baseURL: 'https://unstable.dev.beetrade.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 30_000,
    navigationTimeout: 60_000,
    storageState: 'utils/.auth/state.json',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
```

`utils/.auth/state.json` is produced by a one-time `global-setup.ts` that calls `loginAsTestUser` and saves storage state. Add it to `.gitignore`.

---

## Goal (this repo's contract)

1. Read `Test Case org.xlsx` and parse all 152 valid rows from the 5 module sheets.
2. Execute every test against `https://unstable.dev.beetrade.com` using `andy.nguyen+03@beelabs.ai`.
3. Validate each result against the `Expected Result` column.
4. Produce `reports/<YYYY-MM-DD_HHmm>/` containing `report.json`, `bug-log.json`, `playwright-html/`, screenshots, and traces.
5. Append failures to `reports/bug-log-master.json` (cumulative) and best-effort to the `Bug Log` sheet.
6. Each run is fully self-contained: previous run artifacts are never overwritten; pre-run cleanup handles leftover state.
7. Never execute real-money trades.

---

## When something is ambiguous

- If a step references a UI element you can't find, mark the TC `Blocked - selector not found` and capture a full-page screenshot to `reports/screenshots/`. Don't guess.
- If `Test Data` is `nan` / empty but steps need values, use the smallest valid defaults and note `Defaulted` in `Actual Result`.
- If a precondition (e.g. "Brokerage connected") isn't satisfied on the test account, mark `Blocked - precondition unmet` and continue.

---

## Continuous Execution Policy

When the user asks to "run autotest", "chạy auto-test", "execute the suite", or any equivalent — Claude Code MUST run the entire workflow end-to-end in a single session without stopping for confirmation between modules.

### Do NOT stop for any of these:
- Finishing one module (Trading, Strategy Builder, Bots, Algo Hub, Alert) — proceed straight to the next.
- Finishing one Feature Group (e.g. Grid Trading, DCA) — proceed straight to the next.
- Individual test failures — log to report and continue.
- Selector not found — mark `Blocked` and continue.
- Bug logged — append and continue.
- npm install / playwright install completion — proceed to test execution.

### ONLY stop and ask the user when:
1. Test account login fails after 2 retries (credentials wrong / account locked).
2. The base URL `https://unstable.dev.beetrade.com` is unreachable (DNS / 5xx) for >60s.
3. A precondition would require real funds (Live Trade) — mark `Blocked` and continue, do NOT prompt.
4. The Excel source file `Test Case org.xlsx` is missing or corrupt.
5. All 152 TCs have completed AND reports are written — print final summary and stop.

### Progress reporting (instead of stopping)
Print a one-line status after each module so the user sees progress live:

```
[1/5] Trading        — 62/62 done   (Pass: 55, Fail: 5, Blocked: 2)   8m 12s
[2/5] Strategy Builder — 38/38 done (Pass: 33, Fail: 3, Blocked: 2)   6m 04s
...
```

Do NOT print progress per individual TC — too noisy. Module-level only.

### Session continuity
- Run all 5 spec files in the SAME `npx playwright test` invocation. Do not split into 5 separate commands.
- If a single test hits the per-test timeout (120 s), Playwright handles it — Claude Code does not need to intervene.
- After test execution finishes, immediately write `report.json`, `bug-log.json`, update symlink, append master log, then print final summary. All in one go.

---

## Skill routing

When the user's request matches a skill, ALWAYS invoke it via the Skill tool first.

- Run / debug Playwright tests, "test the site", "find bugs" → `qa`
- "Why is this broken", error triage → `investigate`
- Code review on the agent itself → `review`
- Update docs after a change → `document-release`
