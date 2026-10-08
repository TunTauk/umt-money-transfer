# Internal Transfer Screen - List

Design reference: [`design/design.pen`](../design/design.pen), node `GQPgE`.

## Access

Owner only. Tellers cannot navigate to or query this screen.

## Layout

Bank and Cash tabs separate the two account types. Each row shows reference,
direction (Main to Child or Child to Main), child account, amount, creator, and
date. A note is hidden by default and expandable per row.

There is no status filter or status column. The only row actions are **Edit**
and **Delete**. Edit performs an audited reversal plus repost; Delete performs a
reversal plus soft delete. Both changes post atomically.
