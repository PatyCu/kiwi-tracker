import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import Home from '@/app/index';

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

  it('opens the existing health-event form from quick log', async () => {
    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Your pets')).toBeTruthy());
    fireEvent.press(screen.getByText('Diet change'));

    expect(screen.getByText('Log a health event')).toBeTruthy();
    expect(screen.getByText('Vomiting')).toBeTruthy();
    expect(screen.getByLabelText('Event date').props.value).toMatch(/^\d{2}-\d{2}-\d{4}$/);
    expect(screen.getByLabelText('Event time').props.value).toMatch(/^\d{2}:\d{2}$/);
    expect(screen.getByLabelText(Platform.OS === 'ios' ? 'Cancel' : 'Close')).toBeTruthy();
  });

  it('validates an impossible birth date in the pet form', async () => {
    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Your pets')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Add another pet'));
    fireEvent.changeText(screen.getByPlaceholderText('DD-MM-YYYY'), '31-02-2025');

    expect(screen.getByText('Use DD-MM-YYYY and choose today or an earlier date.')).toBeTruthy();
  });

  it('confirms before discarding an edited health event on web', async () => {
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
        'Discard this event?\n\nYour changes will not be saved.',
      );
      expect(screen.getByText('Log a health event')).toBeTruthy();

      confirm.mockReturnValue(true);
      fireEvent.press(screen.getByLabelText('Close'));

      expect(screen.queryByText('Log a health event')).toBeNull();
    } finally {
      if (hadConfirm) {
        Object.defineProperty(window, 'confirm', { configurable: true, value: originalConfirm });
      } else {
        Reflect.deleteProperty(window, 'confirm');
      }
      Object.defineProperty(Platform, 'OS', { configurable: true, value: originalPlatform });
    }
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
