# Summary Screen — Enter Count

Design reference: [`design/design.pen`](../design/design.pen), node
`z5ZFy` ("Enter Today's Count (Modal)"). A centered modal (560px) over a
dimmed backdrop, opened from the "Enter today's count" button on
[Summary Screen](23-summary-screen.md#daily-reconciliation-panel).
Previously that button had nowhere to go — this screen fills that gap.

## Purpose

The manual data-entry step behind Daily Reconciliation: the admin/owner
counts the physical cash drawer and checks each bank/wallet app, then
enters what they actually find here. See
[Ledger & Accounting](../spec/03-ledger-accounting.md#reports) for the
underlying report definition — "this is a check, not a correction
mechanism." Entering numbers here never touches the ledger; it only
populates the **Actual** column and lets the system compute variance
against **Expected**.

Wider than the other entity-create modals (560px vs. 460px) because it
needs a row per account rather than a handful of unrelated fields — more
of a small table-with-inputs than a form.

## Modal contents

| Element | Detail |
|---|---|
| Title | "Enter Today's Count", subtitle showing the date (e.g. "Mon, 24 Aug 2026") so it's unambiguous which day's count this is |
| Info banner | "Count physical cash and check each bank/wallet app, then enter what you actually find. This won't change the ledger — it only flags variance for review." — states the "check, not correction" framing at the point of entry, not just on the results screen |
| Column headers | ACCOUNT / EXPECTED / ACTUAL COUNT |
| One row per account | Account name (read-only) + Expected balance (read-only, muted `$text-tertiary`) + an editable **Actual Count** input, pre-filled with the expected value as a starting point (the teller adjusts it if the real count differs, rather than typing every digit from scratch) |
| Actions | Cancel / "Save Count" |

## Live variance feedback

The "KBZ - 09765119982" row demonstrates what a mismatch looks like
*while entering*, not just after saving: its Actual Count input gets a
red (`$error`) border, and a small warning line appears beneath it —
"-K 30,000 vs. expected" with a `triangle-alert` icon. This mirrors the
same row's `Variance` badge on the
[Summary screen's reconciliation table](23-summary-screen.md#table-columns)
once saved, so the admin/owner sees the flag forming as they type rather
than only discovering it after submitting.

## Open questions

- Whether reconciliation is literally daily (one entry per calendar day,
  with history kept) affects this modal too — if a count already exists
  for today, does re-opening this modal edit it, or does "Enter today's
  count" become disabled/hidden once submitted? Same open question as
  [Summary Screen](23-summary-screen.md#open-questions).
- No way to add a note explaining a variance (e.g. "counted twice, still
  short K30,000 — investigating") — worth considering given the spec's
  framing that a variance "gets investigated," which usually produces
  some record of what was found.
- Whether all accounts must be filled before "Save Count" is enabled, or
  partial counts (e.g. cash only, banks checked later) are allowed.
