# Account Management Screen — List

Design reference: [`design/design.pen`](../design/design.pen), node
`QU5zW` ("Accounts - List"). Uses the shared shell components `MYYNH`
("Sidebar") and `MwM47` ("Topbar"), instanced with the "Accounts" nav
item active. The create form is a separate screen (a modal, not a full
page) — see
[Account Management Screen — New](20-account-new-screen.md).

## Purpose

Manage the `Account` records that hold money — Cash, Bank (KBZ), Wallet
(Wave), per [Overview](../spec/01-overview.md#accounts-we-hold-money-in). This is
the admin surface behind every account picker used on the Send, Payout,
Internal Transfer, and Capital screens. Referenced from
[Dashboard](10-dashboard-screen.md#account-balances-panel) via its "View
all accounts" link.

## Page header
- Title "Accounts", subtitle: "Cash, bank, and wallet accounts we hold
  money in."
- Primary button "Add Account" → opens
  [Account Management Screen — New](20-account-new-screen.md) (`wwO0x`)
  as a modal overlay, matching the
  [Internal Transfer](16-internal-transfer-new-screen.md) /
  [Capital](18-capital-new-screen.md) pattern.

No filter bar — account count is expected to stay small (a handful of
Cash/Bank/Wallet entries), so filtering isn't needed yet.

### Table columns

| Column | Content |
|---|---|
| Account Name | e.g. "KBZ - 09765112340", per the naming convention in [Data Model](../spec/02-data-model.md#account) |
| Type | Badge — `CASH` (indigo) or `BANK` (green) — same palette used on [Dashboard](10-dashboard-screen.md#account-balances-panel). Wave/mobile-wallet accounts show `BANK` too, per [Data Model](../spec/02-data-model.md#account) |
| Provider | "KBZ Bank", "Wave Money", or "—" for Cash |
| Account No. | Shown unmasked (e.g. `09765112340`) — an owner reviewing this list needs the full number to cross-check against a bank/wallet app |
| Balance | Bold, live-derived from `LedgerEntry` rows, never a stored column (see [Ledger & Accounting](../spec/03-ledger-accounting.md)) |
| Status | Dot + "Active"/"Inactive" |
| — | Row actions (`ellipsis` menu) |

### Inactive accounts

Deactivated accounts are shown at reduced opacity (0.55) rather than
hidden — matches the data model's explicit intent: "deactivated accounts
are hidden from new-transaction pickers but keep history"
([Data Model](../spec/02-data-model.md#account)). The example row ("KBZ -
09112223334 (old)") shows a `K 0` balance with an "Inactive" status dot,
still fully present in the list for historical reference.

## Open questions

- ~~Row actions~~ — resolved: explicit Edit + Deactivate/Reactivate icon
  buttons per row (no `ellipsis` menu — two actions is few enough to show
  directly). Deactivate still needs a confirmation state before
  implementation, since it affects every screen with an account picker.
- ~~Unmasking the account number~~ — resolved: shown unmasked, since this
  screen is Admin/Owner-only and they need the full number to cross-check
  against a bank/wallet app.
