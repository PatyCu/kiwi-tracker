import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import Home from '@/app/index';
import { toDisplayedEventDateTime, toEventTimestamp } from '@/lib/dateUtils';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }: { name: string }) => React.createElement(Text, null, name),
  };
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockedStorage = jest.mocked(AsyncStorage);

describe('home screen behavior', () => {
  beforeEach(() => {
    mockedStorage.clear();
    jest.clearAllMocks();
  });

  it('opens the dedicated diet-change form from quick log', async () => {
    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Your pets')).toBeTruthy());
    fireEvent.press(screen.getByText('Diet change'));

    expect(screen.getByText('Log a diet change')).toBeTruthy();
    expect(
      screen.getByRole('button', { name: 'Added an item' }).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(
      screen.getByRole('button', { name: 'Switched an item' }).props.accessibilityState,
    ).toMatchObject({ disabled: true });
    expect(screen.queryByText('WHAT DID THIS REPLACE?')).toBeNull();
    expect(screen.getByLabelText('Diet change date').props.accessibilityValue.text).toMatch(
      /^\d{2}-\d{2}-\d{4}$/,
    );
    expect(screen.getByLabelText('Diet change time').props.accessibilityValue.text).toMatch(
      /^\d{2}:\d{2}$/,
    );
    expect(screen.getByLabelText(Platform.OS === 'ios' ? 'Cancel' : 'Close')).toBeTruthy();
  });

  it('logs a diet addition and displays it on the timeline', async () => {
    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Your pets')).toBeTruthy());
    fireEvent.press(screen.getByText('Diet change'));
    fireEvent.press(screen.getByText('Added an item'));
    fireEvent.press(screen.getByLabelText('Food type'));
    fireEvent.press(screen.getByLabelText('Select Snack'));
    fireEvent.changeText(screen.getByLabelText('Diet product name'), 'Greenies Dental chew');
    fireEvent.press(screen.getByText('Save diet change'));

    await waitFor(() => expect(screen.getByText('Added Greenies Dental chew')).toBeTruthy());
    await expect(mockedStorage.getItem('@kiwi-tracker/timeline-events/v1')).resolves.toContain(
      'diet-change',
    );

    fireEvent.press(screen.getByText('Diet change'));
    expect(
      screen.getByRole('button', { name: 'Switched an item' }).props.accessibilityState,
    ).toMatchObject({ disabled: false });
  });

  it('logs a custom event from Other and displays it on the timeline', async () => {
    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Your pets')).toBeTruthy());
    fireEvent.press(screen.getByText('Other'));

    expect(screen.getByText('Log another event')).toBeTruthy();
    const saveButton = screen.getByRole('button', { name: 'Save event' });
    expect(saveButton.props.accessibilityState).toMatchObject({ disabled: true });

    fireEvent.changeText(screen.getByLabelText('Event title'), 'Started sleeping upstairs');
    fireEvent.changeText(screen.getByLabelText('Event notes'), 'Near the radiator.');
    fireEvent.press(saveButton);

    await waitFor(() => expect(screen.getByText('Started sleeping upstairs')).toBeTruthy());
    expect(screen.getByText('Near the radiator.')).toBeTruthy();
    await expect(mockedStorage.getItem('@kiwi-tracker/timeline-events/v1')).resolves.toContain(
      '"type":"other"',
    );
  });

  it('selects a birth date from a picker bounded to today', async () => {
    const testStartedAt = Date.now();
    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Your pets')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Add another pet'));
    fireEvent.press(screen.getByLabelText('Date of birth'));

    const picker = screen.getByTestId('Date of birth-picker');
    const maximumDate = new Date(picker.props.maximumDate).getTime();
    expect(maximumDate).toBeGreaterThanOrEqual(testStartedAt);
    expect(maximumDate).toBeLessThanOrEqual(Date.now());
    const selectedDate = new Date(2020, 2, 5, 12);
    fireEvent(
      picker,
      'valueChange',
      { nativeEvent: { timestamp: selectedDate.getTime(), utcOffset: 0 } },
      selectedDate,
    );
    fireEvent.press(screen.getByLabelText('Confirm date selection'));

    expect(screen.getByLabelText('Date of birth').props.accessibilityValue.text).toBe('05-03-2020');
  });

  it('confirms before discarding an edited symptom on web', async () => {
    const originalPlatform = Platform.OS;
    const hadConfirm = 'confirm' in window;
    const originalConfirm = window.confirm;
    Object.defineProperty(Platform, 'OS', { configurable: true, value: 'web' });
    const confirm = jest.fn().mockReturnValue(false);
    Object.defineProperty(window, 'confirm', { configurable: true, value: confirm });

    try {
      const screen = render(<Home />);

      await waitFor(() => expect(screen.getByText('Your pets')).toBeTruthy());
      fireEvent.press(screen.getByText('Symptom'));
      fireEvent.changeText(
        screen.getByPlaceholderText('Add useful context for your vet…'),
        'Temporary note',
      );
      fireEvent.press(screen.getByLabelText('Close'));

      expect(confirm).toHaveBeenCalledWith(
        'Discard this symptom?\n\nYour changes will not be saved.',
      );
      expect(screen.getByText('Log a symptom')).toBeTruthy();

      confirm.mockReturnValue(true);
      fireEvent.press(screen.getByLabelText('Close'));

      expect(screen.queryByText('Log a symptom')).toBeNull();
    } finally {
      if (hadConfirm) {
        Object.defineProperty(window, 'confirm', { configurable: true, value: originalConfirm });
      } else {
        Reflect.deleteProperty(window, 'confirm');
      }
      Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
    }
  });

  it('edits an existing timeline event date and time', async () => {
    const originalOccurredAt = '2026-07-16T09:30:00.000Z';
    await mockedStorage.setItem(
      '@kiwi-tracker/timeline-events/v1',
      JSON.stringify([
        {
          id: 'event-1',
          petId: 'kiwi',
          type: 'symptom',
          symptom: 'Asthma',
          occurredAt: originalOccurredAt,
          recordedAt: '2026-07-16T09:31:00.000Z',
        },
      ]),
    );
    const expectedDisplay = toDisplayedEventDateTime(new Date(originalOccurredAt));
    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Asthma logged')).toBeTruthy());
    fireEvent.press(screen.getByLabelText(/Edit date and time for Asthma logged/));

    expect(screen.getByText('Edit date and time')).toBeTruthy();
    expect(screen.getByLabelText('Updated event date').props.accessibilityValue.text).toBe(
      expectedDisplay.date,
    );
    expect(screen.getByLabelText('Updated event time').props.accessibilityValue.text).toBe(
      expectedDisplay.time,
    );
    const selectedTime = new Date(2026, 6, 16, 12, 45);
    fireEvent(
      screen.getByTestId('Updated event time-picker'),
      'valueChange',
      { nativeEvent: { timestamp: selectedTime.getTime(), utcOffset: 0 } },
      selectedTime,
    );
    fireEvent.press(screen.getByText('Save date and time'));

    const expectedOccurredAt = toEventTimestamp(expectedDisplay.date, '12:45');
    await waitFor(async () => {
      const stored = JSON.parse(
        (await mockedStorage.getItem('@kiwi-tracker/timeline-events/v1')) ?? '[]',
      );
      expect(stored[0].occurredAt).toBe(expectedOccurredAt);
    });
    expect(screen.queryByText('Edit date and time')).toBeNull();
  });

  it('reorders timeline events after editing an older event to occur most recently', async () => {
    await mockedStorage.setItem(
      '@kiwi-tracker/timeline-events/v1',
      JSON.stringify([
        {
          id: 'older-event',
          petId: 'kiwi',
          type: 'symptom',
          symptom: 'Asthma',
          occurredAt: '2026-07-16T09:30:00.000Z',
          recordedAt: '2026-07-16T09:31:00.000Z',
        },
        {
          id: 'newer-event',
          petId: 'kiwi',
          type: 'symptom',
          symptom: 'Vomiting',
          occurredAt: '2026-07-17T09:30:00.000Z',
          recordedAt: '2026-07-17T09:31:00.000Z',
        },
      ]),
    );
    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Asthma logged')).toBeTruthy());
    expect(
      screen
        .getAllByText(/^(Vomiting|Asthma) logged$/)
        .map((eventTitle) => eventTitle.props.children),
    ).toEqual(['Vomiting logged', 'Asthma logged']);

    fireEvent.press(screen.getByLabelText(/Edit date and time for Asthma logged/));
    const movedOccurredAt = new Date(2026, 6, 18, 9, 30);
    fireEvent(
      screen.getByTestId('Updated event date-picker'),
      'valueChange',
      { nativeEvent: { timestamp: movedOccurredAt.getTime(), utcOffset: 0 } },
      movedOccurredAt,
    );
    fireEvent.press(screen.getByText('Save date and time'));

    await waitFor(() =>
      expect(
        screen
          .getAllByText(/^(Vomiting|Asthma) logged$/)
          .map((eventTitle) => eventTitle.props.children),
      ).toEqual(['Asthma logged', 'Vomiting logged']),
    );
  });

  it('cancels and confirms timeline deletion through the app dialog', async () => {
    await mockedStorage.setItem(
      '@kiwi-tracker/timeline-events/v1',
      JSON.stringify([
        {
          id: 'event-1',
          petId: 'kiwi',
          type: 'symptom',
          symptom: 'Asthma',
          note: 'Recovered quickly.',
          occurredAt: '2026-07-16T09:30:00.000Z',
          recordedAt: '2026-07-16T09:31:00.000Z',
        },
      ]),
    );

    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Recovered quickly.')).toBeTruthy());
    const deleteButton = screen.getByLabelText(/Delete timeline event: Asthma logged/);
    fireEvent.press(deleteButton);

    expect(screen.getByText('Delete this event?')).toBeTruthy();
    expect(screen.getByText("This will permanently remove it from Kiwi's timeline.")).toBeTruthy();
    fireEvent.press(screen.getByText('Cancel'));

    expect(screen.queryByText('Delete this event?')).toBeNull();
    expect(screen.getByText('Recovered quickly.')).toBeTruthy();

    fireEvent.press(deleteButton);
    fireEvent.press(screen.getByText('Delete'));
    await waitFor(() =>
      expect(mockedStorage.setItem).toHaveBeenLastCalledWith(
        '@kiwi-tracker/timeline-events/v1',
        '[]',
      ),
    );

    await waitFor(() => expect(screen.queryByText('Recovered quickly.')).toBeNull());
    expect(screen.getByText('No events for Kiwi')).toBeTruthy();
    expect(screen.queryByText('Delete this event?')).toBeNull();
    await expect(mockedStorage.getItem('@kiwi-tracker/timeline-events/v1')).resolves.toBe('[]');
  });

  it('keeps the delete dialog open with an inline error when storage fails', async () => {
    await mockedStorage.setItem(
      '@kiwi-tracker/timeline-events/v1',
      JSON.stringify([
        {
          id: 'event-1',
          petId: 'kiwi',
          type: 'symptom',
          symptom: 'Asthma',
          note: 'Recovered quickly.',
          occurredAt: '2026-07-16T09:30:00.000Z',
          recordedAt: '2026-07-16T09:31:00.000Z',
        },
      ]),
    );
    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Recovered quickly.')).toBeTruthy());
    mockedStorage.setItem.mockRejectedValueOnce(new Error('disk full'));
    fireEvent.press(screen.getByLabelText(/Delete timeline event: Asthma logged/));
    fireEvent.press(screen.getByText('Delete'));

    await waitFor(() =>
      expect(
        screen.getByText('This event could not be deleted. It is still saved. Please try again.'),
      ).toBeTruthy(),
    );
    expect(screen.getByText('Delete this event?')).toBeTruthy();
    expect(screen.getByText('Recovered quickly.')).toBeTruthy();
  });

  it('blocks the dashboard after a load failure and recovers through retry', async () => {
    mockedStorage.getItem.mockRejectedValueOnce(new Error('storage unavailable'));
    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Could not load your data')).toBeTruthy());
    expect(screen.queryByText('Quick log')).toBeNull();

    fireEvent.press(screen.getByText('Retry'));

    await waitFor(() => expect(screen.getByText('Your pets')).toBeTruthy());
  });
});
