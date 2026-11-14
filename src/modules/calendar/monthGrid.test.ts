import {
  buildMonthGrid,
  isInMonth,
  shiftMonth,
  toDayKey,
  weekdayNames,
} from '@/modules/calendar/monthGrid';

const dayNumbers = (week: (Date | null)[]) => week.map((day) => day?.getDate() ?? null);

describe('month grid', () => {
  it('starts weeks on Monday and leaves days outside the month empty', () => {
    // November 2026 starts on a Sunday and has 30 days.
    const weeks = buildMonthGrid({ year: 2026, month: 10 }, 1);

    expect(weeks).toHaveLength(6);
    expect(dayNumbers(weeks[0])).toEqual([null, null, null, null, null, null, 1]);
    expect(dayNumbers(weeks[1])).toEqual([2, 3, 4, 5, 6, 7, 8]);
    expect(dayNumbers(weeks[5])).toEqual([30, null, null, null, null, null, null]);
  });

  it('follows another week start', () => {
    const weeks = buildMonthGrid({ year: 2026, month: 10 }, 0);

    expect(weeks).toHaveLength(5);
    expect(dayNumbers(weeks[0])).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(dayNumbers(weeks[4])).toEqual([29, 30, null, null, null, null, null]);
    expect(weekdayNames(0)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(weekdayNames(1)).toEqual(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  });

  it('handles leap years', () => {
    const days = buildMonthGrid({ year: 2028, month: 1 }, 1).flat().filter(Boolean);
    expect(days).toHaveLength(29);
  });

  it('moves between months across years', () => {
    expect(shiftMonth({ year: 2026, month: 11 }, 1)).toEqual({ year: 2027, month: 0 });
    expect(shiftMonth({ year: 2026, month: 0 }, -1)).toEqual({ year: 2025, month: 11 });
    expect(isInMonth(new Date(2026, 10, 30), { year: 2026, month: 10 })).toBe(true);
    expect(isInMonth(new Date(2026, 11, 1), { year: 2026, month: 10 })).toBe(false);
  });

  it('keys days by their local date', () => {
    expect(toDayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });
});
