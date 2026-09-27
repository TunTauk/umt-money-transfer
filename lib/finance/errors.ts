export class FinanceError extends Error {
  constructor(
    message: string,
    readonly code:
      | "FORBIDDEN"
      | "INVALID_INPUT"
      | "NOT_FOUND"
      | "CONFLICT",
  ) {
    super(message);
    this.name = "FinanceError";
  }
}

export function financeInvariant(
  condition: unknown,
  message: string,
  code: FinanceError["code"] = "INVALID_INPUT",
): asserts condition {
  if (!condition) {
    throw new FinanceError(message, code);
  }
}
