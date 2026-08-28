# Dashboard Screen

Design reference: [`design/design.pen`](../design/design.pen), node
`gkEzp` ("Dashboard"). Uses the shared shell components `MYYNH`
("Sidebar") and `MwM47` ("Topbar"), instanced with the "Dashboard" nav
item active.

## Purpose

Landing screen after login. Answers two questions at a glance: "where does
our money stand right now?" and "what needs attention today?" — live
balances plus the stale-`PENDING` monitoring view called for in
[Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#operational-implication).

## Layout

Sidebar (240px) + topbar (64px) + scrollable content area (32px padding),
stacked top to bottom:

1. Page header
2. Stats row (4 cards)
3. Account Balances panel (full width)
4. Bottom row — Pending panel + Recent Activity panel, side by side

## Page header

- Title "Dashboard", subtitle "Live balances and today's activity"
- Right-aligned date chip (calendar icon + current date) — read-only
  context, not a filter control on this screen

## Stats row

Four equal-width cards. The first two are pure balance totals; the last
two are risk-glance metrics, deliberately paired to answer "what needs a
closer look right now":

| Card | Value shown | Style |
|---|---|---|
| Total Balance | Sum across all accounts | Highlighted — `$brand-dark` fill, white text, visually dominant over the other three |
| Cash Drawer | `Account` balance, `type = CASH` | Neutral card |
| Lowest Balance | The `Account` with the smallest live balance, name + amount | Neutral card, red icon chip |
| Oldest Pending | Age of the longest-waiting `PENDING` transaction, plus its type + party | Neutral card, red icon chip |

Per-type sum cards (Bank Accounts, Wallet Accounts) were dropped — with
the full breakdown already one table down in the
[Account Balances panel](#account-balances-panel), a same-page total by
`type` didn't add a decision a teller or owner makes from the dashboard.
**Lowest Balance** and **Oldest Pending** replace them: both are early
warning signals — an account running low risks blocking the next Send
before someone notices, and an aging `PENDING` transaction is the exact
scenario the [Pending panel](#pending-panel-xudwl) below exists to catch
([Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#transitions--permissions)).
Surfacing both in the stats row means that risk is visible without
scrolling to the panels beneath.

Each card: label + small icon chip (top row), large bold value (bottom).
All balances are derived live from `LedgerEntry` rows, never a stored
column — see [Ledger & Accounting](../spec/03-ledger-accounting.md).

## Account Balances panel

Full-width table, one row per `Account`:

| Column | Content |
|---|---|
| Account | Name, e.g. "KBZ - 09765112340" |
| Type | Badge — `CASH` (indigo), `BANK` (green), `WALLET` (amber) |
| Provider | "KBZ Bank", "Wave Money", or "—" for cash |
| Status | Dot + "Active"/"Inactive" |
| Balance | Right-aligned, bold |

Header includes a "View all accounts" link through to the
[Accounts screen](19-account-management-screen.md).

## Bottom row

### Pending panel (`xuDwl`)
- Red-bordered panel (`$error` stroke) — deliberately the one panel on the
  screen with a warning border, so a stale pending transaction is visually
  impossible to miss.
- Header: "Pending — oldest first" + a count badge.
- Rows sorted oldest-first (per the spec's operational note), each showing
  customer name, type + amount, and age in red (`4h 12m` etc.).
- Directly supports the fraud control described in
  [Transactions & Lifecycle](../spec/04-transactions-lifecycle.md#transitions--permissions):
  a `PENDING` transaction with no ledger trace is only caught if someone
  looks — this panel is that "someone looks."

### Recent Activity panel (`cY2XQ`)
- Neutral-bordered panel, no "View all" link — there's no longer a
  single cross-type screen for it to point at (see below).
- Rows show name, transaction type (`SEND`, `PAYOUT`, `CAPITAL_DEPOSIT`,
  `INTERNAL_TRANSFER`), amount, and a status badge.
- Only completed activity shown here — pending items live in the Pending
  panel instead, not duplicated.

There is deliberately no unified Transactions screen in this design — a
single cross-type list duplicated filters that are better scoped per
type and risked being a second, confusing place to look for the same
data. Instead, [Send](11-send-screen.md#filter-bar),
[Payout](13-payout-screen.md#filter-bar),
[Internal Transfer](15-internal-transfer-screen.md#filter-bar), and
[Capital](17-capital-screen.md#filter-bar) each carry their own full
search + filter bar (search box, Status, Date range, Account, Created
by, Amount). This Recent Activity panel stays a small, mixed-type
glance — for anything beyond it, go to the specific type's own screen
and search there.

## Status badge colors (shared pattern)

| Status | Background | Text |
|---|---|---|
| Completed | `#EAF7EF` | `#0F6D4E` |
| Pending | `#FEF3E2` | `#B45309` |
| Cancelled | `#F1F2F1` | `#5B645C` |
| Voided | `#FCEEEC` | `#C4331F` |

## Open questions

- Real pending count vs. the "6" placeholder shown — needs to reflect an
  actual live count once wired to data.
- Whether the Pending panel should be filterable by staff member here, or
  only via each type-specific screen's "Created by" filter (admin/owner
  only, per [Search & Filter](../spec/07-search-filter.md)).
