# Account Management Screen

Design reference: [`design/design.pen`](../design/design.pen), node `QU5zW`.

## Access

Owner only. Tellers cannot navigate to or query Accounts.

## Layout

The screen has **BANK** and **CASH** tabs. Within each tab:

1. Show the single real main account first, with its independent live balance.
2. Show child accounts below, with each independent balance and active state.
3. Show active staff assignments on each child.

The UI must not present a main balance as including child balances. A separate
child total may be shown. Each type starts with four children, and the Owner can
add more.

## Assignments

The Owner assigns staff from this screen. Every active Teller must have exactly
one active child Bank and one active child Cash assignment. A child can have at
most two active staff. Main accounts cannot show or accept assignments.

Assignment controls must prevent violating those limits and retain historical
assignment records when reassigned. Account edit/deactivation controls must
also prevent leaving an active Teller without the required pair.
