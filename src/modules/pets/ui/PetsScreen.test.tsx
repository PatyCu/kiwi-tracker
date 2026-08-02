import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { PetEventFormsProvider } from '@/modules/pet-events/state/PetEventFormsProvider';
import { PetEventsProvider } from '@/modules/pet-events/state/PetEventsProvider';
import { PetProfileFormsProvider } from '@/modules/pets/state/PetProfileFormsProvider';
import { PetsProvider } from '@/modules/pets/state/PetsProvider';
import { PetsScreen } from '@/modules/pets/ui/PetsScreen';
import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';

let mockPetId: string | undefined;

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: { name: string }) => React.createElement(Text, props, name),
  };
});

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), setParams: jest.fn() },
  useLocalSearchParams: () => ({ petId: mockPetId }),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const storage = jest.mocked(AsyncStorage);

function Providers({ children }: { children: ReactNode }) {
  return (
    <AppearanceProvider>
      <PetsProvider>
        <PetEventsProvider>
          <PetProfileFormsProvider>
            <PetEventFormsProvider>{children}</PetEventFormsProvider>
          </PetProfileFormsProvider>
        </PetEventsProvider>
      </PetsProvider>
    </AppearanceProvider>
  );
}

describe('Pets screen', () => {
  beforeEach(async () => {
    await storage.clear();
    jest.clearAllMocks();
    mockPetId = 'luna';
    await storage.setItem(
      '@kiwi-tracker/pet-state/v2',
      JSON.stringify({
        version: 2,
        activePetId: 'kiwi',
        pets: [
          {
            id: 'kiwi',
            name: 'Kiwi',
            species: 'Cat',
            createdAt: '2025-01-01T00:00:00.000Z',
          },
          {
            id: 'luna',
            name: 'Luna',
            species: 'Dog',
            createdAt: '2025-01-02T00:00:00.000Z',
          },
        ],
      }),
    );
  });

  it('shows the selected pet overview without an intermediate list screen', async () => {
    const screen = render(<PetsScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('Today with Luna')).toBeTruthy());
    expect(screen.getByLabelText('Luna, selected pet').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.getByText('Edit pet')).toBeTruthy();
    expect(screen.queryByLabelText('View Luna')).toBeNull();
  });

  it('changes the explicit pet selection without pushing another screen', async () => {
    const screen = render(<PetsScreen />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText('Today with Luna')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Kiwi'));

    expect(jest.requireMock('expo-router').router.setParams).toHaveBeenCalledWith({
      petId: 'kiwi',
    });
    expect(jest.requireMock('expo-router').router.push).not.toHaveBeenCalled();
  });
});
