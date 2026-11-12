import { act, renderHook } from '@testing-library/react-native';

import { useCalendarEventForm } from '@/modules/calendar-events/forms/useCalendarEventForm';

describe('calendar event form', () => {
  afterEach(() => jest.useRealTimers());

  function openForm(now: Date, onSubmit = jest.fn().mockResolvedValue(undefined)) {
    jest.useFakeTimers();
    jest.setSystemTime(now);
    const hook = renderHook(() => useCalendarEventForm({ onSubmit }));
    act(() => hook.result.current.open());
    return { ...hook, onSubmit };
  }

  it('starts at the next full hour and lasts one hour', () => {
    const { result } = openForm(new Date(2026, 10, 12, 19, 25));

    expect(result.current).toMatchObject({
      visible: true,
      title: '',
      date: '12-11-2026',
      startTime: '20:00',
      endTime: '21:00',
      titleIsValid: false,
      endIsAfterStart: true,
      isDirty: false,
    });
  });

  it('ends by midnight and moves to the next day late in the evening', () => {
    expect(openForm(new Date(2026, 10, 12, 22, 40)).result.current).toMatchObject({
      date: '12-11-2026',
      startTime: '23:00',
      endTime: '23:59',
    });
    expect(openForm(new Date(2026, 10, 12, 23, 10)).result.current).toMatchObject({
      date: '13-11-2026',
      startTime: '00:00',
      endTime: '01:00',
    });
  });

  it('keeps the length when the start moves, and flags an end before the start', () => {
    const { result } = openForm(new Date(2026, 10, 12, 9, 0));

    act(() => result.current.setStartTime('14:30'));
    expect(result.current).toMatchObject({ startTime: '14:30', endTime: '15:30' });

    act(() => result.current.setEndTime('14:00'));
    expect(result.current.endIsAfterStart).toBe(false);
  });

  it('submits trimmed values, leaves out empty optional fields and closes', async () => {
    const { result, onSubmit } = openForm(new Date(2026, 10, 12, 9, 0));

    act(() => {
      result.current.setTitle('  Annual vaccines ');
      result.current.setDate('15-11-2026');
      result.current.setLocation('   ');
      result.current.setDescription(' Bring the card. ');
    });
    let saved = false;
    await act(async () => {
      saved = await result.current.submit();
    });

    expect(saved).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith({
      title: 'Annual vaccines',
      startsAt: new Date(2026, 10, 15, 10, 0).toISOString(),
      endsAt: new Date(2026, 10, 15, 11, 0).toISOString(),
      description: 'Bring the card.',
    });
    expect(result.current.visible).toBe(false);
  });

  it('accepts dates in the past', async () => {
    const { result, onSubmit } = openForm(new Date(2026, 10, 12, 9, 0));

    act(() => {
      result.current.setTitle('Vet visit');
      result.current.setDate('01-10-2026');
    });
    await act(async () => {
      await result.current.submit();
    });

    expect(onSubmit).toHaveBeenCalled();
  });

  it('does not submit without a title or with an end before the start', async () => {
    const { result, onSubmit } = openForm(new Date(2026, 10, 12, 9, 0));

    await act(async () => {
      expect(await result.current.submit()).toBe(false);
    });
    act(() => {
      result.current.setTitle('Vet visit');
      result.current.setEndTime('09:00');
    });
    await act(async () => {
      expect(await result.current.submit()).toBe(false);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the form open with its values when saving fails', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('offline'));
    const { result } = openForm(new Date(2026, 10, 12, 9, 0), onSubmit);

    act(() => result.current.setTitle('Vet visit'));
    let saved = true;
    await act(async () => {
      saved = await result.current.submit();
    });

    expect(saved).toBe(false);
    expect(result.current).toMatchObject({ visible: true, title: 'Vet visit', isSaving: false });
  });
});
