# Summary Screen

Design reference: [`design/design.pen`](../design/design.pen), node
`EFe7N` ("Summary"). Uses the shared shell components `MYYNH` ("Sidebar")
and `MwM47` ("Topbar"), instanced with the "Summary" nav item active. The
"Enter today's count" action opens a separate screen (a modal) — see
[Summary Screen — Enter Count](24-summary-enter-count-screen.md).

## Purpose

Implements the **Reports** section of
[Ledger & Accounting](../spec/03-ledger-accounting.md#reports): live balances,
profit, and daily reconciliation, in one place. Distinct from
[Dashboard](10-dashboard-screen.md), which is operational ("what needs my
attention right now"); this screen is analytical ("how is the business
doing over a period, and does the ledger match reality").

## Page header

- Title "Summary", subtitle: "Profit, live balances, and daily
  reconciliation."
- Right-aligned date-range chip ("This month") — unlike the read-only
  date chip on [Dashboard](10-dashboard-screen.md#page-header), this one
  is an actual control (dropdown chevron) since the stats below it are
  period-scoped, not always "today."

## Stats row

Four cards, same visual pattern as
[Dashboard's stats row](10-dashboard-screen.md#stats-row) (label + icon
chip + bold value), with the first card highlighted (`$brand-dark`):

| Card | Value shown | Source |
|---|---|---|
| Total Balance (all accounts) | Live sum across every account | `LedgerEntry`-derived, per [Ledger & Accounting](../spec/03-ledger-accounting.md#why-double-entry) — not period-scoped, since a balance is a point-in-time fact, not a range total |
| Fee Income (this month) | Sum of `FeeIncome` credits over the selected range | Implements "**Profit** — sum of `Fee Income` credits over a date range" from the Reports spec |
| Send volume | Count of `SEND` transactions in range | Operational context alongside profit |
| Payout volume | Count of `PAYOUT` transactions in range | Operational context alongside profit |

Send/Payout volume aren't explicitly called for in the Ledger &
Accounting spec's Reports section, but support reading profit
(Fee Income) against the activity that generated it.

## Daily Reconciliation panel

Directly implements the spec's third report type:

> Admin/owner enters the actual counted cash and actual bank/wallet app
> balance for each account; system shows expected (from the ledger) vs.
> actual, and flags variance. This is a check, not a correction
> mechanism — a variance gets investigated, not silently adjusted into
> the ledger.

The panel subtitle repeats that framing verbatim ("a check, not a
correction") to keep the distinction visible to whoever's using the
screen, not just documented in the spec.

### Header
- Title + subtitle (above)
- "Enter today's count" button → opens
  [Summary Screen — Enter Count](24-summary-enter-count-screen.md)
  (`z5ZFy`) as a modal overlay, the entry point for the admin/owner's
  actual-count input.

### Table columns

| Column | Content |
|---|---|
| Account | Name |
| Expected | From the ledger (`SUM(credits) − SUM(debits)`) |
| Actual | What the admin/owner counted/entered |
| Variance | `Actual − Expected`, bold; red (`$error`) when nonzero, neutral text color when `K 0` |
| Status | Badge — **Matched** (green, check icon) or **Variance** (red, `triangle-alert` icon) |

### Example state

Four of five accounts show `Matched`; "KBZ - 09765119982" shows a
`-K 30,000` variance with the `Variance` badge — demonstrates both states
in one screenshot so the flagging behavior is visible without needing to
imagine it.

## Open questions

- Whether reconciliation is literally daily (one entry per calendar day,
  history kept) or always shows only "today's" comparison isn't decided —
  affects whether this screen needs a reconciliation history view.
- No drill-down from a "Variance" row into the underlying transactions
  for that account/period — would help "investigate" the variance per the
  spec's framing, but isn't designed.
- Date-range chip interaction (what "This month" expands to, whether it
  matches the same Today/Yesterday/This week/This month/Custom set from
  [Search & Filter](../spec/07-search-filter.md#structured-filters)) isn't
  confirmed.
