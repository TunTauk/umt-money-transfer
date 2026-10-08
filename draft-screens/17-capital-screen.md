# Capital Screen - List

Design reference: [`design/design.pen`](../design/design.pen), node `vDIto`.

## Access And Layout

Owner only. Bank and Cash tabs show capital activity for the matching fixed
main account. Child accounts never appear in Capital.

Rows show reference, Deposit/Withdrawal type, fixed main account, amount,
optional expandable note, creator, and date. Transactions post immediately, so
there is no status filter, status column, or Complete action.

Owner corrections follow the common rules: Edit is audited reversal plus
repost, and Delete is reversal plus soft delete.
