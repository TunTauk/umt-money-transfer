import { AlertCircle, TriangleAlert } from "lucide-react";

import { SuccessToast } from "./success-toast";

export function FormNotice({ status, message }: { status: "success" | "error" | "warning"; message: string }) {
  if (status === "success") return <SuccessToast message={message} />;

  const Icon = status === "error" ? AlertCircle : TriangleAlert;
  const colors = status === "error" ? "border-destructive/30 bg-destructive/10 text-destructive"
    : "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100";
  return <div className={`col-span-full flex items-start gap-3 rounded-lg border p-4 text-sm ${colors}`} role="alert" aria-atomic="true">
    <Icon className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
    <div className="min-w-0"><p className="font-semibold">{status === "error" ? "Unable to save" : "Insufficient balance"}</p><p className="mt-1 break-words">{message}</p></div>
  </div>;
}
