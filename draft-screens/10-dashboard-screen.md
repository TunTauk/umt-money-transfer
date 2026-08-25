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

Four equal-width cards:

| Card | Value shown | Style |
|---|---|---|
| Total Balance | Sum across all accounts | Highlighted — `$brand-dark` fill, white text, visually dominant over the other three |
| Cash Drawer | `Account` balance, `type = CASH` | Neutral card |
| Bank Accounts | Sum of `type = BANK` accounts | Neutral card |
| Wallet Accounts | Sum of `type = WALLET` accounts | Neutral card |

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
[Accounts screen](11-account-management-screen.md) (if/when that spec is
written).

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
- Neutral-bordered panel, "View all" link through to the
  [Transactions screen](12-transactions-screen.md).
- Rows show name, transaction type (`SEND`, `PAYOUT`, `CAPITAL_DEPOSIT`,
  `INTERNAL_TRANSFER`), amount, and a status badge.
- Only completed activity shown here — pending items live in the Pending
  panel instead, not duplicated.

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
  only via the full Transactions screen's "Created by" filter
  (admin/owner only, per [Search & Filter](../spec/07-search-filter.md)).
