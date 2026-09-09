# Search & Filter (Transaction List)

## Free-text search

A single search box, not separate fields per attribute — staff usually
don't know in advance whether they're about to type a name or a phone
number, they just want to find "that transaction." Matches with OR logic
across:

- Recipient name
- Recipient phone
- `external_reference_no`
- `note`
- Internal `reference_no` / transaction ID

## Structured filters

Combine with each other and with the search box using AND logic.

| Filter | Values | Notes |
|---|---|---|
| Date range | Today, Yesterday, This week, This month, Custom range | |
| Type | multi-select: Cash In, Cash Out, Internal Transfer, Capital Deposit, Capital Withdrawal | |
| Status | multi-select: Pending, Completed, Cancelled, Voided | |
| Account / provider | multi-select over `Account` | matches transactions where the account is source or destination |
| Created by (staff) | single/multi-select over `User` | **Admin/Owner only** — also the mechanism for reviewing a specific teller's activity (see the pending-transaction monitoring note in [Transactions & Lifecycle](04-transactions-lifecycle.md)) |
| Amount range | min / max | |

## Sort

- Newest first (default)
- Amount, high → low

## Implementation notes

- **Phone number normalization**: Myanmar numbers are typed inconsistently
  (`09xxxxxxxxx`, `9xxxxxxxxx`, `+959xxxxxxxx`, with/without dashes or
  spaces). Normalize to one canonical format on save so a search using any
  common format still finds the record.
- **Search backend**: plain MySQL `LIKE` using the database's case-insensitive
  collation across the relevant columns is sufficient at this transaction
  volume (single shop). A dedicated search engine (Elasticsearch/Algolia)
  would be over-engineering here. If fuzzy name matching becomes necessary
  later, evaluate a MySQL `FULLTEXT` index first.
- **Pagination**: standard offset/cursor pagination on the filtered query;
  revisit if list sizes ever demand infinite scroll.

## OPEN

- **CSV/Excel export** of the filtered result set was proposed (useful for
  handing records to an accountant or for bookkeeping) but not yet
  confirmed. Cheap to add once the filter query exists — serialize the same
  result set. Confirm before/at implementation time.
