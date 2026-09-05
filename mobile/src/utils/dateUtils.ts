export function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayISODate(): string {
  return toISODateString(new Date());
}

export function parseISODate(value?: string | null): Date | null {
  if (!value?.trim()) return null;
  const part = value.trim().split('T')[0]?.split(' ')[0] ?? '';
  const [y, m, d] = part.split('-').map((x) => Number(x));
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

export function formatDisplayDate(value?: string | null): string {
  const d = parseISODate(value ?? '');
  if (!d) return '';
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function parseDateTimeValue(value?: string | null): {
  date: string;
  hour: number;
  minute: number;
} | null {
  if (!value?.trim()) return null;
  const trimmed = value.trim();
  const isoMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})(?:[T ](\d{2}):(\d{2}))?/,
  );
  if (!isoMatch) return null;
  const date = isoMatch[1];
  const hour = isoMatch[2] != null ? Number(isoMatch[2]) : 9;
  const minute = isoMatch[3] != null ? Number(isoMatch[3]) : 0;
  if (!parseISODate(date)) return null;
  return { date, hour, minute };
}

export function formatDateTimeValue(date: string, hour: number, minute: number): string {
  return `${date} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatDisplayDateTime(value?: string | null): string {
  const parsed = parseDateTimeValue(value ?? '');
  if (!parsed) return '';
  return `${formatDisplayDate(parsed.date)} · ${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}`;
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(d: Date, count: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + count, 1);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function buildMonthGrid(viewMonth: Date): (Date | null)[] {
  const first = startOfMonth(viewMonth);
  const startPad = first.getDay();
  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0,
  ).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < startPad; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
