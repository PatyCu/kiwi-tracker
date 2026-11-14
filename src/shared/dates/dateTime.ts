export function formatEventTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const day = isSameDay(date, now)
    ? 'Today'
    : isSameDay(date, yesterday)
      ? 'Yesterday'
      : date.toLocaleDateString([], { day: 'numeric', month: 'short' });

  return `${day} · ${formatClockTime(iso)}`;
}

/**
 * The time of day in as few characters as the device's format allows, such
 * as 9:30am or 09:30, for tight spaces like a calendar cell.
 */
export function formatCompactClockTime(iso: string): string {
  return new Intl.DateTimeFormat([], { hour: 'numeric', minute: '2-digit' })
    .formatToParts(new Date(iso))
    .map((part, index, parts) => {
      if (part.type === 'dayPeriod') return part.value.toLowerCase().replace(/\./g, '');
      // Drops the space before am/pm.
      if (part.type === 'literal' && parts[index + 1]?.type === 'dayPeriod') return '';
      return part.value;
    })
    .join('');
}

/** The time of day, such as 09:30, in the device's format. */
export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

type DisplayedEventDateTime = {
  date: string;
  time: string;
};

export function toDisplayedEventDateTime(value = new Date()): DisplayedEventDateTime {
  const day = String(value.getDate()).padStart(2, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const year = value.getFullYear();
  const hour = String(value.getHours()).padStart(2, '0');
  const minute = String(value.getMinutes()).padStart(2, '0');

  return { date: `${day}-${month}-${year}`, time: `${hour}:${minute}` };
}

export function toEventTimestamp(dateValue: string, timeValue: string): string | null {
  if (!/^\d{2}-\d{2}-\d{4}$/.test(dateValue) || !/^\d{2}:\d{2}$/.test(timeValue)) {
    return null;
  }

  const [day, month, year] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);
  const value = new Date(year, month - 1, day, hour, minute, 0, 0);

  if (
    value.getFullYear() !== year ||
    value.getMonth() !== month - 1 ||
    value.getDate() !== day ||
    value.getHours() !== hour ||
    value.getMinutes() !== minute
  ) {
    return null;
  }

  return value.toISOString();
}

export function isValidDisplayedBirthDate(value: string): boolean {
  return toStoredBirthDate(value) !== null;
}

export function toStoredBirthDate(value: string): string | undefined | null {
  if (!value) return undefined;
  if (!/^\d{2}-\d{2}-\d{4}$/.test(value)) return null;

  const [day, month, year] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getTime() > Date.now()
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function toDisplayedBirthDate(value?: string): string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '';
  const [year, month, day] = value.split('-');
  return `${day}-${month}-${year}`;
}

function isSameDay(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
