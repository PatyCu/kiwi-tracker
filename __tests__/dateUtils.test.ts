import {
  formatEventTime,
  isValidDisplayedBirthDate,
  toDisplayedBirthDate,
  toStoredBirthDate,
} from '@/lib/dateUtils';

describe('date utilities', () => {
  it('converts valid birth dates between display and storage formats', () => {
    expect(toStoredBirthDate('05-03-2020')).toBe('2020-03-05');
    expect(toDisplayedBirthDate('2020-03-05')).toBe('05-03-2020');
    expect(isValidDisplayedBirthDate('05-03-2020')).toBe(true);
  });

  it('keeps an empty birth date optional and rejects impossible dates', () => {
    expect(toStoredBirthDate('')).toBeUndefined();
    expect(toDisplayedBirthDate()).toBe('');
    expect(toStoredBirthDate('31-02-2025')).toBeNull();
    expect(isValidDisplayedBirthDate('31-02-2025')).toBe(false);
  });

  it('formats relative event days against an explicit current time', () => {
    const now = new Date('2026-07-15T12:00:00.000Z');

    expect(formatEventTime('2026-07-15T10:30:00.000Z', now)).toContain('Today ·');
    expect(formatEventTime('2026-07-14T10:30:00.000Z', now)).toContain('Yesterday ·');
  });
});
