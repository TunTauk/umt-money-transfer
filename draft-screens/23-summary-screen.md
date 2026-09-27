# Summary Screen

Design reference: [`design/design.pen`](../design/design.pen), node `EFe7N`.

## Access

Owner-only website reconciliation. Tellers cannot navigate to or query this
screen. The mobile Profile may show scoped Cash In/Out counts, fee totals, and
assigned balances, but that operational snapshot is not this reconciliation
screen.

## Content

Summary reports preserve the account hierarchy and never merge main balances
with child totals. At minimum show:

- Main Bank balance
- Child Bank total, with per-child drill-down
- Main Cash balance
- Child Cash total, with per-child drill-down
- Fee income for the selected date range
- Cash In and Cash Out volume for the selected date range

Daily reconciliation compares each real main and child account's ledger balance
with an Owner-entered actual count. A variance is a review signal and never
silently changes the ledger. Reports contain no pending monitoring or
user-facing transaction status filters.
