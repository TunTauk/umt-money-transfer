# Summary Screen - Enter Count

Design reference: [`design/design.pen`](../design/design.pen), node `z5ZFy`.

## Access And Purpose

Owner only. This form records actual balances for reconciliation without
posting ledger entries.

Rows are grouped into Bank and Cash, with the matching main account first and
children below. Every real account has its own expected ledger balance and
actual-count input; a main expected balance excludes its children. The screen
shows live variance as `Actual - Expected`.

**Save Count** stores the reconciliation snapshot. It does not create, complete,
cancel, edit, or reverse a financial transaction.
