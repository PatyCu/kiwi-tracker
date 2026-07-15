export function formatEventTime(iso: string, now = new Date()): string {
  const date = new Date(iso);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const day = isSameDay(date, now)
    ? 'Today'
    : isSameDay(date, yesterday)
      ? 'Yesterday'
      : date.toLocaleDateString([], { day: 'numeric', month: 'short' });

  return `${day} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
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
