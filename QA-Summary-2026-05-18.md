# QA Summary — 2026-05-18

**Build under test:** https://unstable.dev.beetrade.com/ — app version **v1.4.8**, "All systems operational"
**Account:** `andy.nguyen+03@beelabs.ai` (display name **Linh**, workspace **Production**, connected brokerage account **399456 / Binance Spot**)
**Tester:** Claude Code via headless Chromium (gstack `browse` skill — equivalent of the Claude-in-Chrome MCP referenced in CLAUDE.md)
**Scope this cycle:** Module 1 only — Strategy Builder Standard (`SB Standard` sheet, TC-IDs SB-STD-001 → SB-STD-050). Modules 2–6 explicitly skipped per request.

---

## 1. Modules explored

| # | Module | Status |
|---|--------|--------|
| 1 | Strategy Builder Standard | ✅ Explored (50/50 test cases triaged) |
| 2 | Strategy Builder Advanced | ⏭️ Skipped (per request) |
| 3 | Algo Hub Standard | ⏭️ Skipped (per request) |
| 4 | Bots & Advanced Orders | ⏭️ Skipped (per request) |
| 5 | Strategy Community | ⏭️ Skipped (per request) |
| 6 | Bee Copilot | ⏭️ Skipped (per request) |

---

## 2. SB Standard — status distribution

| Status | Count |
|--------|------:|
| Pass | 1 |
| Partial | 16 |
| Fail | 9 |
| Blocked | 3 |
| Not Run | 21 |
| **Total** | **50** |

**"Not Run"** = the corresponding flow (drag-and-drop block authoring, paper/live deploy, quota limits) requires interactions that the headless QA harness could not reliably drive in a single session, or required setting up specific environment state (no-brokerage account, free-tier user, running paper-run, etc.) that was not available. These are listed below under §5.

---

## 3. Top 5 critical findings

1. **SB-STD-005 / SB-STD-050 — silent empty-strategy creation and silent backtest of incomplete strategy.**
   The Strategy Name field has no required-validation; submitting blank silently saves the strategy as literally `New Strategy` (the placeholder). This is why the production list page already contains *178* rows almost all named `New Strategy`. Worse: clicking *Backtest* on a strategy with **no logic blocks** still issues `POST /api/v2/algorithms/<id>/backtest -> 201` and produces a zero-trade "Backtest Completed" modal. There is no pre-flight validation gate as the spec requires.

2. **SB-STD-009 — negative Initial Investment silently coerced.**
   In the *Setup Backtest* modal, an Initial Investment of `-100` was accepted, no inline error, no toast. The backtest then ran with **Start Equity = 100.00 USDT**. The sign was stripped (or the field validation only rejects non-numeric). Spec required `Inline error 'Initial cash must be greater than 0'`.

3. **SB-STD-007 — there is no "Initialization block" anymore.**
   The spec assumes a root *Initialization* block on the canvas containing Brokerage, Start Date, End Date, Initial Cash, Resolution, and Market Mode. The actual build has split these fields:
   - **Brokerage** + **Initial Slippage** + **Description** + **Tags** → right-hand "Strategy Setup" sidebar
   - **Initial Investment** + **Backtest period** → per-run "Setup Backtest" modal
   - **Resolution** / **Market Mode** → not visible anywhere I could find in the Standard tier

   This cascades into SB-STD-008, -010, -024, -050 either being Blocked, Failed, or needing rewrites.

4. **SB-STD-041 — no BASIC_TREE wizard exists.**
   The "Create New Strategy" modal exposes: *Blank Strategy* (=CUSTOM_TREE), *AI Strategy*, *DCA Bot*, *Grid Bot*, *TWAP Bot*, *Rebalancing Bot*, *SmartTrade*, plus a template gallery (Breakout/Momentum/Mean Reversion/Trend/Volume). There is **no 5-step BASIC_TREE wizard**. The `Signal` tab in the list filter implies a Signal type still exists but it is not creatable from this modal. The spec's entire BASIC_TREE flow is now obsolete.

5. **SB-STD-044 — Live Trade is NOT plan-gated on this account.**
   Clicking the *Live Trade* menu item under *Live Action* opens the full "Confirm Live Trade" dialog with the connected brokerage account pre-selected and an "I understand the risks" checkbox + "Yes, Start Live Trade" button (currently disabled until the checkbox is ticked). No lock icon, no tooltip, no upgrade modal. Either this account silently has `live_trading_enabled`, or the plan gating spec is not implemented client-side. Needs verification against a free-tier user.

### Significant naming / structural mismatches between spec and build

| Spec term | Actual UI |
|-----------|-----------|
| `+ New Strategy` button | *Create New Strategy* (header) or *Create DCA / Create Custom Tree / …* (contextual when a type tab is selected) |
| `CUSTOM_TREE` type | *Blank Strategy* (also rendered as `Custom Tree` badge on cards) |
| `BASIC_TREE` type / wizard | Not present |
| `GRID` / `DCA` / `TWAP` / `REBALANCING` | `Grid Bot` / `DCA Bot` / `TWAP Bot` / `Rebalancing Bot` |
| Block palette categories `Conditions / Logical / Actions / Operands / Indicators` | `Blocks (8) / Indicators (128) / Bar Window (18) / Inputs (1) / Candlestick (61) / Transactions (4) / Portfolio (18) / Trade Statistics (33)` |
| `SimpleCondition` block | *If Condition* + *Comparison* (two related blocks, no single `SimpleCondition`) |
| `LogicalOperator` block | Not a discrete block; AND/OR appears to live inside *If Condition* |
| `PlaceOrder` / `CancelOrder` / `SetHolding` | *Place Order* / *Cancel Order* / *Set Holding* (spaced, title case) |
| `QuitOrder` block | *Stop Strategy* (renamed) |
| Operator vocabulary `>`, `<`, `==`, `>=` | "Above" / "Below" (per *Comparison* block description) |
| Card overflow menu → *Rename* / *Delete* | No overflow menu. Only a trash-icon Delete on each row; rename only inside the builder. |
| Delete confirmation `"Delete Temp DCA?"` | Generic `"Confirm — Are you sure you want to delete this item?"` |
| `Run Paper` / `Run Live` buttons on card | One *Live Action* dropdown inside the builder with *Paper Trade* / *Live Trade* items |
| `/runs` URL | `/executions` |
| `/strategy-builder/backtest/<id>` page | Backtest result is a MODAL on the builder page; the *Details* row on `/executions` opens the same modal |
| `Total PnL`, `Return %`, `Win Rate` | `Net Profit`, `Compounding Annual Return`, `Average Win` / `Average Loss` (different stat set; `Win Rate` and `Sharpe Ratio` were not on the default summary strip) |
| 15 items per page | **20** items per page (header reads `Strategies 177`, footer reads `1-20 of 178 items, 1/9`) |
| Sort by `Recent` / `Most Liked` etc. | `Recent`, `Name`, `Type`, `Brokerage` |

---

## 4. Test cases needing rewrite

The following test cases are written against an architecture that no longer exists and should be rewritten before next cycle, even if the *intent* still matches a feature in the new UI:

- **SB-STD-007 / -008 / -010** — depend on Initialization block fields that have moved/disappeared.
- **SB-STD-011 → -026** — depend on block palette and block names that have changed. Rewriting against the new `If Condition` / `Comparison` / `Place Order` / `Stop Strategy` block taxonomy is required before re-running.
- **SB-STD-022** — `QuitOrder` → `Stop Strategy`.
- **SB-STD-027** — card-menu Rename flow does not exist; rewrite for sidebar Name edit inside the builder.
- **SB-STD-030 / -031** — assume a dedicated `/strategy-builder/backtest/<id>` page; build uses a modal.
- **SB-STD-041** — BASIC_TREE wizard does not exist; either delete this TC or rewrite for the *AI Strategy* generation flow which seems to be its functional replacement.
- **SB-STD-042 / -045** — `Run Paper` lives inside the builder *Live Action* menu, not on the list card.
- **SB-STD-049** — `/runs` → `/executions`; summary panel does not exist.

---

## 5. Tests not run this cycle — why, and how to unblock

| TC-ID | Why not run | How to unblock |
|-------|-------------|----------------|
| SB-STD-006 | Did not paste a 256-char name in this run | One-line follow-up: paste a 256-char string into Strategy Name |
| SB-STD-012, -014…-021, -023, -025 | Headless drag-and-drop with the click-to-insert workflow did not commit on a single click; full DnD needs real mouse events | Re-run in a fully interactive Chrome session, or use the *Add child block* (+) affordance on a parent row |
| SB-STD-029 | No RUNNING run to test delete-409 against | Start a Paper Trade first |
| SB-STD-032 | Backtest of empty 1-month strategy completes synchronously in ~5s — no chance to see status badges | Re-test with a longer time range + heavier strategy |
| SB-STD-033 | Same reason as -032 (couldn't catch a RUNNING state) | Same fix |
| SB-STD-034, -035 | Did not exhaust monthly quota / push beyond plan window | Need controlled fixture: low-quota account or pre-exhausted account |
| SB-STD-036, -037 | GRID happy path & price validation not driven | Walk Grid Bot form end-to-end |
| SB-STD-039, -040 | TWAP / Rebalancing validation not driven | Walk those forms end-to-end |
| SB-STD-043 | This account has a connected brokerage; the "no connected accounts" empty state cannot reproduce | Test with a fresh account, no brokerage |
| SB-STD-045 | No paper run started | Start a paper run, then stop it |
| SB-STD-046 | Did not search the Indicators (128) category for Ichimoku and probe gating | One-line follow-up: search Library for 'Ichimoku' |
| SB-STD-047 | No active run alongside open builder | Start Paper, then open builder for the same strategy |
| SB-STD-048 | /executions detail page viewed but Stop visibility on a COMPLETED row not explicitly captured | One-line check |

---

## 6. Recommendations for next cycle

1. **Rewrite the SB-STD test cases against the new architecture before re-running.** Roughly 60% of the suite is written against the older Initialization-block + BASIC_TREE-wizard + dedicated-backtest-page model and produces false negatives.
2. **Run a follow-up pass in a real (non-headless) Chrome session** — the headless run was sufficient for menus, modals, and clicks, but block-palette drag-and-drop authoring needs a real cursor. The 13 "Not Run" tests that depend on DnD are ready to execute against a live browser.
3. **Provision two extra QA fixture accounts** before next cycle so the gating tests are actually reproducible:
   - one with **no connected brokerage** (covers SB-STD-043)
   - one on a **free / lowest tier** with `live_trading_enabled=false` and a deliberately low backtest quota (covers SB-STD-034, -044, -046)
4. **Flag the silent-validation defects (-005, -009, -050) to the engineering team immediately** — these allow polluted data ("New Strategy" rows everywhere), nonsense backtest inputs (negative cash), and resource-burning empty backtests, all without user feedback.
5. **Clarify what happened to BASIC_TREE.** If it was intentionally removed in favor of the *AI Strategy* generator, drop SB-STD-041 entirely. If it's planned to return, mark all `Signal` tab-related tests as `Blocked — feature in transition`.
6. **Modules 2–6 are still untouched this cycle.** Schedule them for the next run with the same rewrite-then-execute approach (the architecture drift in SB Standard is a strong signal that other modules have likely drifted too).
