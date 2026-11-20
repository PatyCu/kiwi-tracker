/**
 * Turns one option of a calendar filter on or off, keeping the options' order.
 * The last selected option stays on, so the calendar is never empty by choice.
 * Every option selected is how a filter shows everything.
 */
export function toggleSelection<T extends string>(
  options: readonly T[],
  selected: readonly T[],
  value: T,
): T[] {
  const isSelected = selected.includes(value);
  if (isSelected && selected.length === 1) return [...selected];
  return options.filter((option) => (option === value ? !isSelected : selected.includes(option)));
}
