import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { StyleSheet } from 'react-native';

import { PetEvent } from '@/modules/pet-events/model/PetEvent';
import { loadPetEvents } from '@/modules/pet-events/persistence/petEventStore';
import { PetEventFormsProvider } from '@/modules/pet-events/state/PetEventFormsProvider';
import { PetEventsProvider } from '@/modules/pet-events/state/PetEventsProvider';
import { PetProfileFormsProvider } from '@/modules/pets/state/PetProfileFormsProvider';
import { loadPets } from '@/modules/pets/persistence/petStore';
import { PetsProvider } from '@/modules/pets/state/PetsProvider';
import { useHouseholdAlias } from '@/modules/households/state/useHouseholdAlias';
import { PetsScreen } from '@/modules/pets/ui/PetsScreen';
import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';
import { lightColors } from '@/shared/theme/palette';

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

jest.mock('@/modules/households/state/useHouseholdAlias', () => ({
  useHouseholdAlias: jest.fn(() => null),
}));

jest.mock('@/modules/auth/state/SessionProvider', () => ({
  useSession: () => ({
    session: { status: 'signed-in', user: { id: 'alex', email: 'alex@kiwi.test' } },
    signOut: jest.fn(),
  }),
}));

jest.mock('@/modules/households/state/HouseholdProvider', () => ({
  useHousehold: () => ({
    household: { status: 'ready', id: 'alexs-home', alias: "Alex's home" },
    retryLoad: jest.fn(),
  }),
}));

jest.mock('@/modules/pets/persistence/petStore', () => ({
  loadPets: jest.fn(),
  insertPet: jest.fn(),
  updatePet: jest.fn(),
}));
jest.mock('@/modules/pet-events/persistence/petEventStore', () => ({
  loadPetEvents: jest.fn(),
  insertPetEvent: jest.fn(),
  updatePetEvent: jest.fn(),
  deletePetEvent: jest.fn(),
}));

const mockedLoadEvents = jest.mocked(loadPetEvents);

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
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useHouseholdAlias).mockReturnValue(null);
    mockPetId = 'luna';
    jest.mocked(loadPets).mockResolvedValue([
      { id: 'kiwi', name: 'Kiwi', species: 'Cat', breed: 'Siamese' },
      { id: 'luna', name: 'Luna', species: 'Dog' },
    ]);
    mockedLoadEvents.mockResolvedValue([]);
  });

  it('shows the selected pet overview without an intermediate list screen', async () => {
    const screen = render(<PetsScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('Today with Luna')).toBeTruthy());
    expect(screen.getByText('Your pets')).toBeTruthy();
    expect(screen.getByLabelText('Luna, selected pet').props.accessibilityState).toEqual({
      selected: true,
    });
    expect(screen.getByText('Overview')).toBeTruthy();
    expect(screen.queryByText('Edit pet')).toBeNull();
    expect(screen.getAllByText('Edit')).toHaveLength(2);
    expect(screen.getByLabelText('Kiwi avatar')).toBeTruthy();
    expect(screen.getByLabelText('Luna avatar')).toBeTruthy();
    expect(screen.queryByText('Siamese')).toBeNull();
    expect(screen.queryByText('Dog')).toBeNull();
    const activityCard = screen.getByTestId('pet-activity-card');
    expect(activityCard.findByProps({ children: 'Add event' })).toBeTruthy();
    expect(activityCard.findByProps({ children: 'Recent timeline' })).toBeTruthy();
    expect(screen.queryByLabelText('View Luna')).toBeNull();
  });

  it('names the household in the header once its alias loads', async () => {
    jest.mocked(useHouseholdAlias).mockReturnValue('The Burrow');

    const screen = render(<PetsScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('Pets in The Burrow')).toBeTruthy());
    expect(screen.queryByText('Your pets')).toBeNull();
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

  it('opens the existing profile modal from the pet selector card', async () => {
    const screen = render(<PetsScreen />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText('Today with Luna')).toBeTruthy());

    fireEvent.press(screen.getByLabelText('Edit profile for Kiwi'));

    expect(screen.getByTestId('pet-profile-modal')).toBeTruthy();
    expect(screen.getByText('Edit pet')).toBeTruthy();
    expect(screen.getByDisplayValue('Kiwi')).toBeTruthy();
    expect(jest.requireMock('expo-router').router.setParams).not.toHaveBeenCalled();
    expect(jest.requireMock('expo-router').router.push).not.toHaveBeenCalled();
  });

  it('uses secondary underlined copy and reveals the pencil on hover', async () => {
    const screen = render(<PetsScreen />, { wrapper: Providers });
    await waitFor(() => expect(screen.getByText('Today with Luna')).toBeTruthy());
    const editProfile = screen.getByLabelText('Edit profile for Kiwi');
    const editProfileTextStyle = StyleSheet.flatten(
      screen.getByTestId('pet-edit-profile-text-kiwi').props.style,
    );

    expect(editProfileTextStyle).toEqual(
      expect.objectContaining({
        color: lightColors.muted,
        fontSize: 10,
        textDecorationLine: 'underline',
      }),
    );
    expect(editProfileTextStyle.fontWeight).toBeUndefined();
    expect(screen.getByTestId('pet-edit-profile-icon-kiwi').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
    );
    fireEvent(editProfile, 'hoverIn');

    expect(screen.getByTestId('pet-edit-profile-icon-kiwi').props.style).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ opacity: 0 })]),
    );
  });

  it('shows all recorded events for the selected pet in its recent timeline', async () => {
    const createdAt = new Date().toISOString();
    mockedLoadEvents.mockResolvedValue(
      ['First', 'Second', 'Third', 'Fourth'].map((title, index): PetEvent => ({
        id: `event-${index}`,
        petId: 'luna',
        type: 'other',
        title,
        occurredAt: new Date(Date.now() - index * 60_000).toISOString(),
        createdAt,
      })),
    );

    const screen = render(<PetsScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('Today with Luna')).toBeTruthy());
    expect(screen.getByText('First')).toBeTruthy();
    expect(screen.getByText('Second')).toBeTruthy();
    expect(screen.getByText('Third')).toBeTruthy();
    expect(screen.getByText('Fourth')).toBeTruthy();
  });
});
