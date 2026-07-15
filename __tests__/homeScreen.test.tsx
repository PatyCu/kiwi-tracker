import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
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
    fireEvent.press(screen.getByText('Meal'));

    expect(screen.getByText('Log a health event')).toBeTruthy();
    expect(screen.getByText('Vomiting')).toBeTruthy();
  });

  it('validates an impossible birth date in the pet form', async () => {
    const screen = render(<Home />);

    await waitFor(() => expect(screen.getByText('Your pets')).toBeTruthy());
    fireEvent.press(screen.getByLabelText('Add another pet'));
    fireEvent.changeText(screen.getByPlaceholderText('DD-MM-YYYY'), '31-02-2025');

    expect(screen.getByText('Use DD-MM-YYYY and choose today or an earlier date.')).toBeTruthy();
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
