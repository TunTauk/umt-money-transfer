# UMT Money Transfer Web Testing Report

| Report Information | Details |
|---|---|
| Prepared for | [Leader name] |
| Tested by | [Your name] |
| Testing date / period | [Date] |
| Environment / URL | [Development or staging URL] |
| Version / build | [Version or commit] |
| Browser / device | [Browser, version, desktop/mobile] |
| Report status | Draft: test results and evidence to be completed |

## Executive Summary

This report documents testing coverage for 16 UMT Web functional areas and nine findings reported by the tester. It focuses on authentication, account and staff management, financial correctness, validation, reporting, and navigation.

The nine findings include four reported UI bugs, one validation bug, two improvement requests, one assignment requirement change, and one possible Reset bug requiring clarification. Suggested priorities are one High, four Medium, and four Low.

Test execution totals and pass/fail outcomes were not supplied. The checks and expected outcomes below are coverage criteria, not evidence that every test passed. Findings are tester-reported and have not been independently reproduced for this report.

Recommended focus: confirm insufficient-balance and assignment requirements; address phone validation and message styling; clarify Reset behavior and attach screenshots for layout issues.

## Testing Objective

Verify accurate balances and fee income, appropriate input validation and permissions, correct reversal behavior after editing/deletion, and reliable desktop/mobile navigation.

**Result options:** Pass / Passed with issues / Fail / Blocked / Not tested.

## Testing Coverage

### 1. Sign In

- Sign in with valid active Owner credentials.
- Try an incorrect email or password; submit empty or invalid credentials.
- Check the password visibility toggle and disabled submit button while signing in.
- Confirm disabled users cannot sign in and Teller credentials are rejected by website login.
- Confirm successful sign-in redirects to Dashboard.
- Sign out and verify protected pages require login again.

**Expected outcome:** Only active Owners can sign in through the website. Invalid attempts display an appropriate error without granting access.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 2. Dashboard

- Confirm the signed-in user name appears correctly.
- Compare Bank and Cash balances with the corresponding accounts; verify the grand total equals all real-account balances.
- Check recent activity: type, reference, account, amount, and date/time.
- Create transactions and confirm balances update; Internal Transfer must not change the grand total.
- Edit or delete transactions and verify corrected balances; deleted transactions must disappear from recent activity.
- Check desktop and mobile display.

**Expected outcome:** Dashboard accurately reflects current ledger balances and recent posted activity.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 3. Account Management

- Open Bank and Cash tabs and create child accounts with valid code, name, and provider where required.
- Confirm Bank child accounts require a provider; test missing fields and duplicate account codes.
- Check balances, status, and assigned staff.
- Activate and deactivate an unassigned child account.
- Confirm assigned child accounts and main accounts cannot be deactivated.
- Confirm inactive accounts are unavailable for new transactions.

**Expected outcome:** Valid child accounts can be created and managed. Duplicate codes and invalid changes are rejected.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 4. Staff Management

- Create a Teller with valid name, email, and initial password.
- Test empty fields, invalid email, duplicate email, and passwords shorter than eight characters.
- Confirm the new user has the Teller role and active status.
- Check name, email, role, status, and assignments.
- Deactivate and reactivate a Teller; confirm deactivation invalidates existing sessions.
- Confirm Owner accounts do not have Teller activation/deactivation controls.

**Expected outcome:** Owners can provision and manage Tellers. Invalid or duplicate staff details are rejected.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 5. Account Assignment

- Assign one active Bank child and one active Cash child to an active Teller.
- Confirm main and inactive accounts cannot be selected; verify the current form requires both account types.
- Check assignments appear in account and staff lists.
- Reassign a Teller and confirm old assignments are replaced.
- Assign two Tellers to the same child account; attempt to assign a third.
- Confirm failed assignment does not partially update either account assignment.

**Expected outcome:** Under the current rule, each assigned Teller has one Bank and one Cash account; each child account supports at most two staff assignments.

**Current behavior / note:** Disabled Tellers retain assignments and occupy capacity. Bank-only or Cash-only assignment is a requested requirement change (UMT-003).

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 6. Cash In

- Create Cash In using Bank and Cash accounts; verify customer, phone, amount, fee, account, and note.
- Test zero fee, Deducted fee, and Separate fee.
- Test separate fee collection into the same account and a different account.
- Confirm the transaction posts immediately and appears once.
- Verify balances and fee income; invalid data must cause no financial changes.
- Test rapid double submission.

**Expected outcome:** Cash In posts once and produces the balance effects below.

Example: amount 100,000 MMK; fee 2,000 MMK (except zero-fee case).

| Fee Mode | Selected Account Effect (MMK) | Fee Income |
|---|---|---|
| Zero fee | -100,000 | No change |
| Deducted | -100,000 | +2,000 |
| Separate: different account | -100,000; fee account +2,000 | +2,000 |
| Separate: same account | Net -98,000 | +2,000 |

**Current behavior / note:** Cash In decreases the selected account balance. Insufficient funds are not currently rejected.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 7. Cash Out

- Create Cash Out using Bank and Cash accounts; verify customer, account, amount, fee, and note.
- Test zero fee, Deducted fee, and Separate fee.
- Test same-account and different-account fee collection.
- Confirm the transaction posts immediately and appears once.
- Verify balances and fee income; invalid submissions must leave balances unchanged.
- Test rapid double submission.

**Expected outcome:** Cash Out posts once and produces the balance effects below.

Example: amount 100,000 MMK; fee 2,000 MMK (except zero-fee case).

| Fee Mode | Selected Account Effect (MMK) | Fee Income |
|---|---|---|
| Zero fee | +100,000 | No change |
| Deducted | +102,000 | +2,000 |
| Separate: different account | +100,000; fee account +2,000 | +2,000 |
| Separate: same account | +102,000 | +2,000 |

**Current behavior / note:** Cash Out increases the selected account balance.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 8. Fee Payment

- Test zero fee, positive Deducted fee, and positive Separate fee.
- Confirm positive Separate fees require a fee account; test Bank and Cash fee accounts.
- Verify fee income increases by the correct amount.
- Reject negative, decimal, and nonnumeric fees.
- Edit a fee and verify corrected fee income.
- Delete a transaction and confirm its fee effects are reversed.

**Expected outcome:** Fees are recognized once according to the selected mode. Editing and deletion correctly adjust fee effects.

**Current behavior / note:** There is no standalone Fee Payment page. Fees are tested within Cash In/Cash Out. Separate does not mean unpaid; no later fee-payment workflow exists.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 9. Transaction Validation

- Submit missing required fields, a spaces-only customer name, and an empty or letters-only phone.
- Test zero, negative, decimal, and nonnumeric amounts; test invalid fees.
- Submit without a required account; attempt inactive or wrong-type accounts.
- Check validation messages are understandable.
- Confirm failed creation or editing does not create partial financial records.

**Expected outcome:** Invalid transactions are rejected without changing balances or fee income.

**Current behavior / note:** Very short phone numbers, fees greater than the amount, and negative balances can currently be accepted. Review against business requirements.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 10. Transaction Search

- Search Cash In/Cash Out by reference, customer name, phone, and note.
- Filter by settlement account, minimum/maximum amount, and From/To dates including boundaries.
- As Owner, filter by creator; combine multiple filters.
- Search for nonexistent data and reset filters.
- Confirm deleted transactions are excluded.

**Expected outcome:** Results match selected criteria; resetting restores the normal list.

**Current behavior / note:** Lists show up to 100 results without pagination. Account filtering uses the settlement account, not the separate fee account.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 11. Transaction Editing

- Open Edit and confirm existing values are prefilled.
- Change customer details or note without changing balances.
- Change amount, fee, settlement account, fee account, or fee mode; verify old effects are reversed and corrected effects applied.
- For Internal Transfer, change direction or child account; for Capital, change movement or amount.
- Confirm references remain unchanged and invalid edits leave the original transaction intact.
- Confirm Tellers cannot edit.

**Expected outcome:** The original financial effect is reversed and replaced with the corrected effect, without double counting.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 12. Transaction Deletion

- Delete disposable Cash In, Cash Out, Internal Transfer, and Capital records.
- Confirm records disappear from active lists and account/fee effects are reversed.
- Delete an edited transaction and verify only the latest posting is reversed.
- Confirm unrelated accounts remain unchanged; refresh and confirm deletion persists.
- Confirm deleted records cannot be edited and repeated deletion does not reverse balances twice.
- Confirm Tellers cannot delete.

**Expected outcome:** Deletion removes the active transaction and reverses its financial effect while retaining historical records.

**Current behavior / note:** Delete actions currently do not have a confirmation dialog.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 13. Internal Transfer

- Test Bank Main to Bank Child and Bank Child to Bank Main.
- Test Cash Main to Cash Child and Cash Child to Cash Main.
- Verify equal source decreases and destination increases; combined funds and fee income must remain unchanged.
- Confirm cross-type and child-to-child transfers are unavailable.
- Test missing accounts and invalid amounts; check reference, direction, amount, note, and timestamp.
- Edit and delete transfers to verify corrected/restored balances; confirm Owner-only access.

**Expected outcome:** Funds move between the global main and selected child of the same type without changing total funds.

**Current behavior / note:** Transfers exceeding source balance are currently allowed. An insufficient-balance warning is requested (UMT-006).

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 14. Capital

- Create Bank and Cash capital deposits; verify matching main-account increases.
- Create Bank and Cash withdrawals; verify matching main-account decreases.
- Confirm child accounts and fee income remain unchanged.
- Test empty, zero, negative, decimal, and nonnumeric amounts.
- Check movement, reference, amount, note, and timestamp.
- Edit amount/movement and delete entries; verify corrected or reversed balances and Owner-only access.

**Expected outcome:** Capital movements affect the matching global main account and owner equity, not fee income.

**Current behavior / note:** Withdrawals exceeding available balance are currently allowed.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 15. Financial Summary

- Compare Bank Main and Cash Main balances with their accounts.
- Compare Bank Children and Cash Children totals with the sums of matching child balances.
- Verify fee income against net fees from active transactions.
- Create, edit, and delete transactions and confirm totals update correctly.
- Confirm Internal Transfer changes distribution, not combined funds.
- Refresh and verify consistent values; confirm Owner-only access.

**Expected outcome:** Financial Summary accurately reflects ledger-derived balances and recognized fee income.

**Current behavior / note:** Main balances are separate from child balances; they do not already include children.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

### 16. Website Navigation

- Open Dashboard, Cash In, Cash Out, Accounts, Transfers, Capital, Users, and Summary.
- Confirm menu, New, Detail, and Edit links open the correct pages.
- Test Back/Forward, refresh, and direct URLs.
- Check mobile horizontal navigation and small-screen forms/buttons.
- Sign out and verify protected routes require authentication.
- Open invalid/deleted URLs; check for broken links, blank pages, or unexpected errors.

**Expected outcome:** Navigation works consistently on desktop and mobile, with protected routes enforcing authentication.

**Result:** [Not provided]  
**Remarks:** [Enter actual results or issue IDs]

## Reported Findings

Priorities are proposed for triage, not agreed severity ratings. All findings are reported observations or requests; development review and retesting are pending.

| ID | Feature / Finding | Priority | Review Status |
|---|---|---|---|
| UMT-001 | Dashboard: missing Bank/Cash label | Low | Reported |
| UMT-002 | Users: success message appears as a button | Low | Reported |
| UMT-003 | Accounts: assignment requires both Bank and Cash | Medium | Needs confirmation |
| UMT-004 | Accounts: assignment message appears as a button | Low | Reported |
| UMT-005 | Internal Transfer: validation message appears as a button | Medium | Reported |
| UMT-006 | Internal Transfer: no insufficient-balance warning | High | Needs confirmation |
| UMT-007 | Cash In / Cash Out: input alignment | Low | Reported |
| UMT-008 | Cash In / Cash Out: Reset does not clear all values | Medium | Needs clarification |
| UMT-009 | Cash In / Cash Out: invalid phone number is accepted | Medium | Reported |

### UMT-001: Dashboard: Missing Bank/Cash Label

**Type:** UI improvement  
**Suggested priority:** Low

**Steps / context:** Open Dashboard and review recent activity.

**Actual behavior:** Recent activity shows account names but does not clearly identify Bank or Cash.

**Expected / requested behavior:** Display a Bank or Cash label beside the account or transaction information.

**Evidence:** [Attach screenshot or recording for UMT-001]  
**Resolution / retest:** [Pending]

### UMT-002: Users: Success Message Appears as a Button

**Type:** UI bug  
**Suggested priority:** Low

**Steps / context:** Create a Teller successfully.

**Actual behavior:** The Teller-created success message appears styled like a button.

**Expected / requested behavior:** Display a clear success notification separate from action buttons.

**Evidence:** [Attach screenshot or recording for UMT-002]  
**Resolution / retest:** [Pending]

### UMT-003: Accounts: Assignment Requires Both Bank and Cash

**Type:** Requirement change / functional issue  
**Suggested priority:** Medium

**Steps / context:** Try assigning only a Bank account or only a Cash account to a Teller.

**Actual behavior:** The form requires both Bank and Cash accounts before saving.

**Expected / requested behavior:** Allow Bank-only, Cash-only, or both assignments according to Teller responsibilities.

**Confirmation needed:** Confirm whether single-account assignment should replace the current rule requiring both.

**Evidence:** [Attach screenshot or recording for UMT-003]  
**Resolution / retest:** [Pending]

### UMT-004: Accounts: Assignment Message Appears as a Button

**Type:** UI bug  
**Suggested priority:** Low

**Steps / context:** Save a Teller account assignment.

**Actual behavior:** "Assignment saved" appears styled like a button.

**Expected / requested behavior:** Display the message as a success notification.

**Evidence:** [Attach screenshot or recording for UMT-004]  
**Resolution / retest:** [Pending]

### UMT-005: Internal Transfer: Validation Message Appears as a Button

**Type:** UI bug  
**Suggested priority:** Medium

**Steps / context:** Submit an Internal Transfer with amount `0`.

**Actual behavior:** "Amount must be greater than zero" appears styled like a button.

**Expected / requested behavior:** Display an error near the amount field or in a clearly styled error notification.

**Evidence:** [Attach screenshot or recording for UMT-005]  
**Resolution / retest:** [Pending]

### UMT-006: Internal Transfer: No Insufficient-Balance Warning

**Type:** Financial validation improvement  
**Suggested priority:** High

**Steps:**
1. Select a child with balance 0 MMK.
2. Transfer 50,000 MMK from Child to Main.
3. Submit the transfer.

**Actual behavior:** The transfer is allowed and the child balance becomes -50,000 MMK without a warning.

**Expected / requested behavior:** Warn when the amount exceeds the source account balance.

**Confirmation needed:** Confirm whether to block the transfer or allow it only after confirmation. If negative balances are prohibited, reject it without financial changes.

**Evidence:** [Attach screenshot or recording for UMT-006]  
**Resolution / retest:** [Pending]

### UMT-007: Cash In / Cash Out: Input Alignment

**Type:** UI bug  
**Suggested priority:** Low

**Steps / context:** Open Cash In/Cash Out and inspect the affected inputs and labels.

**Actual behavior:** Some input boxes and labels are not consistently aligned.

**Expected / requested behavior:** Use consistent alignment, spacing, and sizing on desktop and mobile.

**Evidence needed:** Attach screenshots identifying the exact affected fields, including the reference area if applicable; record screen size.

**Evidence:** [Attach screenshot or recording for UMT-007]  
**Resolution / retest:** [Pending]

### UMT-008: Cash In / Cash Out: Reset Does Not Clear All Values

**Type:** Possible functional bug  
**Suggested priority:** Medium

**Steps:**
1. Enter values in the affected fields.
2. Click Reset.
3. Check remaining values.

**Actual behavior:** Some entered values remain after Reset.

**Expected / requested behavior:** Reset should restore the intended default state.

**Clarification needed:** Identify whether this is search/filter Reset or transaction-form Reset and list remaining fields. Search Reset should clear filters; form Reset may restore defaults.

**Evidence:** [Attach screenshot or recording for UMT-008]  
**Resolution / retest:** [Pending]

### UMT-009: Cash In / Cash Out: Invalid Phone Number Is Accepted

**Type:** Validation bug  
**Suggested priority:** Medium

**Steps / context:** Enter phone `09abccd` and submit an otherwise valid transaction.

**Actual behavior:** Letters are removed, leaving `09`, which is accepted instead of showing an error.

**Expected / requested behavior:** Reject invalid or incomplete phone numbers with a clear message. Formatting characters may be normalized, but letters must not silently produce an accepted incomplete number.

**Evidence:** [Attach screenshot or recording for UMT-009]  
**Resolution / retest:** [Pending]

## Overall Status and Next Steps

| Measure | Status |
|---|---|
| Functional areas covered by checklist | 16 |
| Reported findings / requests | 9 |
| Executed test cases | Not provided |
| Pass / fail / blocked totals | Not provided |
| Release readiness | Not determined from available results |

1. Record actual results for each tested area and identify any untested or blocked checks.
2. Confirm Bank-only/Cash-only assignment and whether insufficient-balance transfers should be blocked or require confirmation.
3. Attach screenshots, browser/device information, and exact remaining Reset values to the affected findings.
4. Fix confirmed defects, retest corrected behavior, and verify account balances and fee income remain accurate.

## Conclusion

The report provides coverage for all 16 UMT Web areas and documents nine reported findings. Financial warning behavior, phone validation, UI feedback, and assignment requirements need attention. Overall pass status and release approval should be determined only after actual outcomes are recorded and fixes are retested.
