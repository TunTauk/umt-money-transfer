# Dashboard Screen

Design reference: [`design/design.pen`](../design/design.pen), node `gkEzp`.
This document supersedes any conflicting labels in the static reference.

## Purpose

Landing page showing live financial balances. It contains no pending count,
oldest-pending warning, pending panel, or transaction status badges.

## Balance Summary

Use these exact labels and values:

| Label | Value |
|---|---|
| ပင်မဘဏ် | Independent balance of the real Main Bank account |
| ဘဏ်ခွဲများ | Sum of Bank child account balances |
| စုစုပေါင်းဘဏ် | `ပင်မဘဏ် + ဘဏ်ခွဲများ` |
| ပင်မငွေသား | Independent balance of the real Main Cash account |
| ငွေသားခွဲများ | Sum of Cash child account balances |
| စုစုပေါင်းငွေသား | `ပင်မငွေသား + ငွေသားခွဲများ` |
| စုစုပေါင်းလက်ကျန် | `စုစုပေါင်းဘဏ် + စုစုပေါင်းငွေသား` |

The grand total is primary; each category total is accompanied by its main and
child breakdown. Main balances do not include their children. Every value is
derived from posted ledger entries.

The website dashboard is Owner-only and may show recent immediately posted
activity across all accounts. It must not show status columns, status filters,
Complete actions, or pending monitoring. The separate staff mobile dashboard
shows only assigned Bank and Cash balances and counter actions.
