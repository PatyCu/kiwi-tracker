/** 0 is Sunday, 1 is Monday, and so on, as in Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A calendar month: the year and the month index, 0 for January. */
export type CalendarMonth = { year: number; month: number };

/** One week of the month; days outside the month are null. */
export type CalendarWeek = (Date | null)[];

const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function monthOf(date: Date): CalendarMonth {
  return { year: date.getFullYear(), month: date.getMonth() };
}

/** The month before (-1) or after (+1) the given one. */
export function shiftMonth({ year, month }: CalendarMonth, offset: number): CalendarMonth {
  return monthOf(new Date(year, month + offset, 1));
}

export function isInMonth(date: Date, { year, month }: CalendarMonth): boolean {
  return date.getFullYear() === year && date.getMonth() === month;
}

/**
 * The month's weeks, each starting on weekStartsOn, as local dates. Cells
 * before the first and after the last day of the month are null.
 */
export function buildMonthGrid(
  { year, month }: CalendarMonth,
  weekStartsOn: Weekday,
): CalendarWeek[] {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingBlanks = (new Date(year, month, 1).getDay() - weekStartsOn + 7) % 7;
  const cells: (Date | null)[] = Array.from({ length: leadingBlanks }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: CalendarWeek[] = [];
  for (let index = 0; index < cells.length; index += 7) weeks.push(cells.slice(index, index + 7));
  return weeks;
}

/** Short weekday names in grid order, such as Mon … Sun. */
export function weekdayNames(weekStartsOn: Weekday): string[] {
  return Array.from({ length: 7 }, (_, index) => WEEKDAY_NAMES[(weekStartsOn + index) % 7]);
}

/** Identifies a local calendar day, such as 2026-11-04. */
export function toDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}
