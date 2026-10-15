import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { removeTransaction } from "@/features/finance/actions";

export function TransactionRowActions({ id, base, returnTo = base }: { id: string; base: string; returnTo?: string }) {
  return <div className="absolute right-14 top-4 flex w-20 justify-end gap-1 sm:w-40">
    <Button asChild variant="outline" size="sm" className="size-8 p-0 sm:w-auto sm:px-3">
      <Link href={`${base}/${id}/edit`} title="Edit transaction"><Pencil className="size-4" aria-hidden="true" /><span className="sr-only sm:not-sr-only">Edit</span></Link>
    </Button>
    <form action={removeTransaction}>
      <input type="hidden" name="id" value={id} /><input type="hidden" name="returnTo" value={returnTo} />
      <Button variant="ghost" size="sm" className="size-8 p-0 text-destructive sm:w-auto sm:px-3" title="Delete transaction"><Trash2 className="size-4" aria-hidden="true" /><span className="sr-only sm:not-sr-only">Delete</span></Button>
    </form>
  </div>;
}
