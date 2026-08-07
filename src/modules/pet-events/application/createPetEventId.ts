export function createPetEventId(prefix: string, now: Date): string {
  return `${prefix}-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`;
}
