import { act, renderHook } from '@testing-library/react-native';

import { useDietChangeForm } from '@/modules/pet-events/forms/useDietChangeForm';
import { useOtherEventForm } from '@/modules/pet-events/forms/useOtherEventForm';
import { usePetEventDateTimeForm } from '@/modules/pet-events/forms/usePetEventDateTimeForm';
import { useSymptomForm } from '@/modules/pet-events/forms/useSymptomForm';

describe('form hooks', () => {
  it('submits and resets the symptom form', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 17, 14, 5));
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useSymptomForm({ onSubmit }));

    act(() => {
      result.current.open();
      result.current.setSymptom('Asthma');
      result.current.setNote('Recovered quickly.');
      result.current.setOccurredDate('16-07-2026');
      result.current.setOccurredTime('09:30');
    });

    let saved = false;
    await act(async () => {
      saved = await result.current.submit();
    });

    expect(saved).toBe(true);
    expect(onSubmit).toHaveBeenCalledWith(
      'Asthma',
      'Recovered quickly.',
      new Date(2026, 6, 16, 9, 30).toISOString(),
    );
    expect(result.current.visible).toBe(false);
    act(() => result.current.open());
    expect(result.current).toMatchObject({
      visible: true,
      symptom: 'Vomiting',
      note: '',
      isDirty: false,
    });
    jest.useRealTimers();
  });

  it('prefills the current event date and time and rejects invalid edits', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 17, 14, 5));
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useSymptomForm({ onSubmit }));

    act(() => result.current.open());

    expect(result.current).toMatchObject({
      occurredDate: '17-07-2026',
      occurredTime: '14:05',
      dateTimeIsValid: true,
    });

    act(() => result.current.setOccurredTime('25:00'));

    expect(result.current.dateTimeIsValid).toBe(false);
    expect(result.current.isDirty).toBe(true);
    await act(async () => {
      expect(await result.current.submit()).toBe(false);
    });
    expect(onSubmit).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('discards an unfinished symptom when the form closes and reopens', () => {
    const { result } = renderHook(() =>
      useSymptomForm({ onSubmit: jest.fn().mockResolvedValue(undefined) }),
    );

    act(() => {
      result.current.open();
      result.current.setSymptom('Hairball');
      result.current.setNote('After breakfast');
    });
    expect(result.current.isDirty).toBe(true);

    act(() => result.current.close());
    expect(result.current.visible).toBe(false);
    act(() => result.current.open());

    expect(result.current).toMatchObject({
      visible: true,
      symptom: 'Vomiting',
      note: '',
      isDirty: false,
    });
  });

  it('submits a structured diet addition and resets the form', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 17, 14, 5));
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDietChangeForm({ currentDiet: [], onSubmit }));

    act(() => {
      result.current.open();
      result.current.setFoodType('snack');
      result.current.setProductName(' Greenies Dental chew ');
      result.current.setOccurredDate('16-07-2026');
      result.current.setOccurredTime('09:30');
    });

    await act(async () => {
      expect(await result.current.submit()).toBe(true);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      {
        type: 'add',
        item: { productName: 'Greenies Dental chew', foodType: 'snack' },
      },
      '',
      new Date(2026, 6, 16, 9, 30).toISOString(),
    );
    expect(result.current.visible).toBe(false);
    act(() => result.current.open());
    expect(result.current).toMatchObject({
      changeType: 'add',
      productName: '',
      foodType: 'dry-food',
    });
    jest.useRealTimers();
  });

  it('requires an existing item before logging that it was stopped', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useDietChangeForm({ currentDiet: [], onSubmit }));

    act(() => {
      result.current.open();
      result.current.setChangeType('remove');
    });

    expect(result.current.itemIsValid).toBe(false);
    await act(async () => {
      expect(await result.current.submit()).toBe(false);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('requires a title and submits a custom event', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 6, 17, 14, 5));
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useOtherEventForm({ onSubmit }));

    act(() => result.current.open());
    await act(async () => {
      expect(await result.current.submit()).toBe(false);
    });
    expect(onSubmit).not.toHaveBeenCalled();

    act(() => {
      result.current.setTitle(' Started sleeping upstairs ');
      result.current.setNote('Near the radiator.');
      result.current.setOccurredDate('16-07-2026');
      result.current.setOccurredTime('09:30');
    });
    await act(async () => {
      expect(await result.current.submit()).toBe(true);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      'Started sleeping upstairs',
      'Near the radiator.',
      new Date(2026, 6, 16, 9, 30).toISOString(),
    );
    expect(result.current.visible).toBe(false);
    act(() => result.current.open());
    expect(result.current).toMatchObject({ title: '', note: '', isDirty: false });
    jest.useRealTimers();
  });

  it('edits and submits a timeline event date and time', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePetEventDateTimeForm({ onSubmit }));

    act(() => {
      result.current.open('event-1', 'Asthma logged', '2026-07-16T09:30:00.000Z');
      result.current.setOccurredDate('17-07-2026');
      result.current.setOccurredTime('10:45');
    });

    expect(result.current).toMatchObject({
      visible: true,
      eventTitle: 'Asthma logged',
      isDirty: true,
      dateTimeIsValid: true,
    });
    await act(async () => {
      expect(await result.current.submit()).toBe(true);
    });

    expect(onSubmit).toHaveBeenCalledWith('event-1', new Date(2026, 6, 17, 10, 45).toISOString());
    expect(result.current.visible).toBe(false);
  });

  it('rejects an invalid timeline event timestamp', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => usePetEventDateTimeForm({ onSubmit }));

    act(() => {
      result.current.open('event-1', 'Asthma logged', '2026-07-16T09:30:00.000Z');
      result.current.setOccurredTime('25:00');
    });

    expect(result.current.dateTimeIsValid).toBe(false);
    await act(async () => {
      expect(await result.current.submit()).toBe(false);
    });
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('opens a saved symptom for editing and submits only the changes', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useSymptomForm({ onSubmit, onUpdate }));
    const occurredAt = new Date(2026, 6, 16, 9, 30).toISOString();

    act(() =>
      result.current.openForEdit({
        id: 'symptom-1',
        petId: 'kiwi',
        type: 'symptom',
        symptom: 'Asthma',
        note: 'Recovered quickly.',
        occurredAt,
        createdAt: occurredAt,
      }),
    );

    expect(result.current).toMatchObject({
      visible: true,
      isEditing: true,
      symptom: 'Asthma',
      note: 'Recovered quickly.',
      occurredDate: '16-07-2026',
      occurredTime: '09:30',
      isDirty: false,
    });
    await act(async () => {
      expect(await result.current.submit()).toBe(false);
    });

    act(() => result.current.setSymptom('Hairball'));
    await act(async () => {
      expect(await result.current.submit()).toBe(true);
    });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onUpdate).toHaveBeenCalledWith('symptom-1', {
      type: 'symptom',
      symptom: 'Hairball',
      note: 'Recovered quickly.',
      occurredAt,
    });
    expect(result.current.visible).toBe(false);
    act(() => result.current.open());
    expect(result.current).toMatchObject({ isEditing: false, symptom: 'Vomiting', note: '' });
  });

  it('keeps edits in the form when saving them fails', async () => {
    const onUpdate = jest.fn().mockRejectedValue(new Error('disk full'));
    const { result } = renderHook(() => useOtherEventForm({ onSubmit: jest.fn(), onUpdate }));
    const occurredAt = new Date(2026, 6, 16, 9, 30).toISOString();

    act(() => {
      result.current.openForEdit({
        id: 'other-1',
        petId: 'kiwi',
        type: 'other',
        title: 'Moved house',
        occurredAt,
        createdAt: occurredAt,
      });
      result.current.setTitle('Moved flat');
    });
    await act(async () => {
      expect(await result.current.submit()).toBe(false);
    });

    expect(result.current).toMatchObject({ visible: true, isEditing: true, title: 'Moved flat' });
  });

  it('edits the item a diet change introduced but not what it replaced', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() =>
      useDietChangeForm({ currentDiet: [], onSubmit: jest.fn(), onUpdate }),
    );
    const occurredAt = new Date(2026, 6, 16, 9, 30).toISOString();
    const change = {
      type: 'replace' as const,
      previousItem: { id: 'old', productName: 'Old kibble', foodType: 'dry-food' as const },
      nextItem: { id: 'new', productName: 'New kibbel', foodType: 'dry-food' as const },
    };

    act(() =>
      result.current.openForEdit({
        id: 'diet-1',
        petId: 'kiwi',
        type: 'diet-change',
        change,
        occurredAt,
        createdAt: occurredAt,
      }),
    );
    expect(result.current).toMatchObject({
      isEditing: true,
      editedChange: change,
      changeType: 'replace',
      productName: 'New kibbel',
      itemIsValid: true,
      isDirty: false,
    });

    act(() => result.current.setProductName('New kibble '));
    await act(async () => {
      expect(await result.current.submit()).toBe(true);
    });

    expect(onUpdate).toHaveBeenCalledWith('diet-1', {
      type: 'diet-change',
      item: { productName: 'New kibble', foodType: 'dry-food' },
      note: '',
      occurredAt,
    });
  });

  it('ignores a second save while the sheet is closing', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useSymptomForm({ onSubmit }));

    act(() => result.current.open());
    await act(async () => {
      expect(await result.current.submit()).toBe(true);
    });
    await act(async () => {
      expect(await result.current.submit()).toBe(false);
    });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
