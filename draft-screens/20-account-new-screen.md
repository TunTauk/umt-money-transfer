# Account Management Screen — New

Design reference: [`design/design.pen`](../design/design.pen), node
`wwO0x` ("Add Account (Modal)"). A centered modal (460px) over a dimmed
backdrop, opened from the "Add Account" button on
[Account Management Screen — List](19-account-management-screen.md).
Previously that button had nowhere to go — this screen fills that gap.

## Purpose

Create form for an `Account` record — Cash, Bank (KBZ), or Wallet (Wave).
Admin/Owner only, per the RBAC row "Manage accounts (add/edit/deactivate
KBZ/Wave/Cash)" in [RBAC](../spec/05-rbac.md). See
[Data Model](../spec/02-data-model.md#account) for the underlying fields.

Same modal pattern as
[Internal Transfer](16-internal-transfer-new-screen.md#modal-contents) and
[Capital](18-capital-new-screen.md#modal-contents) — few enough fields
that a full page isn't warranted. The one new element this form needs
that neither of those had: a **three-way** type toggle (Cash / Bank /
Wallet) instead of a two-way one, since `Account.type` has three values,
not two.

## Modal contents

| Element | Detail |
|---|---|
| Title | "Add Account", with a close (`x`) icon |
| Account Name | Free text, e.g. "Wave - 09112445810" — matches the naming convention in [Data Model](../spec/02-data-model.md#account) |
| Type | Three-way toggle: **Cash** / **Bank** / **Wallet**, active state filled `$brand-dark` (Wallet selected in the mock) |
| Provider | Dropdown, e.g. "Wave Money" — conditional: only relevant for Bank/Wallet, `null` for Cash per the data model |
| Account Number | Free text — stored full, masked on the list per [Account Management Screen — List](19-account-management-screen.md#table-columns) |
| Active | Toggle switch (on by default) + helper text "Visible in new-transaction account pickers" — directly explains what the switch controls, since [Data Model](../spec/02-data-model.md#account) notes "deactivated accounts are hidden from new-transaction pickers but keep history" |
| Actions | Cancel / "Add Account" |

### Conditional fields (not yet wired in the mock)

The mock shows Provider and Account Number always present, but per the
data model both are `null`/not applicable for `type = CASH`. The real
form should hide (or disable) Provider and Account Number when **Cash**
is selected in the Type toggle — not represented as an interactive state
here since .pen is a static mock, but the underlying field-conditional
logic should follow the Type toggle's selection.

## Open questions

- This form is also implied to serve **Edit** (the list's `ellipsis` menu
  presumably opens the same modal pre-filled) — not yet confirmed whether
  edit and create are truly the same screen, or diverge (e.g. Type might
  be locked on edit if changing it after transactions exist would be
  confusing).
- Deactivating an account (toggling Active off on an existing account)
  probably needs a confirmation step, since per
  [Account Management Screen — List](19-account-management-screen.md#open-questions)
  it affects every screen with an account picker — this modal doesn't
  yet distinguish "flip Active off during edit" from "just fill the form
  normally."
