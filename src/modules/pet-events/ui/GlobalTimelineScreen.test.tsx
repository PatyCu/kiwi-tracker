import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';

import { loadPetEvents } from '@/modules/pet-events/persistence/petEventStore';
import { PetEventFormsProvider } from '@/modules/pet-events/state/PetEventFormsProvider';
import { PetEventsProvider } from '@/modules/pet-events/state/PetEventsProvider';
import { PetProfileFormsProvider } from '@/modules/pets/state/PetProfileFormsProvider';
import { insertPet, loadPets } from '@/modules/pets/persistence/petStore';
import { PetsProvider } from '@/modules/pets/state/PetsProvider';
import { GlobalTimelineScreen } from '@/modules/pet-events/ui/GlobalTimelineScreen';
import { AppearanceProvider } from '@/shared/theme/AppearanceProvider';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    Ionicons: ({ name, ...props }: { name: string }) => React.createElement(Text, props, name),
  };
});

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), setParams: jest.fn() },
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
jest.mock('@/modules/pets/persistence/petPhotoStore', () => ({
  PET_PHOTO_LINK_LIFETIME_SECONDS: 3600,
  withPhotoLinks: jest.fn(async (pets: unknown) => pets),
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

describe('Global timeline screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedLoadEvents.mockResolvedValue([]);
  });

  it('adds the first pet from the empty state when the household has none yet', async () => {
    jest.mocked(loadPets).mockResolvedValue([]);
    jest.mocked(insertPet).mockResolvedValue({ id: 'miso', name: 'Miso', species: 'Cat' });

    const screen = render(<GlobalTimelineScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('No pets yet')).toBeTruthy());
    expect(screen.queryByText('No events for your pets')).toBeNull();
    fireEvent.press(screen.getByText('Add your first pet'));
    fireEvent.changeText(screen.getByPlaceholderText('e.g. Miso'), 'Miso');
    fireEvent.press(screen.getByText('Add pet'));

    await waitFor(() => expect(screen.getByText('No events for your pets')).toBeTruthy());
    expect(screen.queryByText('No pets yet')).toBeNull();
  });

  it('points to where events are logged while the pets have none', async () => {
    jest.mocked(loadPets).mockResolvedValue([{ id: 'kiwi', name: 'Kiwi', species: 'Cat' }]);

    const screen = render(<GlobalTimelineScreen />, { wrapper: Providers });

    await waitFor(() => expect(screen.getByText('No events for your pets')).toBeTruthy());
    expect(
      screen.getByText("Log the first observation from Today or from a pet's page."),
    ).toBeTruthy();
  });

  it('shows nothing until pets and events have loaded', () => {
    jest.mocked(loadPets).mockReturnValue(new Promise(() => undefined));
    mockedLoadEvents.mockReturnValue(new Promise(() => undefined));

    const screen = render(<GlobalTimelineScreen />, { wrapper: Providers });

    expect(screen.queryByText('No pets yet')).toBeNull();
    expect(screen.queryByText('No events for your pets')).toBeNull();
  });
});
