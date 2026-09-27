# Cash In Screen - List

Legacy filename: `11-deposit-screen.md`. Design reference:
[`design/design.pen`](../design/design.pen), node `FNQQT`. Use **Cash In** in
the product UI.

## Purpose

Lists immediately posted Cash In records. Teller visibility is based on the
single selected assigned account, so staff sharing it see its records. Owners
see all records.

## Controls

- **New Cash In** opens the create screen.
- Search matches customer name/phone, compact ID, system reference, and note.
- Filters: date, account, amount, and Owner-only creator filter.
- There is no status filter.

## Columns

Keep the original visible columns: Reference, Customer, Phone (ဖုန်းနံပါတ်),
Destination, Fee, Created by, Date, and row actions. Do not show a status
column.

- Reference shows only the compact system-generated `CI-...` ID.
- Phone (ဖုန်းနံပါတ်) is a dedicated column after Customer showing the
  required customer phone.
- Destination shows the selected account name.
- Fee is rendered as the fee amount plus a mode pill: ဖျတ် for `DEDUCTED`, or
  the fee account type (`BANK` or `CASH`) for `SEPARATE`.
- Date shows the compact system posting date.
- A closed row uses a chevron-down. Expanding it changes to chevron-up and
  shows the separate system reference, optional note, and full system posting
  timestamp. In `SEPARATE` mode it also shows the fee account name.

Owners get **Edit** and **Delete** actions. Edit performs an audited reversal
plus corrected repost; Delete performs a reversal plus soft delete. Tellers can
create and view permitted records but cannot edit or delete them.
