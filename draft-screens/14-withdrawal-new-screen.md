# Cash Out Screen - New

Legacy filename: `14-withdrawal-new-screen.md`. Design reference:
[`design/design.pen`](../design/design.pen), node `CfAa1`.

## Purpose

Creates and immediately posts a Cash Out record.

## Fields

| Field | Rule |
|---|---|
| Customer name | Manual |
| Customer phone | Required; normalized for search |
| Account type | Required `BANK` or `CASH` choice |
| Account | Owner selects one active matching main/child account; Teller sees the matching assigned child account read-only |
| Amount | One positive MMK amount; the actual transfer value |
| Fee mode | Required radio: ပမာဏမှ ဖျတ်မည် (`DEDUCTED`) or သီးသန့်ပေးမည် (`SEPARATE`) |
| Fee | Non-negative amount |
| Fee account type | `BANK` or `CASH`; shown only for `SEPARATE` |
| Fee account | Shown only for `SEPARATE`; Owner picks one active account of the chosen type; Teller sees the assigned account of that type read-only |
| Note | Optional manual text |

The fee account is required only when the mode is `SEPARATE` and the fee is
greater than zero; the server forces a Teller's fee account to the assigned
account of that type. The form has no external reference, manual date/time, or
separate Bank/Cash amounts. The system generates the compact `CO-...` ID,
separate reference, and posting timestamp.

There is no screenshot/dropzone, OCR state, verification checkbox, duplicate
OCR warning, pending/cancel form button, or Complete step. The single financial
submit action is **Create**. Creation and ledger posting are atomic.
