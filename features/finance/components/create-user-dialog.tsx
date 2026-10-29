import type { FinancialAccount } from "@/generated/prisma/client";

import { FormDialog } from "./form-dialog";
import { StaffForm } from "./owner-forms";

export function CreateUserDialog({ bank, cash }: { bank: FinancialAccount[]; cash: FinancialAccount[] }) {
  return <FormDialog title="Create user" description="Enter teller details and assign at least one bank or cash account." triggerLabel="Create user">
    <StaffForm bank={bank} cash={cash} className="grid gap-4" />
  </FormDialog>;
}
