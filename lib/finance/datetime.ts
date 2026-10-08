const MYANMAR_OFFSET = "+06:30";

export function parseMyanmarDateTime(value: Date | string): Date {
  if (value instanceof Date) return value;
  const normalized = value.trim();
  const timezoneLess = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;
  return new Date(timezoneLess.test(normalized) ? `${normalized}${MYANMAR_OFFSET}` : normalized);
}

export function formatMyanmarDateTimeLocal(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Yangon",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}
