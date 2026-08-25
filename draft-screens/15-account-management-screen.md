# Account Management Screen

Design reference: [`design/design.pen`](../design/design.pen), node
`QU5zW` ("Accounts - List"). Uses the shared shell components `MYYNH`
("Sidebar") and `MwM47` ("Topbar"), instanced with the "Accounts" nav
item active.

## Purpose

Manage the `Account` records that hold money — Cash, Bank (KBZ), Wallet
(Wave), per [Overview](01-overview.md#accounts-we-hold-money-in). This is
the admin surface behind every account picker used on the Send, Payout,
Internal Transfer, and Capital screens. Referenced from
[Dashboard](10-dashboard-screen.md#account-balances-panel) via its "View
all accounts" link.

## List view (`QU5zW`)

### Page header
- Title "Accounts", subtitle: "Cash, bank, and wallet accounts we hold
  money in."
- Primary button "Add Account" — no create/edit form has been designed
  yet (see Open Questions).

No filter bar — account count is expected to stay small (a handful of
Cash/Bank/Wallet entries), so filtering isn't needed yet.

### Table columns

| Column | Content |
|---|---|
| Account Name | e.g. "KBZ - 09765112340", per the naming convention in [Data Model](02-data-model.md#account) |
| Type | Badge — `CASH` (indigo), `BANK` (green), `WALLET` (amber) — same palette used on [Dashboard](10-dashboard-screen.md#account-balances-panel) |
| Provider | "KBZ Bank", "Wave Money", or "—" for Cash |
| Account No. | Masked (`•••• 2340`) — per [Data Model](02-data-model.md#account): "masked in UI where sensible" |
| Balance | Bold, live-derived from `LedgerEntry` rows, never a stored column (see [Ledger & Accounting](03-ledger-accounting.md)) |
| Status | Dot + "Active"/"Inactive" |
| — | Row actions (`ellipsis` menu) |

### Inactive accounts

Deactivated accounts are shown at reduced opacity (0.55) rather than
hidden — matches the data model's explicit intent: "deactivated accounts
are hidden from new-transaction pickers but keep history"
([Data Model](02-data-model.md#account)). The example row ("KBZ -
09112223334 (old)") shows a `K 0` balance with an "Inactive" status dot,
still fully present in the list for historical reference.

## Open questions

- **No Add/Edit Account form designed yet.** Based on the `Account`
  fields in [Data Model](02-data-model.md#account), it would need: Name,
  Type (Cash/Bank/Wallet), Provider (conditional — hidden for Cash),
  Account Number, and an Active toggle. Likely a modal, matching the
  [Internal Transfer](13-internal-transfer-screen.md#create--new-internal-transfer-ywnbw)
  pattern given how few fields are involved.
- Row actions (`ellipsis` menu) aren't specified — presumably Edit and
  Deactivate/Reactivate, but Deactivate needs a confirmation state since
  it affects every screen with an account picker.
- Whether unmasking the full account number (for an owner double-checking
  a transfer) belongs on this screen or only on the underlying bank/wallet
  app isn't decided — currently always shown masked.
