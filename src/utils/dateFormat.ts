const SHORT_MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatDisplayDate(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const ddMmmYyyy = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (ddMmmYyyy) {
    const day = ddMmmYyyy[1].padStart(2, "0");
    const month =
      ddMmmYyyy[2].charAt(0).toUpperCase() +
      ddMmmYyyy[2].slice(1).toLowerCase();
    return `${day}-${month}-${ddMmmYyyy[3]}`;
  }

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const monthIndex = Number(isoMatch[2]) - 1;
    const day = isoMatch[3];
    const monthName = SHORT_MONTHS[monthIndex];
    if (monthName) {
      return `${day}-${monthName}-${year}`;
    }
  }

  return trimmed;
}

export function formatAuditTimestamp(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = pad(date.getDate());
  const month = SHORT_MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}
