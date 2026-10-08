export type AccountType = "BANK" | "CASH";
export type CashTransactionType = "CASH_IN" | "CASH_OUT";
export type CapitalTransactionType = "CAPITAL_DEPOSIT" | "CAPITAL_WITHDRAWAL";
export type TransferDirection = "MAIN_TO_CHILD" | "CHILD_TO_MAIN";
export type LedgerSide = "DEBIT" | "CREDIT";
export type SystemLedgerAccount = "CUSTOMER_CLEARING" | "FEE_INCOME" | "OWNER_EQUITY";
export type FeeMode = "DEDUCTED" | "SEPARATE";
export type MoneyInput = bigint | number | string;

export interface FinanceActor {
  id: string;
  role: "OWNER" | "TELLER";
  active: boolean;
}

export type LedgerTarget =
  | { financialAccountId: string; systemAccount?: never }
  | { financialAccountId?: never; systemAccount: SystemLedgerAccount };

export type LedgerPlanEntry = LedgerTarget & {
  side: LedgerSide;
  amount: bigint;
  memo: string;
};

export interface CashTransactionInput {
  reference?: string;
  type: CashTransactionType;
  accountType: AccountType;
  accountId?: string;
  amount: MoneyInput;
  feeAmount: MoneyInput;
  feeMode: FeeMode;
  feeAccountId?: string;
  feeAccountType?: AccountType;
  customerName?: string | null;
  customerPhone: string;
  note?: string | null;
}

export interface InternalTransferInput {
  reference: string;
  accountType: AccountType;
  direction: TransferDirection;
  childAccountId: string;
  amount: MoneyInput;
  note?: string | null;
}

export interface CapitalTransactionInput {
  reference: string;
  accountType: AccountType;
  type: CapitalTransactionType;
  amount: MoneyInput;
  note?: string | null;
}
