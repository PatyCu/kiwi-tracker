export function formatPetNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? '';

  const precedingNames = names.slice(0, -1).join(', ');
  return `${precedingNames} and ${names[names.length - 1]}`;
}
