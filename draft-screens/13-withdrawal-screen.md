# Cash Out Screen - List

Legacy filename: `13-withdrawal-screen.md`. Design reference:
[`design/design.pen`](../design/design.pen), node `Lro1Y`. Use **Cash Out** in
the product UI.

## Purpose

Lists immediately posted Cash Out records. Teller visibility is based on the
single selected assigned account, including records created by another staff
member on that shared account. Owners see all records.

## Controls And Columns

Search matches customer name/phone, compact ID, system reference, and note.
Filters are date, account, amount, and Owner-only creator.
There is no status filter.

Keep the original visible columns: Reference, Customer, Phone (ဖုန်းနံပါတ်),
Source, Fee, Created by, Date, and row actions. There is no status column or
Complete action.

- Reference shows only the compact system-generated `CO-...` ID.
- Phone (ဖုန်းနံပါတ်) is a dedicated column after Customer showing the
  required customer phone.
- Source shows the selected account name.
- Fee is rendered as the fee amount plus a mode pill: ဖျတ် for `DEDUCTED`, or
  the fee account type (`BANK` or `CASH`) for `SEPARATE`.
- Date shows the compact system posting date.
- A closed row uses a chevron-down. Expanding it changes to chevron-up and
  shows the separate system reference, optional note, and full system posting
  timestamp. In `SEPARATE` mode it also shows the fee account name.

Owners get **Edit** and **Delete**. Edit is audited reversal plus repost; Delete
is reversal plus soft delete. Tellers cannot edit or delete.
