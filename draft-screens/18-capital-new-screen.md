# Capital Deposit / Withdrawal Screen — New

Design reference: [`design/design.pen`](../design/design.pen), node
`yaGax` ("Capital - New (Modal)"). A centered modal (460px) over a
dimmed backdrop, opened from the "New Entry" button on
[Capital Deposit / Withdrawal Screen — List](17-capital-screen.md).
Previously that button had nowhere to go — this screen fills that gap.

## Purpose

Create form for a capital deposit or withdrawal — owner injecting or
pulling capital from an account or the cash drawer. Admin/Owner only. See
[Overview](../spec/01-overview.md#capital-deposit--withdrawal) and the
double-entry example in
[Ledger & Accounting](../spec/03-ledger-accounting.md#capital-deposit).

Adapted directly from the
[Internal Transfer modal](16-internal-transfer-new-screen.md#modal-contents)
— structurally the closest existing pattern (single account picker +
amount, admin-only, no fee). The one substantive change: Internal
Transfer's From/To account pair + swap control is replaced here with a
single **Account** field plus a **Deposit / Withdrawal** toggle, since a
capital entry only ever touches one account, not two. The toggle itself
reuses the visual pattern of the Provider toggle on the
[Payout form](14-payout-new-screen.md#1-provider--screenshot) — two
equal-width buttons, active state filled `$brand-dark`.

## Modal contents

| Element | Detail |
|---|---|
| Title | "New Capital Entry", with a close (`x`) icon |
| Type toggle | **Deposit** (`arrow-down-left`, active/filled by default) / **Withdrawal** (`arrow-up-right`, outlined) |
| Account | Dropdown over active `Account` records |
| Amount (MMK) | Single amount field |
| Note (optional) | Free text |
| Actions | Cancel / "Save Entry" |

No summary/total card, same reasoning as
[Internal Transfer](16-internal-transfer-new-screen.md#modal-contents) —
a single amount with no fee leaves nothing to compute before submit.

## Open questions

- Same `PENDING` vs. same-step-`COMPLETED` question as raised for
  [Internal Transfer](16-internal-transfer-new-screen.md#open-questions)
  — worth deciding once, since the answer likely applies to both types.
- No detail/edit view designed yet, same gap noted across every
  transaction-type screen.
